/**
 * @file Browser storage utilities
 * @description Uses sessionStorage for sensitive data (API keys) and localStorage for preferences
 */

import { STORAGE_KEYS, API_KEY_TIMEOUT_MS } from "./constants";
import type { LLMConfig, AnalysisResult } from '../types';

/**
 * Saves data to sessionStorage
 * @param key - Storage key
 * @param value - Value to store (will be JSON stringified)
 * @returns Success status
 */
export function saveToSession(key: string, value: unknown): boolean {
  try {
    const serialized = JSON.stringify(value);
    sessionStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error("Failed to save to sessionStorage:", error);
    return false;
  }
}

/**
 * Retrieves data from sessionStorage
 * @param key - Storage key
 * @param defaultValue - Default value if key doesn't exist
 * @returns Retrieved value or default
 */
export function getFromSession<T>(key: string, defaultValue: T | null = null): T | null {
  try {
    const item = sessionStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error("Failed to read from sessionStorage:", error);
    return defaultValue;
  }
}

/**
 * Removes data from sessionStorage
 * @param key - Storage key
 * @returns Success status
 */
export function removeFromSession(key: string): boolean {
  try {
    sessionStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error("Failed to remove from sessionStorage:", error);
    return false;
  }
}

/**
 * Saves data to localStorage
 * @param key - Storage key
 * @param value - Value to store (will be JSON stringified)
 * @returns Success status
 */
export function saveToLocal(key: string, value: unknown): boolean {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
    return false;
  }
}

/**
 * Retrieves data from localStorage
 * @param key - Storage key
 * @param defaultValue - Default value if key doesn't exist
 * @returns Retrieved value or default
 */
export function getFromLocal<T>(key: string, defaultValue: T | null = null): T | null {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error("Failed to read from localStorage:", error);
    return defaultValue;
  }
}

/**
 * Removes data from localStorage
 * @param key - Storage key
 * @returns Success status
 */
export function removeFromLocal(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error("Failed to remove from localStorage:", error);
    return false;
  }
}

/**
 * Clears all sessionStorage data
 * @returns Success status
 */
export function clearSession(): boolean {
  try {
    sessionStorage.clear();
    return true;
  } catch (error) {
    console.error("Failed to clear sessionStorage:", error);
    return false;
  }
}

/**
 * Clears all localStorage data
 * @returns Success status
 */
export function clearLocal(): boolean {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error("Failed to clear localStorage:", error);
    return false;
  }
}

/**
 * Saves LLM configuration to sessionStorage (includes API keys)
 * Also updates the activity timestamp for timeout tracking
 * @param config - LLM configuration
 * @returns Success status
 */
export function saveLLMConfig(config: LLMConfig): boolean {
  const configSaved = saveToSession(STORAGE_KEYS.LLM_CONFIG, config);
  if (configSaved) {
    // Update activity timestamp whenever config is saved
    saveToSession(STORAGE_KEYS.LLM_CONFIG_TIMESTAMP, Date.now());
  }
  return configSaved;
}

/**
 * Retrieves LLM configuration from sessionStorage
 * Returns null if config has expired (60 minutes of inactivity)
 * @returns LLM configuration or null
 */
export function getLLMConfig(): LLMConfig | null {
  const timestamp = getFromSession<number>(STORAGE_KEYS.LLM_CONFIG_TIMESTAMP);

  // Check if config has expired due to inactivity
  if (timestamp && Date.now() - timestamp > API_KEY_TIMEOUT_MS) {
    // Config expired - clear it and return null
    removeLLMConfig();
    return null;
  }

  return getFromSession<LLMConfig>(STORAGE_KEYS.LLM_CONFIG);
}

/**
 * Updates the LLM config activity timestamp
 * Call this when making LLM API requests to extend the session
 * @returns Success status
 */
export function refreshLLMConfigTimestamp(): boolean {
  const config = getFromSession<LLMConfig>(STORAGE_KEYS.LLM_CONFIG);
  if (config) {
    return saveToSession(STORAGE_KEYS.LLM_CONFIG_TIMESTAMP, Date.now());
  }
  return false;
}

/**
 * Checks if LLM config has expired without clearing it
 * @returns True if expired or no config exists
 */
export function isLLMConfigExpired(): boolean {
  const timestamp = getFromSession<number>(STORAGE_KEYS.LLM_CONFIG_TIMESTAMP);
  const config = getFromSession<LLMConfig>(STORAGE_KEYS.LLM_CONFIG);

  if (!config) return true;
  if (!timestamp) return false; // Config exists but no timestamp (legacy) - don't expire

  return Date.now() - timestamp > API_KEY_TIMEOUT_MS;
}

/**
 * Removes LLM configuration from sessionStorage
 * @returns Success status
 */
export function removeLLMConfig(): boolean {
  removeFromSession(STORAGE_KEYS.LLM_CONFIG_TIMESTAMP);
  return removeFromSession(STORAGE_KEYS.LLM_CONFIG);
}

/**
 * Saves analysis to history in localStorage
 * @param result - Analysis result to save
 * @returns Success status
 */
export function saveAnalysisToHistory(result: AnalysisResult): boolean {
  try {
    const history = getFromLocal<AnalysisResult[]>(STORAGE_KEYS.ANALYSIS_HISTORY, []) || [];

    // Limit history to 10 most recent items
    const newHistory = [result, ...history].slice(0, 10);

    return saveToLocal(STORAGE_KEYS.ANALYSIS_HISTORY, newHistory);
  } catch (error) {
    console.error("Failed to save analysis to history:", error);
    return false;
  }
}

/**
 * Retrieves analysis history from localStorage
 * @returns Array of analysis results
 */
export function getAnalysisHistory(): AnalysisResult[] {
  return getFromLocal<AnalysisResult[]>(STORAGE_KEYS.ANALYSIS_HISTORY, []) || [];
}

/**
 * Clears analysis history from localStorage
 * @returns Success status
 */
export function clearAnalysisHistory(): boolean {
  return removeFromLocal(STORAGE_KEYS.ANALYSIS_HISTORY);
}

/**
 * Saves user preferences to localStorage
 * @param preferences - User preferences
 * @returns Success status
 */
export function saveUserPreferences(preferences: Record<string, unknown>): boolean {
  return saveToLocal(STORAGE_KEYS.USER_PREFERENCES, preferences);
}

/**
 * Retrieves user preferences from localStorage
 * @returns User preferences or null
 */
export function getUserPreferences(): Record<string, unknown> | null {
  return getFromLocal<Record<string, unknown>>(STORAGE_KEYS.USER_PREFERENCES);
}

/**
 * Checks if storage is available
 * @param storage - Storage object to check (localStorage or sessionStorage)
 * @returns Whether storage is available
 */
export function isStorageAvailable(storage: Storage): boolean {
  try {
    const testKey = "__storage_test__";
    storage.setItem(testKey, "test");
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
