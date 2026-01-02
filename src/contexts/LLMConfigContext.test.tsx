import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from "@testing-library/react";
import { LLMConfigProvider, useLLMConfig } from "./LLMConfigContext";
import * as storage from "../utils/storage";
import { DEFAULT_LLM_CONFIG } from "../utils/constants";

// Mock storage utilities
vi.mock("../utils/storage", () => ({
  saveLLMConfig: vi.fn(),
  getLLMConfig: vi.fn(),
  removeLLMConfig: vi.fn(),
}));

// Mock validation utilities
vi.mock("../utils/validation", () => ({
  validateLLMConfig: vi.fn(() => ({ valid: true, errors: [] })),
}));

const mockGetLLMConfig = storage.getLLMConfig as Mock;
const mockSaveLLMConfig = storage.saveLLMConfig as Mock;
const mockRemoveLLMConfig = storage.removeLLMConfig as Mock;

// Test component to access context
function TestComponent() {
  const {
    config,
    updateConfig,
    setProvider,
    validateConfig,
    resetConfig,
    validationErrors,
    isValid,
  } = useLLMConfig();

  return (
    <div>
      <div data-testid="provider">{config?.provider || "none"}</div>
      <div data-testid="model">{config?.model || "none"}</div>
      <div data-testid="api-key">{config?.apiKey || "none"}</div>
      <div data-testid="base-url">{config?.baseUrl || "none"}</div>
      <div data-testid="is-valid">{isValid ? "true" : "false"}</div>
      <div data-testid="validation-errors">{validationErrors.length}</div>

      <button onClick={() => updateConfig({ apiKey: "test-key" })}>
        Update API Key
      </button>
      <button onClick={() => updateConfig({ model: "gpt-4" })}>
        Update Model
      </button>
      <button onClick={() => setProvider("ollama")}>Set Provider Ollama</button>
      <button onClick={() => setProvider("openrouter")}>
        Set Provider OpenRouter
      </button>
      <button onClick={() => setProvider("lmstudio")}>
        Set Provider LM Studio
      </button>
      <button onClick={validateConfig}>Validate</button>
      <button onClick={resetConfig}>Reset</button>
    </div>
  );
}

