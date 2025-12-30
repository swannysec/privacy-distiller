/**
 * @file OpenRouter Provider
 * @description LLM provider for OpenRouter API
 */

import { BaseLLMProvider } from './BaseLLMProvider.js';
import { ANALYSIS_CONFIG, ERROR_CODES, ERROR_MESSAGES } from '../../utils/constants.js';

export class OpenRouterProvider extends BaseLLMProvider {
  getName() {
    return 'OpenRouter';
  }

  validateConfig() {
    return !!(this.config.apiKey && this.config.model && this.config.baseUrl);
  }

  async complete(prompt, options = {}) {
    if (!this.validateConfig()) {
      throw new Error(ERROR_MESSAGES[ERROR_CODES.INVALID_API_KEY]);
    }

    const requestBody = {
      model: this.config.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature ?? this.config.temperature,
      max_tokens: options.maxTokens ?? this.config.maxTokens,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ANALYSIS_CONFIG.TIMEOUT_MS);

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Privacy Policy Distiller',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(ERROR_MESSAGES[ERROR_CODES.LLM_RATE_LIMITED]);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.choices?.[0]?.message?.content) {
        throw new Error(ERROR_MESSAGES[ERROR_CODES.LLM_INVALID_RESPONSE]);
      }

      return data.choices[0].message.content;

    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(ERROR_MESSAGES[ERROR_CODES.LLM_TIMEOUT]);
      }
      throw err;
    }
  }
}
