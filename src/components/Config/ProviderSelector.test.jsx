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

    it("should render all provider options", () => {
      render(<ProviderSelector value="openrouter" onChange={mockOnChange} />);

      expect(
        screen.getByRole("radio", { name: /OpenRouter/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: /Ollama/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: /LM Studio/i }),
      ).toBeInTheDocument();
    });

    it("should render radio buttons for each provider", () => {
      render(<ProviderSelector value="openrouter" onChange={mockOnChange} />);

      const openrouterRadio = screen.getByRole("radio", {
        name: /OpenRouter/i,
      });
      const ollamaRadio = screen.getByRole("radio", { name: /Ollama/i });
      const lmstudioRadio = screen.getByRole("radio", { name: /LM Studio/i });

      expect(openrouterRadio).toBeInTheDocument();
      expect(ollamaRadio).toBeInTheDocument();
      expect(lmstudioRadio).toBeInTheDocument();
    });

    it("should check the selected provider", () => {
      render(<ProviderSelector value="ollama" onChange={mockOnChange} />);

      const ollamaRadio = screen.getByRole("radio", { name: /Ollama/i });
      expect(ollamaRadio).toBeChecked();
    });

    it("should not check other providers", () => {
      render(<ProviderSelector value="ollama" onChange={mockOnChange} />);

      const openrouterRadio = screen.getByRole("radio", {
        name: /OpenRouter/i,
      });
      const lmstudioRadio = screen.getByRole("radio", { name: /LM Studio/i });

      expect(openrouterRadio).not.toBeChecked();
      expect(lmstudioRadio).not.toBeChecked();
    });

    it("should apply custom className", () => {
      const { container } = render(
        <ProviderSelector
          value="openrouter"
          onChange={mockOnChange}
          className="custom-class"
        />,
      );

      const selector = container.querySelector(
        ".provider-selector.custom-class",
      );
      expect(selector).toBeInTheDocument();
    });
  });

  describe("Provider Badges", () => {
    it('should show "API Key Required" badge for OpenRouter', () => {
      render(<ProviderSelector value="openrouter" onChange={mockOnChange} />);

      expect(screen.getByText("🔑 API Key Required")).toBeInTheDocument();
    });

    it('should show "Local" badge for Ollama', () => {
      render(<ProviderSelector value="ollama" onChange={mockOnChange} />);

      const badges = screen.getAllByText("💻 Local");
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should show "Local" badge for LM Studio', () => {
      render(<ProviderSelector value="lmstudio" onChange={mockOnChange} />);

      const badges = screen.getAllByText("💻 Local");
      expect(badges.length).toBeGreaterThan(0);
    });

    it("should display base URLs for all providers", () => {
      render(<ProviderSelector value="openrouter" onChange={mockOnChange} />);

      expect(
        screen.getByText("https://openrouter.ai/api/v1"),
      ).toBeInTheDocument();
      expect(screen.getByText("http://localhost:11434")).toBeInTheDocument();
      expect(screen.getByText("http://localhost:1234/v1")).toBeInTheDocument();
    });
  });

  describe("Provider Info", () => {
    it("should show OpenRouter info when OpenRouter is selected", () => {
      render(<ProviderSelector value="openrouter" onChange={mockOnChange} />);

      expect(
        screen.getByText(/provides access to multiple commercial LLMs/i),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /openrouter.ai\/keys/i }),
      ).toBeInTheDocument();
    });

    it("should show Ollama info when Ollama is selected", () => {
      render(<ProviderSelector value="ollama" onChange={mockOnChange} />);

      expect(
        screen.getByText(/runs models locally on your machine/i),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /ollama.ai/i }),
      ).toBeInTheDocument();
    });

    it("should show LM Studio info when LM Studio is selected", () => {
      render(<ProviderSelector value="lmstudio" onChange={mockOnChange} />);

      expect(
        screen.getByText(/provides a desktop app for running local models/i),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /lmstudio.ai/i }),
      ).toBeInTheDocument();
    });

    it('should have links with target="_blank" and rel="noopener noreferrer"', () => {
      render(<ProviderSelector value="openrouter" onChange={mockOnChange} />);

      const link = screen.getByRole("link", { name: /openrouter.ai\/keys/i });
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("User Interactions", () => {
    it("should call onChange when provider is clicked", () => {
      render(<ProviderSelector value="openrouter" onChange={mockOnChange} />);

      const ollamaRadio = screen.getByRole("radio", { name: /Ollama/i });
      fireEvent.click(ollamaRadio);

      expect(mockOnChange).toHaveBeenCalledWith("ollama");
    });

    it("should call onChange when different provider is selected", () => {
      render(<ProviderSelector value="ollama" onChange={mockOnChange} />);

      const openrouterRadio = screen.getByRole("radio", {
        name: /OpenRouter/i,
      });
      fireEvent.click(openrouterRadio);

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

      const ollamaRadio = screen.getByRole("radio", { name: /Ollama/i });
      fireEvent.click(ollamaRadio);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("should disable all radio buttons when disabled prop is true", () => {
      render(
        <ProviderSelector
          value="openrouter"
          onChange={mockOnChange}
          disabled
        />,
      );

      const radios = screen.getAllByRole("radio");
      radios.forEach((radio) => {
        expect(radio).toBeDisabled();
      });
    });

    // Note: Removed test expecting onChange when clicking already-selected radio.
    // In HTML, radio buttons don't fire change events when already checked.
    // This is standard browser behavior, not a component bug.
  });

  describe("CSS Classes", () => {
    it("should apply selected class to selected provider option", () => {
      const { container } = render(
        <ProviderSelector value="ollama" onChange={mockOnChange} />,
      );

      const selectedOptions = container.querySelectorAll(
        ".provider-selector__option--selected",
      );
      expect(selectedOptions.length).toBe(1);
    });

    it("should apply disabled class when disabled", () => {
      const { container } = render(
        <ProviderSelector value="ollama" onChange={mockOnChange} disabled />,
      );

      const disabledOptions = container.querySelectorAll(
        ".provider-selector__option--disabled",
      );
      expect(disabledOptions.length).toBe(3);
    });

    it("should not apply disabled class when not disabled", () => {
      const { container } = render(
        <ProviderSelector value="ollama" onChange={mockOnChange} />,
      );

      const disabledOptions = container.querySelectorAll(
        ".provider-selector__option--disabled",
      );
      expect(disabledOptions.length).toBe(0);
    });
  });

  describe("Accessibility", () => {
    it("should have radiogroup role", () => {
      render(<ProviderSelector value="openrouter" onChange={mockOnChange} />);

      const radiogroup = screen.getByRole("radiogroup");
      expect(radiogroup).toBeInTheDocument();
    });

    it("should have proper aria-labelledby", () => {
      render(<ProviderSelector value="openrouter" onChange={mockOnChange} />);

      const radiogroup = screen.getByRole("radiogroup");
      expect(radiogroup).toHaveAttribute(
        "aria-labelledby",
        "provider-selector-label",
      );
    });

    it("should have proper label association", () => {
      const { container } = render(
        <ProviderSelector value="openrouter" onChange={mockOnChange} />,
      );

      const label = container.querySelector("#provider-selector-label");
      expect(label).toHaveTextContent("LLM Provider");
    });

    it("should have unique IDs for each radio button", () => {
      render(<ProviderSelector value="openrouter" onChange={mockOnChange} />);

      expect(
        screen.getByRole("radio", { name: /OpenRouter/i }),
      ).toHaveAttribute("id", "provider-openrouter");
      expect(screen.getByRole("radio", { name: /Ollama/i })).toHaveAttribute(
        "id",
        "provider-ollama",
      );
      expect(screen.getByRole("radio", { name: /LM Studio/i })).toHaveAttribute(
        "id",
        "provider-lmstudio",
      );
    });

    it("should have proper name attribute for radio group", () => {
      render(<ProviderSelector value="openrouter" onChange={mockOnChange} />);

      const radios = screen.getAllByRole("radio");
      radios.forEach((radio) => {
        expect(radio).toHaveAttribute("name", "llm-provider");
      });
    });

    it("should have labels associated with radio inputs", () => {
      render(<ProviderSelector value="openrouter" onChange={mockOnChange} />);

      const openrouterRadio = screen.getByRole("radio", {
        name: /OpenRouter/i,
      });
      const openrouterLabel = screen.getByLabelText(/OpenRouter/i);

      expect(openrouterRadio).toBe(openrouterLabel);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty value gracefully", () => {
      render(<ProviderSelector value="" onChange={mockOnChange} />);

      const radios = screen.getAllByRole("radio");
      radios.forEach((radio) => {
        expect(radio).not.toBeChecked();
      });
    });

    it("should handle invalid value gracefully", () => {
      render(
        <ProviderSelector value="invalid-provider" onChange={mockOnChange} />,
      );

      const radios = screen.getAllByRole("radio");
      radios.forEach((radio) => {
        expect(radio).not.toBeChecked();
      });
    });

    it("should render when onChange is not provided (edge case)", () => {
      const { container } = render(
        <ProviderSelector value="openrouter" onChange={undefined} />,
      );

      expect(container.querySelector(".provider-selector")).toBeInTheDocument();
    });
  });
});
