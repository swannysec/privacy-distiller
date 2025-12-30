import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LLMConfigPanel } from "./LLMConfigPanel";

// Mock child components
vi.mock("./ProviderSelector", () => ({
  ProviderSelector: vi.fn(({ value, onChange, disabled }) => (
    <div data-testid="provider-selector">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="openrouter">OpenRouter</option>
        <option value="ollama">Ollama</option>
        <option value="lmstudio">LM Studio</option>
      </select>
    </div>
  )),
}));

vi.mock("./APIKeyInput", () => ({
  APIKeyInput: vi.fn(({ value, onChange, provider, disabled }) => (
    <div data-testid="api-key-input">
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={`API key for ${provider}`}
      />
    </div>
  )),
}));

vi.mock("./ModelSelector", () => ({
  ModelSelector: vi.fn(({ provider, value, onChange, disabled }) => (
    <div data-testid="model-selector">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="model1">Model 1</option>
        <option value="model2">Model 2</option>
      </select>
    </div>
  )),
}));

vi.mock("../Common", () => ({
  Button: ({ children, variant, onClick, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
    >
      {children}
    </button>
  ),
}));

vi.mock("../../utils/constants", () => ({
  LLM_PROVIDERS: {
    OPENROUTER: {
      id: "openrouter",
      name: "OpenRouter",
      requiresApiKey: true,
      baseUrl: "https://openrouter.ai/api/v1",
    },
    OLLAMA: {
      id: "ollama",
      name: "Ollama",
      requiresApiKey: false,
      baseUrl: "http://localhost:11434",
    },
    LMSTUDIO: {
      id: "lmstudio",
      name: "LM Studio",
      requiresApiKey: false,
      baseUrl: "http://localhost:1234/v1",
    },
  },
  DEFAULT_CONTEXT_WINDOWS: {
    ollama: 8192,
    lmstudio: 8192,
  },
}));

// Mock fetch for connection tests
global.fetch = vi.fn();

// Mock context
const mockUpdateConfig = vi.fn();
const mockSetProvider = vi.fn();
const mockValidateConfig = vi.fn();
const mockResetConfig = vi.fn();

const mockContextValue = {
  config: {
    provider: "openrouter",
    apiKey: "test-key",
    model: "model1",
    temperature: 0.7,
    maxTokens: 4000,
    baseUrl: "https://openrouter.ai/api/v1",
  },
  updateConfig: mockUpdateConfig,
  setProvider: mockSetProvider,
  validateConfig: mockValidateConfig,
  resetConfig: mockResetConfig,
};

import { useLLMConfig } from "../../contexts";

vi.mock("../../contexts", () => ({
  useLLMConfig: vi.fn(),
}));

describe("LLMConfigPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateConfig.mockReturnValue({ isValid: true, errors: [] });
    global.fetch.mockReset();
    // Set default mock return value
    vi.mocked(useLLMConfig).mockReturnValue(mockContextValue);
  });

  describe("Rendering", () => {
    it("should render modal with title", () => {
      render(<LLMConfigPanel />);

      expect(screen.getByText(/LLM Configuration/i)).toBeInTheDocument();
    });

    it("should render ProviderSelector", () => {
      render(<LLMConfigPanel />);

      expect(screen.getByTestId("provider-selector")).toBeInTheDocument();
    });

    it("should render APIKeyInput when provider requires API key", () => {
      render(<LLMConfigPanel />);

      expect(screen.getByTestId("api-key-input")).toBeInTheDocument();
    });

    it("should render ModelSelector", () => {
      render(<LLMConfigPanel />);

      expect(screen.getByTestId("model-selector")).toBeInTheDocument();
    });

    it("should render form sections", () => {
      render(<LLMConfigPanel />);

      expect(screen.getByText("Provider")).toBeInTheDocument();
      expect(screen.getByText("API Settings")).toBeInTheDocument();
      expect(screen.getByText("Advanced")).toBeInTheDocument();
    });

    it("should render temperature input with current value", () => {
      render(<LLMConfigPanel />);

      const tempInput = screen.getByLabelText(/Temperature/i);
      expect(tempInput).toBeInTheDocument();
      expect(tempInput).toHaveAttribute("type", "number");
      expect(tempInput).toHaveValue(0.7);
    });

    it("should render max response length input with current value", () => {
      render(<LLMConfigPanel />);

      const maxTokensInput = screen.getByLabelText(/Max Response Length/i);
      expect(maxTokensInput).toBeInTheDocument();
      expect(maxTokensInput).toHaveAttribute("type", "number");
      expect(maxTokensInput).toHaveValue(4000);
    });

    it("should render Save Configuration and Test Connection buttons", () => {
      render(<LLMConfigPanel />);

      expect(
        screen.getByRole("button", { name: /Save Configuration/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Test Connection/i }),
      ).toBeInTheDocument();
    });

    it("should render close button when onClose is provided", () => {
      const onClose = vi.fn();
      render(<LLMConfigPanel onClose={onClose} />);

      const closeButton = screen.getByLabelText(/Close configuration/i);
      expect(closeButton).toBeInTheDocument();

      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    });

    it("should apply custom className", () => {
      const { container } = render(<LLMConfigPanel className="custom-class" />);

      const modal = container.querySelector(".modal.custom-class");
      expect(modal).toBeInTheDocument();
    });
  });

  describe("Provider Change", () => {
    it("should call setProvider when provider changes", () => {
      render(<LLMConfigPanel />);

      const providerSelect = screen
        .getByTestId("provider-selector")
        .querySelector("select");
      fireEvent.change(providerSelect, { target: { value: "ollama" } });

      expect(mockSetProvider).toHaveBeenCalledWith("ollama");
    });

    it("should clear validation error when provider changes", () => {
      mockValidateConfig.mockReturnValue({
        isValid: false,
        errors: ["Error"],
      });

      render(<LLMConfigPanel />);

      const saveButton = screen.getByRole("button", {
        name: /Save Configuration/i,
      });
      fireEvent.click(saveButton);

      expect(screen.getByText(/Error/i)).toBeInTheDocument();

      const providerSelect = screen
        .getByTestId("provider-selector")
        .querySelector("select");
      fireEvent.change(providerSelect, { target: { value: "ollama" } });

      expect(screen.queryByText(/Error/i)).not.toBeInTheDocument();
    });
  });

  describe("API Key Change", () => {
    it("should call updateConfig when API key changes", () => {
      render(<LLMConfigPanel />);

      const apiKeyInput = screen
        .getByTestId("api-key-input")
        .querySelector("input");
      fireEvent.change(apiKeyInput, { target: { value: "new-key" } });

      expect(mockUpdateConfig).toHaveBeenCalledWith({ apiKey: "new-key" });
    });
  });

  describe("Model Change", () => {
    it("should call updateConfig when model changes", () => {
      render(<LLMConfigPanel />);

      const modelSelect = screen
        .getByTestId("model-selector")
        .querySelector("select");
      fireEvent.change(modelSelect, { target: { value: "model2" } });

      expect(mockUpdateConfig).toHaveBeenCalledWith({ model: "model2" });
    });
  });

  describe("Temperature Change", () => {
    it("should call updateConfig when temperature changes", () => {
      render(<LLMConfigPanel />);

      const tempInput = screen.getByLabelText(/Temperature/i);
      fireEvent.change(tempInput, { target: { value: "1.2" } });

      expect(mockUpdateConfig).toHaveBeenCalledWith({ temperature: 1.2 });
    });

    it("should have correct number input constraints", () => {
      render(<LLMConfigPanel />);

      const tempInput = screen.getByLabelText(/Temperature/i);

      expect(tempInput).toHaveAttribute("min", "0");
      expect(tempInput).toHaveAttribute("max", "2");
      expect(tempInput).toHaveAttribute("step", "0.1");
    });
  });

  describe("Max Tokens Change", () => {
    it("should call updateConfig when max tokens changes", () => {
      render(<LLMConfigPanel />);

      const maxTokensInput = screen.getByLabelText(/Max Response Length/i);
      fireEvent.change(maxTokensInput, { target: { value: "8000" } });

      expect(mockUpdateConfig).toHaveBeenCalledWith({ maxTokens: 8000 });
    });

    it("should have correct number input constraints", () => {
      render(<LLMConfigPanel />);

      const maxTokensInput = screen.getByLabelText(/Max Response Length/i);

      expect(maxTokensInput).toHaveAttribute("min", "1000");
      expect(maxTokensInput).toHaveAttribute("max", "32000");
      expect(maxTokensInput).toHaveAttribute("step", "1000");
    });
  });

  describe("Save Functionality", () => {
    it("should validate config before saving", () => {
      render(<LLMConfigPanel />);

      const saveButton = screen.getByRole("button", {
        name: /Save Configuration/i,
      });
      fireEvent.click(saveButton);

      expect(mockValidateConfig).toHaveBeenCalled();
    });

    it("should show validation error if config is invalid", () => {
      mockValidateConfig.mockReturnValue({
        isValid: false,
        errors: ["API key is required", "Model not selected"],
      });

      render(<LLMConfigPanel />);

      const saveButton = screen.getByRole("button", {
        name: /Save Configuration/i,
      });
      fireEvent.click(saveButton);

      expect(screen.getByText(/API key is required, Model not selected/i)).toBeInTheDocument();
    });

    it("should call onSave callback if config is valid", () => {
      const onSave = vi.fn();
      render(<LLMConfigPanel onSave={onSave} />);

      const saveButton = screen.getByRole("button", {
        name: /Save Configuration/i,
      });
      fireEvent.click(saveButton);

      expect(onSave).toHaveBeenCalledWith(mockContextValue.config);
    });

    it("should clear hasChanges flag after successful save", () => {
      render(<LLMConfigPanel />);

      const providerSelect = screen
        .getByTestId("provider-selector")
        .querySelector("select");
      fireEvent.change(providerSelect, { target: { value: "ollama" } });

      const saveButton = screen.getByRole("button", {
        name: /Save Configuration/i,
      });

      fireEvent.click(saveButton);

      // After save, changing again should set hasChanges to true
      fireEvent.change(providerSelect, { target: { value: "lmstudio" } });
      expect(mockSetProvider).toHaveBeenCalledWith("lmstudio");
    });
  });

  describe("Test Connection", () => {
    it("should test OpenRouter connection successfully", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{}, {}] }),
      });

      render(<LLMConfigPanel />);

      const testButton = screen.getByRole("button", {
        name: /Test Connection/i,
      });
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/Connected! 2 models available/i)).toBeInTheDocument();
      });
    });

    it("should handle OpenRouter connection failure", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Network error"));

      render(<LLMConfigPanel />);

      const testButton = screen.getByRole("button", {
        name: /Test Connection/i,
      });
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/Connection failed: Network error/i)).toBeInTheDocument();
      });
    });

    it("should validate config before testing connection", () => {
      mockValidateConfig.mockReturnValue({
        isValid: false,
        errors: ["API key required"],
      });

      render(<LLMConfigPanel />);

      const testButton = screen.getByRole("button", {
        name: /Test Connection/i,
      });
      fireEvent.click(testButton);

      expect(screen.getByText(/API key required/i)).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("Disabled State", () => {
    it("should disable all inputs when disabled prop is true", () => {
      render(<LLMConfigPanel disabled />);

      const providerSelect = screen
        .getByTestId("provider-selector")
        .querySelector("select");
      const modelSelect = screen
        .getByTestId("model-selector")
        .querySelector("select");
      const tempInput = screen.getByLabelText(/Temperature/i);
      const maxTokensInput = screen.getByLabelText(/Max Response Length/i);

      expect(providerSelect).toBeDisabled();
      expect(modelSelect).toBeDisabled();
      expect(tempInput).toBeDisabled();
      expect(maxTokensInput).toBeDisabled();
    });

    it("should disable buttons when disabled prop is true", () => {
      render(<LLMConfigPanel disabled />);

      const saveButton = screen.getByRole("button", {
        name: /Save Configuration/i,
      });
      const testButton = screen.getByRole("button", {
        name: /Test Connection/i,
      });

      expect(saveButton).toBeDisabled();
      expect(testButton).toBeDisabled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper labels on all inputs", () => {
      render(<LLMConfigPanel />);

      expect(screen.getByLabelText(/Temperature/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Max Response Length/i)).toBeInTheDocument();
    });

    it("should have descriptive button text", () => {
      render(<LLMConfigPanel />);

      expect(screen.getByRole("button", { name: /Save Configuration/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Test Connection/i })).toBeInTheDocument();
    });

    it("should have close button with aria-label when onClose provided", () => {
      const onClose = vi.fn();
      render(<LLMConfigPanel onClose={onClose} />);

      expect(screen.getByLabelText(/Close configuration/i)).toBeInTheDocument();
    });
  });

  describe("Local Provider Features", () => {
    it("should render endpoint URL input for local providers", () => {
      vi.mocked(useLLMConfig).mockReturnValue({
        ...mockContextValue,
        config: {
          ...mockContextValue.config,
          provider: "ollama",
          baseUrl: "http://localhost:11434",
        },
      });

      render(<LLMConfigPanel />);

      expect(screen.getByLabelText(/Endpoint URL/i)).toBeInTheDocument();
    });

    it("should render context window input for local providers", () => {
      vi.mocked(useLLMConfig).mockReturnValue({
        ...mockContextValue,
        config: {
          ...mockContextValue.config,
          provider: "ollama",
          contextWindow: 8192,
        },
      });

      render(<LLMConfigPanel />);

      expect(screen.getByLabelText(/Model Context Window/i)).toBeInTheDocument();
    });

    it("should show local model warning for local providers", () => {
      vi.mocked(useLLMConfig).mockReturnValue({
        ...mockContextValue,
        config: {
          ...mockContextValue.config,
          provider: "ollama",
        },
      });

      render(<LLMConfigPanel />);

      expect(screen.getByText(/Local Model Limitations/i)).toBeInTheDocument();
    });

    it("should show context window info for OpenRouter", () => {
      render(<LLMConfigPanel />);

      expect(screen.getByText(/Model context window.*automatically detected from OpenRouter/i)).toBeInTheDocument();
    });
  });
});
