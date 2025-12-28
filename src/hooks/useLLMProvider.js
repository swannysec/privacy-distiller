/**
 * @file LLM Provider hook
 * @description Hook for interacting with LLM providers
 */

import { useState, useCallback } from 'react';
import { useLLMConfig } from '../contexts/LLMConfigContext.jsx';
import { ANALYSIS_CONFIG, ERROR_CODES, ERROR_MESSAGES } from '../utils/constants.js';
import { retry } from '../utils/helpers.js';

/**
 * Hook for LLM provider interactions
 * @returns {Object} LLM provider utilities
 */
export function useLLMProvider() {
  const { config, validateConfig } = useLLMConfig();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Sends a completion request to the LLM
   * @param {string} prompt - Prompt to send
   * @param {Object} options - Additional options
   * @returns {Promise<string>} LLM response
   */
  const complete = useCallback(async (prompt, options = {}) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Validate config
      if (!validateConfig()) {
        throw new Error(ERROR_MESSAGES[ERROR_CODES.INVALID_API_KEY]);
      }

      const requestBody = {
        model: config.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: options.temperature ?? config.temperature,
        max_tokens: options.maxTokens ?? config.maxTokens,
      };

      // Add API key for OpenRouter
      const headers = {
        'Content-Type': 'application/json',
      };

      if (config.provider === 'openrouter') {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'Privacy Policy Analyzer';
      }

      // Make request with retry logic
      const response = await retry(
        async () => {
          const controller = new AbortController();
          const timeoutId = setTimeout(
            () => controller.abort(),
            ANALYSIS_CONFIG.TIMEOUT_MS
          );

          try {
            const res = await fetch(`${config.baseUrl}/chat/completions`, {
              method: 'POST',
              headers,
              body: JSON.stringify(requestBody),
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!res.ok) {
              if (res.status === 429) {
                throw new Error(ERROR_MESSAGES[ERROR_CODES.LLM_RATE_LIMITED]);
              }
              throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            return res;
          } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
              throw new Error(ERROR_MESSAGES[ERROR_CODES.LLM_TIMEOUT]);
            }
            throw err;
          }
        },
        ANALYSIS_CONFIG.RETRY_ATTEMPTS,
        ANALYSIS_CONFIG.RETRY_DELAY_MS
      );

      const data = await response.json();

      // Extract response text
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error(ERROR_MESSAGES[ERROR_CODES.LLM_INVALID_RESPONSE]);
      }

      const responseText = data.choices[0].message.content;

      setIsProcessing(false);
      return responseText;

    } catch (err) {
      const errorMessage = err.message || ERROR_MESSAGES[ERROR_CODES.LLM_REQUEST_FAILED];
      setError(errorMessage);
      setIsProcessing(false);
      throw new Error(errorMessage);
    }
  }, [config, validateConfig]);

  /**
   * Clears error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    complete,
    isProcessing,
    error,
    clearError,
    config,
  };
}
