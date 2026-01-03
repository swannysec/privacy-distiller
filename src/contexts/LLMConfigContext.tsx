/**
 * @file LLM Configuration Context
 * @description Manages LLM provider configuration and API keys
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { DEFAULT_LLM_CONFIG } from "../utils/constants.js";
import { validateLLMConfig } from "../utils/validation.js";
import {
  saveLLMConfig,
  getLLMConfig,
  removeLLMConfig,
} from "../utils/storage.js";
import type {
  LLMConfig,
  LLMProvider,
  ValidationError,
} from "../types/index.js";

/**
 * Validation result with simplified structure
 */
interface ValidationResultSimplified {
  isValid: boolean;
  errors: string[];
}

/**
 * State values exposed by context
 */
interface LLMConfigStateValues {
  config: LLMConfig;
  validationErrors: ValidationError[];
}

/**
 * Actions available in context
 */
interface LLMConfigActions {
  updateConfig: (updates: Partial<LLMConfig>) => void;
  setProvider: (provider: LLMProvider) => void;
  validateConfig: () => ValidationResultSimplified;
  resetConfig: () => void;
}

/**
 * Computed values derived from state
 */
interface LLMConfigComputed {
  isValid: boolean;
}

/**
 * Complete context value type
 */
interface LLMConfigContextValue
  extends LLMConfigStateValues, LLMConfigActions, LLMConfigComputed {
  // Grouped structure (preferred)
  state: LLMConfigStateValues;
  actions: LLMConfigActions;
  computed: LLMConfigComputed;
}

const LLMConfigContext = createContext<LLMConfigContextValue | undefined>(
  undefined,
);

/**
 * LLM Configuration Provider Component Props
 */
interface LLMConfigProviderProps {
  children: ReactNode;
}

/**
 * LLM Configuration Provider Component
 */
export function LLMConfigProvider({ children }: LLMConfigProviderProps) {
  const [config, setConfig] = useState<LLMConfig>(() => {
    const saved = getLLMConfig();
    return saved || DEFAULT_LLM_CONFIG;
  });

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );

  // Persist config to sessionStorage whenever it changes
  useEffect(() => {
    if (config) {
      saveLLMConfig(config);
    }
  }, [config]);

  /**
   * Updates LLM configuration
   */
  const updateConfig = useCallback((updates: Partial<LLMConfig>) => {
    setConfig((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  /**
   * Validates current configuration
   */
  const validateConfig = useCallback((): ValidationResultSimplified => {
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
   */
  const setProvider = useCallback((provider: LLMProvider) => {
    const providerDefaults: Record<LLMProvider, Partial<LLMConfig>> = {
      "hosted-free": {
        baseUrl: "", // Uses FREE_TIER_WORKER_URL at runtime
        model: "anthropic/claude-3.5-sonnet",
        apiKey: "", // Managed by worker
        maxTokens: 18000, // Fixed limit for free tier
        temperature: 0.7,
      },
      openrouter: {
        baseUrl: "https://openrouter.ai/api/v1",
        model: "anthropic/claude-3.5-sonnet",
        maxTokens: 32000,
        temperature: 0.7,
      },
      ollama: {
        baseUrl: "http://localhost:11434",
        model: "llama3.1",
        apiKey: "",
        maxTokens: 4096,
        temperature: 0.7,
      },
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        model: "local-model",
        apiKey: "",
        maxTokens: 4096,
        temperature: 0.7,
      },
    };

    setConfig((prev) => ({
      ...prev,
      provider,
      ...providerDefaults[provider],
    }));
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo((): LLMConfigContextValue => {
    const stateValues: LLMConfigStateValues = {
      config,
      validationErrors,
    };

    const actions: LLMConfigActions = {
      updateConfig,
      setProvider,
      validateConfig,
      resetConfig,
    };

    const computed: LLMConfigComputed = {
      isValid: validationErrors.length === 0,
    };

    return {
      // Grouped structure (preferred)
      state: stateValues,
      actions,
      computed,

      // Flat structure (backward compatibility)
      ...stateValues,
      ...actions,
      ...computed,
    };
  }, [
    config,
    validationErrors,
    updateConfig,
    setProvider,
    validateConfig,
    resetConfig,
  ]);

  return (
    <LLMConfigContext.Provider value={value}>
      {children}
    </LLMConfigContext.Provider>
  );
}

/**
 * Hook to use LLM configuration context
 * @throws Error if used outside LLMConfigProvider
 */
export function useLLMConfig(): LLMConfigContextValue {
  const context = useContext(LLMConfigContext);
  if (!context) {
    throw new Error("useLLMConfig must be used within LLMConfigProvider");
  }
  return context;
}
