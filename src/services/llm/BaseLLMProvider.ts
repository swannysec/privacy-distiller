import type { LLMConfig } from '../../types';

/**
 * Abstract base class for LLM providers
 */
export abstract class BaseLLMProvider {
  protected config: LLMConfig;

  /**
   * Creates a new LLM provider instance
   * @param config - LLM configuration
   */
  constructor(config: LLMConfig) {
    if (new.target === BaseLLMProvider) {
      throw new Error('BaseLLMProvider is abstract and cannot be instantiated directly');
    }
    this.config = config;
  }

  /**
   * Sends a completion request to the LLM
   * @param prompt - The prompt to send
   * @param options - Additional options for the completion
   * @returns Promise resolving to the completion text
   */
  abstract complete(prompt: string, options?: Record<string, unknown>): Promise<string>;

  /**
   * Validates the provider configuration
   * @returns True if configuration is valid
   */
  abstract validateConfig(): boolean;

  /**
   * Gets the provider name
   * @returns The provider name
   */
  abstract getName(): string;
}
