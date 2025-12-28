/**
 * @file Base LLM Provider
 * @description Abstract base class for LLM providers
 */

/**
 * Abstract base class for LLM providers
 */
export class BaseLLMProvider {
  /**
   * @param {import('../../types').LLMConfig} config
   */
  constructor(config) {
    if (new.target === BaseLLMProvider) {
      throw new Error('BaseLLMProvider is abstract and cannot be instantiated directly');
    }
    this.config = config;
  }

  /**
   * Sends a completion request
   * @param {string} prompt
   * @param {Object} options
   * @returns {Promise<string>}
   */
  async complete(prompt, options = {}) {
    throw new Error('complete() must be implemented by subclass');
  }

  /**
   * Validates the configuration
   * @returns {boolean}
   */
  validateConfig() {
    throw new Error('validateConfig() must be implemented by subclass');
  }

  /**
   * Gets provider name
   * @returns {string}
   */
  getName() {
    throw new Error('getName() must be implemented by subclass');
  }
}
