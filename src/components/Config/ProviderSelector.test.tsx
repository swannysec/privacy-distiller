import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProviderSelector } from "./ProviderSelector";

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
}));

describe("ProviderSelector", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render label", () => {
      render(<ProviderSelector value="openrouter" onChange={mockOnChange} />);

      expect(screen.getByText("LLM Provider")).toBeInTheDocument();
    });

    it("should render select dropdown", () => {
      render(<ProviderSelector value="openrouter" onChange={mockOnChange} />);

      expect(screen.getByRole("combobox", { name: /LLM Provider/i })).toBeInTheDocument();
    });

    it("should render all provider options", () => {
      render(<ProviderSelector value="openrouter" onChange={mockOnChange} />);

      expect(screen.getByRole("option", { name: /OpenRouter/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /Ollama/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /LM Studio/i })).toBeInTheDocument();
    });

    it("should show (Local) suffix for local providers", () => {
      render(<ProviderSelector value="openrouter" onChange={mockOnChange} />);

      expect(screen.getByRole("option", { name: "Ollama (Local)" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "LM Studio (Local)" })).toBeInTheDocument();
    });

    it("should have the correct option selected", () => {
      render(<ProviderSelector value="ollama" onChange={mockOnChange} />);

      const select = screen.getByRole("combobox", { name: /LLM Provider/i });
      expect(select).toHaveValue("ollama");
    });

    it("should apply custom className", () => {
      const { container } = render(
        <ProviderSelector
          value="openrouter"
          onChange={mockOnChange}
          className="custom-class"
        />,
      );

      const selector = container.querySelector(".input-group.custom-class");
      expect(selector).toBeInTheDocument();
    });
  });

  describe("Provider Info", () => {
    it("should show OpenRouter info when OpenRouter is selected", () => {
      render(<ProviderSelector value="openrouter" onChange={mockOnChange} />);

      expect(screen.getByText(/Recommended for large documents/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /openrouter.ai\/keys/i })).toBeInTheDocument();
    });

    it("should show Ollama info when Ollama is selected", () => {
      render(<ProviderSelector value="ollama" onChange={mockOnChange} />);

      expect(screen.getByText(/Runs models locally/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /ollama.ai/i })).toBeInTheDocument();
    });

    it("should show LM Studio info when LM Studio is selected", () => {
      render(<ProviderSelector value="lmstudio" onChange={mockOnChange} />);

      expect(screen.getByText(/Desktop app for local models/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /lmstudio.ai/i })).toBeInTheDocument();
    });

    it('should have links with target="_blank" and rel="noopener noreferrer"', () => {
      render(<ProviderSelector value="openrouter" onChange={mockOnChange} />);

      const link = screen.getByRole("link", { name: /openrouter.ai\/keys/i });
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("should show context window limitation warning for local providers", () => {
      render(<ProviderSelector value="ollama" onChange={mockOnChange} />);

      expect(screen.getByText(/Limited context windows/i)).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("should call onChange when provider is changed", () => {
      render(<ProviderSelector value="openrouter" onChange={mockOnChange} />);

      const select = screen.getByRole("combobox", { name: /LLM Provider/i });
      fireEvent.change(select, { target: { value: "ollama" } });

      expect(mockOnChange).toHaveBeenCalledWith("ollama");
    });

    it("should call onChange when different provider is selected", () => {
      render(<ProviderSelector value="ollama" onChange={mockOnChange} />);

      const select = screen.getByRole("combobox", { name: /LLM Provider/i });
      fireEvent.change(select, { target: { value: "openrouter" } });

      expect(mockOnChange).toHaveBeenCalledWith("openrouter");
    });

    it("should not call onChange when disabled", () => {
      render(
        <ProviderSelector
          value="openrouter"
          onChange={mockOnChange}
          disabled
        />,
      );

      const select = screen.getByRole("combobox", { name: /LLM Provider/i });
      fireEvent.change(select, { target: { value: "ollama" } });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("should disable select when disabled prop is true", () => {
      render(
        <ProviderSelector
          value="openrouter"
          onChange={mockOnChange}
          disabled
        />,
      );

      const select = screen.getByRole("combobox", { name: /LLM Provider/i });
      expect(select).toBeDisabled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper label association", () => {
      render(<ProviderSelector value="openrouter" onChange={mockOnChange} />);

      const select = screen.getByLabelText(/LLM Provider/i);
      expect(select).toBeInTheDocument();
      expect(select.tagName).toBe("SELECT");
    });

    it("should have proper id on select", () => {
      render(<ProviderSelector value="openrouter" onChange={mockOnChange} />);

      const select = screen.getByRole("combobox", { name: /LLM Provider/i });
      expect(select).toHaveAttribute("id", "llm-provider");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty value gracefully", () => {
      // With empty value, select defaults to first option (openrouter)
      render(<ProviderSelector value="" onChange={mockOnChange} />);

      const select = screen.getByRole("combobox", { name: /LLM Provider/i });
      expect(select).toBeInTheDocument();
    });

    it("should handle invalid value gracefully", () => {
      render(
        <ProviderSelector value="invalid-provider" onChange={mockOnChange} />,
      );

      const select = screen.getByRole("combobox", { name: /LLM Provider/i });
      // Invalid value will show as the value but won't match any option
      expect(select).toBeInTheDocument();
    });

    it("should render without onChange (edge case)", () => {
      render(<ProviderSelector value="openrouter" onChange={undefined as unknown as (value: string) => void} />);

      const select = screen.getByRole("combobox", { name: /LLM Provider/i });
      expect(select).toBeInTheDocument();
    });
  });
});
