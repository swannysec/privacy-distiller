/**
 * @file Ollama Provider
 * @description LLM provider for local Ollama instance
 */

import { BaseLLMProvider } from './BaseLLMProvider';
import { ANALYSIS_CONFIG, ERROR_CODES, ERROR_MESSAGES } from '../../utils/constants';

/**
 * Ollama local provider implementation
 */
export class OllamaProvider extends BaseLLMProvider {
  getName(): string {
    return 'Ollama';
  }

  validateConfig(): boolean {
    return !!(this.config.model && this.config.baseUrl);
  }

  async complete(prompt: string, options: Record<string, unknown> = {}): Promise<string> {
    if (!this.validateConfig()) {
      throw new Error('Invalid Ollama configuration');
    }

    const requestBody = {
      model: this.config.model,
      prompt,
      stream: false,
      options: {
        temperature: (options.temperature as number | undefined) ?? this.config.temperature,
        num_predict: (options.maxTokens as number | undefined) ?? this.config.maxTokens,
        num_ctx: (this.config as any).contextWindow || 8192,
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
      if ((err as Error).name === 'AbortError') {
        throw new Error(ERROR_MESSAGES[ERROR_CODES.LLM_TIMEOUT]);
      }
      throw err;
    }
  }
}