describe("LLMConfigContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLLMConfig.mockReturnValue(null);
  });

  describe("LLMConfigProvider", () => {
    it("should render children", () => {
      render(
        <LLMConfigProvider>
          <div data-testid="child">Test Child</div>
        </LLMConfigProvider>,
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("should provide default config when storage is empty", () => {
      mockGetLLMConfig.mockReturnValue(null);

      render(
        <LLMConfigProvider>
          <TestComponent />
        </LLMConfigProvider>,
      );

      expect(screen.getByTestId("provider")).toHaveTextContent(
        DEFAULT_LLM_CONFIG.provider,
      );
    });

    it("should load config from storage on mount", () => {
      const savedConfig = {
        provider: "ollama",
        baseUrl: "http://localhost:11434",
        model: "llama3.1",
        apiKey: "",
        temperature: 0.7,
        maxTokens: 4096,
      };

      mockGetLLMConfig.mockReturnValue(savedConfig);

      render(
        <LLMConfigProvider>
          <TestComponent />
        </LLMConfigProvider>,
      );

      expect(screen.getByTestId("provider")).toHaveTextContent("ollama");
      expect(screen.getByTestId("model")).toHaveTextContent("llama3.1");
    });

    it("should handle null config from storage", () => {
      mockGetLLMConfig.mockReturnValue(null);

      render(
        <LLMConfigProvider>
          <TestComponent />
        </LLMConfigProvider>,
      );

      // Should use default config
      expect(screen.getByTestId("provider")).toHaveTextContent(
        DEFAULT_LLM_CONFIG.provider,
      );
    });

    it("should persist config to storage when updated", async () => {
      mockGetLLMConfig.mockReturnValue(null);

      render(
        <LLMConfigProvider>
          <TestComponent />
        </LLMConfigProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByText("Update API Key"));
      });

      await waitFor(() => {
        expect(mockSaveLLMConfig).toHaveBeenCalled();
      });
    });
  });

  describe("useLLMConfig hook", () => {
    it("should throw error when used outside provider", () => {
      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow("useLLMConfig must be used within LLMConfigProvider");

      consoleSpy.mockRestore();
    });

    it("should provide config state", () => {
      mockGetLLMConfig.mockReturnValue(null);

      render(
        <LLMConfigProvider>
          <TestComponent />
        </LLMConfigProvider>,
      );

      expect(screen.getByTestId("provider")).toBeInTheDocument();
      expect(screen.getByTestId("model")).toBeInTheDocument();
    });

    it("should update config with updateConfig", async () => {
      mockGetLLMConfig.mockReturnValue(null);

      render(
        <LLMConfigProvider>
          <TestComponent />
        </LLMConfigProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByText("Update API Key"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("api-key")).toHaveTextContent("test-key");
      });
    });

    it("should update model with updateConfig", async () => {
      mockGetLLMConfig.mockReturnValue(null);

      render(
        <LLMConfigProvider>
          <TestComponent />
        </LLMConfigProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByText("Update Model"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("model")).toHaveTextContent("gpt-4");
      });
    });

    it("should set provider with defaults using setProvider", async () => {
      mockGetLLMConfig.mockReturnValue(null);

      render(
        <LLMConfigProvider>
          <TestComponent />
        </LLMConfigProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByText("Set Provider Ollama"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("provider")).toHaveTextContent("ollama");
        expect(screen.getByTestId("model")).toHaveTextContent("llama3.1");
        expect(screen.getByTestId("base-url")).toHaveTextContent(
          "http://localhost:11434",
        );
      });
    });

    it("should set OpenRouter provider with defaults", async () => {
      mockGetLLMConfig.mockReturnValue(null);

      render(
        <LLMConfigProvider>
          <TestComponent />
        </LLMConfigProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByText("Set Provider OpenRouter"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("provider")).toHaveTextContent("openrouter");
        expect(screen.getByTestId("base-url")).toHaveTextContent(
          "https://openrouter.ai/api/v1",
        );
        expect(screen.getByTestId("model")).toHaveTextContent(
          "anthropic/claude-3.5-sonnet",
        );
      });
    });

    it("should set LM Studio provider with defaults", async () => {
      mockGetLLMConfig.mockReturnValue(null);

      render(
        <LLMConfigProvider>
          <TestComponent />
        </LLMConfigProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByText("Set Provider LM Studio"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("provider")).toHaveTextContent("lmstudio");
        expect(screen.getByTestId("base-url")).toHaveTextContent(
          "http://localhost:1234/v1",
        );
        expect(screen.getByTestId("model")).toHaveTextContent("local-model");
      });
    });

    it("should validate config", async () => {
      mockGetLLMConfig.mockReturnValue(null);

      render(
        <LLMConfigProvider>
          <TestComponent />
        </LLMConfigProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByText("Validate"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-valid")).toHaveTextContent("true");
      });
    });

    it("should reset config to defaults", async () => {
      mockGetLLMConfig.mockReturnValue(null);

      render(
        <LLMConfigProvider>
          <TestComponent />
        </LLMConfigProvider>,
      );

      // Update config first
      await act(async () => {
        fireEvent.click(screen.getByText("Update API Key"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("api-key")).toHaveTextContent("test-key");
      });

      // Now reset
      await act(async () => {
        fireEvent.click(screen.getByText("Reset"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("provider")).toHaveTextContent(
          DEFAULT_LLM_CONFIG.provider,
        );
        expect(mockRemoveLLMConfig).toHaveBeenCalled();
      });
    });

    it("should clear validation errors on reset", async () => {
      const { validateLLMConfig } = await import("../utils/validation") as { validateLLMConfig: Mock };
      validateLLMConfig.mockReturnValue({ valid: false, errors: ["Error 1"] });

      mockGetLLMConfig.mockReturnValue(null);

      render(
        <LLMConfigProvider>
          <TestComponent />
        </LLMConfigProvider>,
      );

      // Trigger validation to set errors
      await act(async () => {
        fireEvent.click(screen.getByText("Validate"));
      });

      // Reset to clear errors
      validateLLMConfig.mockReturnValue({ valid: true, errors: [] });

      await act(async () => {
        fireEvent.click(screen.getByText("Reset"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("validation-errors")).toHaveTextContent("0");
      });
    });
  });

  describe("config persistence", () => {
    it("should save config to storage when updateConfig is called", async () => {
      mockGetLLMConfig.mockReturnValue(null);

      render(
        <LLMConfigProvider>
          <TestComponent />
        </LLMConfigProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByText("Update API Key"));
      });

      await waitFor(() => {
        expect(mockSaveLLMConfig).toHaveBeenCalled();
      });
    });

    it("should save config to storage when setProvider is called", async () => {
      mockGetLLMConfig.mockReturnValue(null);

      render(
        <LLMConfigProvider>
          <TestComponent />
        </LLMConfigProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByText("Set Provider Ollama"));
      });

      await waitFor(() => {
        expect(mockSaveLLMConfig).toHaveBeenCalled();
      });
    });

    it("should load saved config on provider mount", () => {
      const savedConfig = {
        provider: "openrouter",
        baseUrl: "https://openrouter.ai/api/v1",
        model: "gpt-4",
        apiKey: "saved-key",
        temperature: 0.8,
        maxTokens: 2048,
      };

      mockGetLLMConfig.mockReturnValue(savedConfig);

      render(
        <LLMConfigProvider>
          <TestComponent />
        </LLMConfigProvider>,
      );

      expect(screen.getByTestId("provider")).toHaveTextContent("openrouter");
      expect(screen.getByTestId("model")).toHaveTextContent("gpt-4");
      expect(screen.getByTestId("api-key")).toHaveTextContent("saved-key");
    });
  });

  describe("validation", () => {
    it("should track validation errors", async () => {
      const { validateLLMConfig } = await import("../utils/validation") as { validateLLMConfig: Mock };
      validateLLMConfig.mockReturnValue({
        valid: false,
        errors: ["API key is required", "Model is required"],
      });

      mockGetLLMConfig.mockReturnValue(null);

      render(
        <LLMConfigProvider>
          <TestComponent />
        </LLMConfigProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByText("Validate"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("validation-errors")).toHaveTextContent("2");
        expect(screen.getByTestId("is-valid")).toHaveTextContent("false");
      });
    });

    it("should return isValid true when no errors", async () => {
      const { validateLLMConfig } = await import("../utils/validation") as { validateLLMConfig: Mock };
      validateLLMConfig.mockReturnValue({ valid: true, errors: [] });

      mockGetLLMConfig.mockReturnValue(null);

      render(
        <LLMConfigProvider>
          <TestComponent />
        </LLMConfigProvider>,
      );

      expect(screen.getByTestId("is-valid")).toHaveTextContent("true");
      expect(screen.getByTestId("validation-errors")).toHaveTextContent("0");
    });
  });

  describe("provider switching", () => {
    it("should update all provider-specific settings when switching providers", async () => {
      mockGetLLMConfig.mockReturnValue(null);

      render(
        <LLMConfigProvider>
          <TestComponent />
        </LLMConfigProvider>,
      );

      // Start with default (openrouter)
      expect(screen.getByTestId("provider")).toHaveTextContent("openrouter");

      // Switch to Ollama
      await act(async () => {
        fireEvent.click(screen.getByText("Set Provider Ollama"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("provider")).toHaveTextContent("ollama");
        expect(screen.getByTestId("base-url")).toHaveTextContent(
          "http://localhost:11434",
        );
        expect(screen.getByTestId("model")).toHaveTextContent("llama3.1");
        expect(screen.getByTestId("api-key")).toHaveTextContent("none");
      });

      // Switch to LM Studio
      await act(async () => {
        fireEvent.click(screen.getByText("Set Provider LM Studio"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("provider")).toHaveTextContent("lmstudio");
        expect(screen.getByTestId("base-url")).toHaveTextContent(
          "http://localhost:1234/v1",
        );
        expect(screen.getByTestId("model")).toHaveTextContent("local-model");
      });
    });

    it("should preserve custom settings when switching providers", async () => {
      mockGetLLMConfig.mockReturnValue(null);

      render(
        <LLMConfigProvider>
          <TestComponent />
        </LLMConfigProvider>,
      );

      // Update API key
      await act(async () => {
        fireEvent.click(screen.getByText("Update API Key"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("api-key")).toHaveTextContent("test-key");
      });

      // Switch provider - should get new defaults but API key might be overridden
      await act(async () => {
        fireEvent.click(screen.getByText("Set Provider Ollama"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("provider")).toHaveTextContent("ollama");
        // Ollama provider defaults set apiKey to ''
        expect(screen.getByTestId("api-key")).toHaveTextContent("none");
      });
    });
  });
});
