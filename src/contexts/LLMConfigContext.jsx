/**
 * @file LLM Configuration Context
 * @description Manages LLM provider configuration and API keys
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { DEFAULT_LLM_CONFIG } from "../utils/constants.js";
import { validateLLMConfig } from "../utils/validation.js";
import {
  saveLLMConfig,
  getLLMConfig,
  removeLLMConfig,
} from "../utils/storage.js";

const LLMConfigContext = createContext(null);

/**
 * LLM Configuration Provider Component
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function LLMConfigProvider({ children }) {
  const [config, setConfig] = useState(() => {
    const saved = getLLMConfig();
    return saved || DEFAULT_LLM_CONFIG;
  });

  const [validationErrors, setValidationErrors] = useState([]);

  // Persist config to sessionStorage whenever it changes
  useEffect(() => {
    if (config) {
      saveLLMConfig(config);
    }
  }, [config]);

  /**
   * Updates LLM configuration
   * @param {Partial<import('../types').LLMConfig>} updates
   */
  const updateConfig = useCallback((updates) => {
    setConfig((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  /**
   * Validates current configuration
   * @returns {boolean} Whether configuration is valid
   */
  const validateConfig = useCallback(() => {
    const result = validateLLMConfig(config);
    setValidationErrors(result.errors);
    // Return object with isValid and errors (extracting messages from error objects)
    return {
      isValid: result.valid,
      errors: result.errors.map((e) => e.message),
    };
  }, [config]);

  /**
   * Resets configuration to defaults
   */
  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_LLM_CONFIG);
    removeLLMConfig();
    setValidationErrors([]);
  }, []);

  /**
   * Updates provider and sets corresponding defaults
   * @param {import('../types').LLMProvider} provider
   */
  const setProvider = useCallback((provider) => {
    const providerDefaults = {
      openrouter: {
        baseUrl: "https://openrouter.ai/api/v1",
        model: "anthropic/claude-3.5-sonnet",
        contextWindow: null, // Auto-detect from OpenRouter API
        maxTokens: 32000, // Cloud models support large responses
        temperature: 0.7, // Recommended default
      },
      ollama: {
        baseUrl: "http://localhost:11434",
        model: "llama3.1",
        apiKey: "",
        contextWindow: 8192, // Conservative default - user should configure based on their model
        maxTokens: 4096, // Conservative for local models
        temperature: 0.7, // Recommended default
      },
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        model: "local-model",
        apiKey: "",
        contextWindow: 8192, // Conservative default - user should configure based on their model
        maxTokens: 4096, // Conservative for local models
        temperature: 0.7, // Recommended default
      },
    };

    setConfig((prev) => ({
      ...prev,
      provider,
      ...providerDefaults[provider],
    }));
  }, []);

  // Grouped context value structure for better organization
  const stateValues = {
    config,
    validationErrors,
  };

  const actions = {
    updateConfig,
    setProvider,
    validateConfig,
    resetConfig,
  };

  const computed = {
    isValid: validationErrors.length === 0,
  };

  const value = {
    // Grouped structure (preferred)
    state: stateValues,
    actions,
    computed,

    // Flat structure (backward compatibility)
    ...stateValues,
    ...actions,
    ...computed,
  };

  return (
    <LLMConfigContext.Provider value={value}>
      {children}
    </LLMConfigContext.Provider>
  );
}

/**
 * Hook to use LLM configuration context
 * @returns {Object} LLM configuration context value
 */
export function useLLMConfig() {
  const context = useContext(LLMConfigContext);
  if (!context) {
    throw new Error("useLLMConfig must be used within LLMConfigProvider");
  }
  return context;
}
