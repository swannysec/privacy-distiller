/**
 * @file Ollama Provider
 * @description LLM provider for local Ollama instance
 */

import { BaseLLMProvider } from './BaseLLMProvider.js';
import { ANALYSIS_CONFIG, ERROR_CODES, ERROR_MESSAGES } from '../../utils/constants.js';

export class OllamaProvider extends BaseLLMProvider {
  getName() {
    return 'Ollama';
  }

  validateConfig() {
    return !!(this.config.model && this.config.baseUrl);
  }

  async complete(prompt, options = {}) {
    if (!this.validateConfig()) {
      throw new Error('Invalid Ollama configuration');
    }

    const requestBody = {
      model: this.config.model,
      prompt,
      stream: false,
      options: {
        temperature: options.temperature ?? this.config.temperature,
        num_predict: options.maxTokens ?? this.config.maxTokens,
        num_ctx: this.config.contextWindow || 8192,
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ANALYSIS_CONFIG.TIMEOUT_MS);

    try {
      const response = await fetch(`${this.config.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.response) {
        throw new Error(ERROR_MESSAGES[ERROR_CODES.LLM_INVALID_RESPONSE]);
      }

      return data.response;

    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(ERROR_MESSAGES[ERROR_CODES.LLM_TIMEOUT]);
      }
      throw err;
    }
  }
}
