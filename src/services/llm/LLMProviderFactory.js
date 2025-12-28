/**
 * @file LLM Provider Factory
 * @description Factory for creating LLM provider instances
 */

import { OpenRouterProvider } from './OpenRouterProvider.js';
import { OllamaProvider } from './OllamaProvider.js';
import { LMStudioProvider } from './LMStudioProvider.js';

/**
 * Factory class for creating LLM provider instances
 */
export class LLMProviderFactory {
  /**
   * Creates an LLM provider instance based on configuration
   * @param {import('../../types').LLMConfig} config
   * @returns {import('./BaseLLMProvider.js').BaseLLMProvider}
   */
  static createProvider(config) {
    switch (config.provider) {
      case 'openrouter':
        return new OpenRouterProvider(config);
      case 'ollama':
        return new OllamaProvider(config);
      case 'lmstudio':
        return new LMStudioProvider(config);
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  }
}
