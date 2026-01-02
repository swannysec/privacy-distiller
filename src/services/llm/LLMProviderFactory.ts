/**
 * @file LLM Provider Factory
 * @description Factory for creating LLM provider instances
 */

import type { LLMConfig } from '../../types';
import { BaseLLMProvider } from './BaseLLMProvider';
import { OpenRouterProvider } from './OpenRouterProvider';
import { OllamaProvider } from './OllamaProvider';
import { LMStudioProvider } from './LMStudioProvider';

/**
 * Factory class for creating LLM provider instances
 */
export class LLMProviderFactory {
  /**
   * Creates an LLM provider instance based on configuration
   * @param config - LLM configuration
   * @returns LLM provider instance
   */
  static createProvider(config: LLMConfig): BaseLLMProvider {
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
