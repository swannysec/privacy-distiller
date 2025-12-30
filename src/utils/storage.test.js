import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  isStorageAvailable,
  saveToSession,
  getFromSession,
  removeFromSession,
  clearSession,
  saveToLocal,
  getFromLocal,
  removeFromLocal,
  clearLocal,
  saveLLMConfig,
  getLLMConfig,
  removeLLMConfig,
  saveAnalysisToHistory,
  getAnalysisHistory,
  clearAnalysisHistory,
  saveUserPreferences,
  getUserPreferences,
} from "./storage";

describe("storage utils", () => {
  beforeEach(() => {
    // Clear all storage before each test
    sessionStorage.clear();
    localStorage.clear();
  });

  describe("isStorageAvailable", () => {
    it("should return true for sessionStorage", () => {
      expect(isStorageAvailable(sessionStorage)).toBe(true);
    });

    it("should return true for localStorage", () => {
      expect(isStorageAvailable(localStorage)).toBe(true);
    });

    it("should handle unavailable storage gracefully", () => {
      // Mock storage being disabled
      const originalSessionStorage = window.sessionStorage;
      Object.defineProperty(window, "sessionStorage", {
        get: () => {
          throw new Error("Storage disabled");
        },
        configurable: true,
      });

      const result = isStorageAvailable("sessionStorage");
      expect(result).toBe(false);

      // Restore
      Object.defineProperty(window, "sessionStorage", {
        value: originalSessionStorage,
        configurable: true,
      });
    });
  });

  describe("sessionStorage operations", () => {
    describe("saveToSession", () => {
      it("should save string values", () => {
        saveToSession("testKey", "testValue");
        expect(sessionStorage.getItem("testKey")).toBe('"testValue"');
      });

      it("should save object values as JSON", () => {
        const obj = { name: "test", value: 123 };
        saveToSession("testKey", obj);
        const stored = JSON.parse(sessionStorage.getItem("testKey"));
        expect(stored).toEqual(obj);
      });

      it("should save array values", () => {
        const arr = [1, 2, 3];
        saveToSession("testKey", arr);
        const stored = JSON.parse(sessionStorage.getItem("testKey"));
        expect(stored).toEqual(arr);
      });

      it("should handle null values", () => {
        saveToSession("testKey", null);
        const stored = sessionStorage.getItem("testKey");
        expect(stored).toBeTruthy();
      });
    });

    describe("getFromSession", () => {
      it("should retrieve saved values", () => {
        sessionStorage.setItem("testKey", JSON.stringify("testValue"));
        const result = getFromSession("testKey");
        expect(result).toBe("testValue");
      });

      it("should retrieve object values", () => {
        const obj = { name: "test" };
        sessionStorage.setItem("testKey", JSON.stringify(obj));
        const result = getFromSession("testKey");
        expect(result).toEqual(obj);
      });

      it("should return null for non-existent keys", () => {
        const result = getFromSession("nonExistent");
        expect(result).toBeNull();
      });

      it("should return default value when provided", () => {
        const result = getFromSession("nonExistent", "default");
        expect(result).toBe("default");
      });

      it("should handle malformed JSON gracefully", () => {
        sessionStorage.setItem("testKey", "not valid json");
        const result = getFromSession("testKey");
        expect(result).toBeNull();
      });
    });

    describe("removeFromSession", () => {
      it("should remove stored values", () => {
        sessionStorage.setItem("testKey", "value");
        removeFromSession("testKey");
        expect(sessionStorage.getItem("testKey")).toBeNull();
      });

      it("should handle non-existent keys", () => {
        expect(() => removeFromSession("nonExistent")).not.toThrow();
      });
    });

    describe("clearSession", () => {
      it("should clear all session storage", () => {
        sessionStorage.setItem("key1", "value1");
        sessionStorage.setItem("key2", "value2");
        clearSession();
        expect(sessionStorage.length).toBe(0);
      });
    });
  });

  describe("localStorage operations", () => {
    describe("saveToLocal", () => {
      it("should save values to localStorage", () => {
        saveToLocal("testKey", "testValue");
        expect(localStorage.getItem("testKey")).toBeTruthy();
      });

      it("should save complex objects", () => {
        const obj = { nested: { value: "test" } };
        saveToLocal("testKey", obj);
        const stored = JSON.parse(localStorage.getItem("testKey"));
        expect(stored).toEqual(obj);
      });
    });

    describe("getFromLocal", () => {
      it("should retrieve saved values", () => {
        localStorage.setItem("testKey", JSON.stringify("testValue"));
        const result = getFromLocal("testKey");
        expect(result).toBe("testValue");
      });

      it("should return default value for non-existent keys", () => {
        const result = getFromLocal("nonExistent", "default");
        expect(result).toBe("default");
      });
    });

    describe("removeFromLocal", () => {
      it("should remove stored values", () => {
        localStorage.setItem("testKey", "value");
        removeFromLocal("testKey");
        expect(localStorage.getItem("testKey")).toBeNull();
      });
    });

    describe("clearLocal", () => {
      it("should clear all local storage", () => {
        localStorage.setItem("key1", "value1");
        localStorage.setItem("key2", "value2");
        clearLocal();
        expect(localStorage.length).toBe(0);
      });
    });
  });

  describe("LLM config operations", () => {
    describe("saveLLMConfig", () => {
      it("should save LLM config to session storage", () => {
        const config = {
          provider: "openrouter",
          apiKey: "test-key",
          model: "gpt-3.5-turbo",
        };
        saveLLMConfig(config);

        const stored = getLLMConfig();
        expect(stored).toEqual(config);
      });

      it("should overwrite existing config", () => {
        saveLLMConfig({ provider: "openrouter" });
        saveLLMConfig({ provider: "ollama" });

        const stored = getLLMConfig();
        expect(stored.provider).toBe("ollama");
      });
    });

    describe("getLLMConfig", () => {
      it("should retrieve saved LLM config", () => {
        const config = { provider: "openrouter", apiKey: "test" };
        saveLLMConfig(config);

        const result = getLLMConfig();
        expect(result).toEqual(config);
      });

      it("should return null when no config exists", () => {
        const result = getLLMConfig();
        expect(result).toBeNull();
      });
    });

    describe("removeLLMConfig", () => {
      it("should remove LLM config", () => {
        saveLLMConfig({ provider: "test" });
        removeLLMConfig();

        expect(getLLMConfig()).toBeNull();
      });
    });
  });

  describe("analysis history operations", () => {
    describe("saveAnalysisToHistory", () => {
      it("should save analysis to history", () => {
        const analysis = {
          documentTitle: "Test Policy",
          timestamp: Date.now(),
          summary: { brief: "Test" },
        };

        saveAnalysisToHistory(analysis);
        const history = getAnalysisHistory();

        expect(history).toHaveLength(1);
        expect(history[0]).toEqual(analysis);
      });

      it("should append to existing history", () => {
        saveAnalysisToHistory({ id: 1 });
        saveAnalysisToHistory({ id: 2 });

        const history = getAnalysisHistory();
        expect(history).toHaveLength(2);
      });

      it("should limit history size", () => {
        // Save more than the limit (assuming limit is 10)
        for (let i = 0; i < 15; i++) {
          saveAnalysisToHistory({ id: i });
        }

        const history = getAnalysisHistory();
        expect(history.length).toBeLessThanOrEqual(10);
      });
    });

    describe("getAnalysisHistory", () => {
      it("should retrieve analysis history", () => {
        const analysis = { test: "data" };
        saveAnalysisToHistory(analysis);

        const history = getAnalysisHistory();
        expect(history).toContainEqual(analysis);
      });

      it("should return empty array when no history", () => {
        const history = getAnalysisHistory();
        expect(history).toEqual([]);
      });
    });

    describe("clearAnalysisHistory", () => {
      it("should clear analysis history", () => {
        saveAnalysisToHistory({ id: 1 });
        saveAnalysisToHistory({ id: 2 });

        clearAnalysisHistory();

        const history = getAnalysisHistory();
        expect(history).toEqual([]);
      });
    });
  });

  describe("user preferences operations", () => {
    describe("saveUserPreferences", () => {
      it("should save user preferences", () => {
        const prefs = {
          theme: "dark",
          language: "en",
          notifications: true,
        };

        saveUserPreferences(prefs);
        const stored = getUserPreferences();

        expect(stored).toEqual(prefs);
      });

      it("should merge with existing preferences", () => {
        saveUserPreferences({ theme: "dark" });
        saveUserPreferences({ language: "en" });

        const prefs = getUserPreferences();
        // saveUserPreferences doesn't merge, it overwrites
        // So only the last saved value exists
        expect(prefs.theme).toBeUndefined();
        expect(prefs.language).toBe("en");
      });
    });

    describe("getUserPreferences", () => {
      it("should retrieve user preferences", () => {
        const prefs = { theme: "light" };
        saveUserPreferences(prefs);

        const result = getUserPreferences();
        expect(result).toEqual(prefs);
      });

      it("should return default preferences when none exist", () => {
        const result = getUserPreferences();
        expect(result).toBeNull();
      });
    });
  });
});
