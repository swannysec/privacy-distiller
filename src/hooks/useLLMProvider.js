/**
 * @file LLM Provider hook
 * @description Hook for interacting with LLM providers
 */

import { useState, useCallback } from "react";
import { useLLMConfig } from "../contexts/LLMConfigContext.jsx";
import {
  ANALYSIS_CONFIG,
  ERROR_CODES,
  ERROR_MESSAGES,
} from "../utils/constants.js";
import { retry } from "../utils/helpers.js";
import { refreshLLMConfigTimestamp } from "../utils/storage.js";

/**
 * Simple token bucket rate limiter
 * Prevents API abuse by limiting requests to max 10 per minute
 */
class TokenBucket {
  constructor(capacity, refillRate) {
    this.capacity = capacity; // Maximum tokens
    this.tokens = capacity; // Current available tokens
    this.refillRate = refillRate; // Tokens per millisecond
    this.lastRefill = Date.now(); // Last refill timestamp
  }

  refill() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  tryConsume() {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }
}

// Module-level rate limiter: max 10 requests per minute (1 token every 6 seconds)
const rateLimiter = new TokenBucket(10, 1 / 6000);

/**
 * Reset rate limiter for testing purposes
 * @param {number} timestamp - Optional timestamp for lastRefill (useful with fake timers)
 */
export function __resetRateLimiter(timestamp = Date.now()) {
  rateLimiter.tokens = rateLimiter.capacity;
  rateLimiter.lastRefill = timestamp;
}

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
  const complete = useCallback(
    async (prompt, options = {}) => {
      setIsProcessing(true);
      setError(null);

      try {
        // Check rate limit
        if (!rateLimiter.tryConsume()) {
          throw new Error(
            "Rate limit exceeded. Please wait before making another request.",
          );
        }

        // Refresh API key timeout on successful API usage
        refreshLLMConfigTimestamp();

        // Validate config
        const validation = validateConfig();
        if (!validation.isValid) {
          throw new Error(
            validation.errors?.[0] ||
              ERROR_MESSAGES[ERROR_CODES.INVALID_API_KEY],
          );
        }

        const requestBody = {
          model: config.model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: options.temperature ?? config.temperature,
          max_tokens: options.maxTokens ?? config.maxTokens,
        };

        // Add API key for OpenRouter
        const headers = {
          "Content-Type": "application/json",
        };

        if (config.provider === "openrouter") {
          headers["Authorization"] = `Bearer ${config.apiKey}`;
          headers["HTTP-Referer"] = window.location.origin;
          headers["X-Title"] = "Privacy Policy Distiller";
        }

        // Determine endpoint and request body based on provider
        let endpoint;
        let body;

        if (config.provider === "ollama") {
          // Ollama uses /api/chat with different request format
          endpoint = `${config.baseUrl}/api/chat`;
          const ollamaBody = {
            model: config.model,
            messages: requestBody.messages,
            stream: false,
            options: {
              temperature: requestBody.temperature,
              num_predict: requestBody.max_tokens,
              num_ctx: config.contextWindow || 8192, // Use configured context window
            },
          };
          body = JSON.stringify(ollamaBody);
        } else {
          // OpenAI-compatible API (OpenRouter, LM Studio)
          endpoint = `${config.baseUrl}/chat/completions`;
          body = JSON.stringify(requestBody);
        }

        // Make request with retry logic
        const response = await retry(
          async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(
              () => controller.abort(),
              ANALYSIS_CONFIG.TIMEOUT_MS,
            );

            try {
              const res = await fetch(endpoint, {
                method: "POST",
                headers,
                body,
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
              if (err.name === "AbortError") {
                throw new Error(ERROR_MESSAGES[ERROR_CODES.LLM_TIMEOUT]);
              }
              throw err;
            }
          },
          ANALYSIS_CONFIG.RETRY_ATTEMPTS,
          ANALYSIS_CONFIG.RETRY_DELAY_MS,
        );

        const data = await response.json();

        // Extract response text based on provider format
        let responseText;

        if (config.provider === "ollama") {
          // Ollama format: { message: { content: "..." } }
          if (!data.message || !data.message.content) {
            throw new Error(ERROR_MESSAGES[ERROR_CODES.LLM_INVALID_RESPONSE]);
          }
          responseText = data.message.content;
        } else {
          // OpenAI format: { choices: [{ message: { content: "..." } }] }
          if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error(ERROR_MESSAGES[ERROR_CODES.LLM_INVALID_RESPONSE]);
          }
          responseText = data.choices[0].message.content;
        }

        setIsProcessing(false);
        return responseText;
      } catch (err) {
        const errorMessage =
          err.message || ERROR_MESSAGES[ERROR_CODES.LLM_REQUEST_FAILED];
        setError(errorMessage);
        setIsProcessing(false);
        throw new Error(errorMessage);
      }
    },
    [config, validateConfig],
  );

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
