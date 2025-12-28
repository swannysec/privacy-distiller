/**
 * @file LM Studio Provider
 * @description LLM provider for local LM Studio instance
 */

import { BaseLLMProvider } from './BaseLLMProvider.js';
import { ANALYSIS_CONFIG, ERROR_CODES, ERROR_MESSAGES } from '../../utils/constants.js';

export class LMStudioProvider extends BaseLLMProvider {
  getName() {
    return 'LM Studio';
  }

  validateConfig() {
    return !!(this.config.model && this.config.baseUrl);
  }

  async complete(prompt, options = {}) {
    if (!this.validateConfig()) {
      throw new Error('Invalid LM Studio configuration');
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
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
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
