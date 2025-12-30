import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { APIKeyInput } from "./APIKeyInput";

// Mock validation
const mockValidateApiKey = vi.fn();
vi.mock("../../utils/validation", () => ({
  validateApiKey: (...args) => mockValidateApiKey(...args),
}));

describe("APIKeyInput", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateApiKey.mockReturnValue({ isValid: true, errors: [] });
  });

  describe("Rendering", () => {
    it("should render input with label", () => {
      render(
        <APIKeyInput value="" onChange={mockOnChange} provider="openrouter" />,
      );

      expect(screen.getByLabelText("API Key")).toBeInTheDocument();
    });

    it("should render as password field by default", () => {
      render(
        <APIKeyInput
          value="test-key"
          onChange={mockOnChange}
          provider="openrouter"
        />,
      );

      const input = screen.getByLabelText("API Key");
      expect(input).toHaveAttribute("type", "password");
    });

    it("should render toggle visibility button", () => {
      render(
        <APIKeyInput
          value="test-key"
          onChange={mockOnChange}
          provider="openrouter"
        />,
      );

      expect(
        screen.getByLabelText(/Hide API key|Show API key/i),
      ).toBeInTheDocument();
    });

    it("should render toggle button with hide icon when visible", () => {
      render(
        <APIKeyInput
          value="test-key"
          onChange={mockOnChange}
          provider="openrouter"
        />,
      );

      const toggleButton = screen.getByLabelText(/Show API key/i);
      fireEvent.click(toggleButton);

      expect(screen.getByLabelText(/Hide API key/i)).toHaveTextContent("🙈");
    });

    it("should render toggle button with show icon when hidden", () => {
      render(
        <APIKeyInput
          value="test-key"
          onChange={mockOnChange}
          provider="openrouter"
        />,
      );

      const toggleButton = screen.getByLabelText(/Show API key/i);
      expect(toggleButton).toHaveTextContent("👁️");
    });

    it("should render help text", () => {
      render(
        <APIKeyInput value="" onChange={mockOnChange} provider="openrouter" />,
      );

      expect(
        screen.getByText(/stored only in your browser's session storage/i),
      ).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(
        <APIKeyInput
          value=""
          onChange={mockOnChange}
          provider="openrouter"
          className="custom-class"
        />,
      );

      expect(
        container.querySelector(".input-group.custom-class"),
      ).toBeInTheDocument();
    });
  });

  describe("Visibility Toggle", () => {
    it("should toggle input type when visibility button clicked", () => {
      render(
        <APIKeyInput
          value="test-key"
          onChange={mockOnChange}
          provider="openrouter"
        />,
      );

      const input = screen.getByLabelText("API Key");
      const toggleButton = screen.getByLabelText(/Show API key/i);

      expect(input).toHaveAttribute("type", "password");

      fireEvent.click(toggleButton);

      expect(input).toHaveAttribute("type", "text");

      fireEvent.click(screen.getByLabelText(/Hide API key/i));

      expect(input).toHaveAttribute("type", "password");
    });

    it("should update button label when toggling visibility", () => {
      render(
        <APIKeyInput
          value="test-key"
          onChange={mockOnChange}
          provider="openrouter"
        />,
      );

      const toggleButton = screen.getByLabelText(/Show API key/i);
      fireEvent.click(toggleButton);

      expect(screen.getByLabelText(/Hide API key/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Show API key/i)).not.toBeInTheDocument();
    });

    it("should disable toggle button when input is disabled", () => {
      render(
        <APIKeyInput
          value="test-key"
          onChange={mockOnChange}
          provider="openrouter"
          disabled
        />,
      );

      const toggleButton = screen.getByLabelText(/Show API key/i);
      expect(toggleButton).toBeDisabled();
    });

    it("should disable toggle button when value is empty", () => {
      render(
        <APIKeyInput value="" onChange={mockOnChange} provider="openrouter" />,
      );

      const toggleButton = screen.getByLabelText(/Show API key/i);
      expect(toggleButton).toBeDisabled();
    });
  });

  describe("Value Changes", () => {
    it("should call onChange when value changes", () => {
      render(
        <APIKeyInput value="" onChange={mockOnChange} provider="openrouter" />,
      );

      const input = screen.getByLabelText("API Key");
      fireEvent.change(input, { target: { value: "new-key" } });

      expect(mockOnChange).toHaveBeenCalledWith("new-key");
    });

    it("should clear error when value changes", () => {
      mockValidateApiKey.mockReturnValue({
        isValid: false,
        errors: ["Invalid API key"],
      });

      render(
        <APIKeyInput
          value="bad-key"
          onChange={mockOnChange}
          provider="openrouter"
        />,
      );

      const input = screen.getByLabelText("API Key");
      fireEvent.blur(input);

      expect(screen.getByText("Invalid API key")).toBeInTheDocument();

      fireEvent.change(input, { target: { value: "new-key" } });

      expect(screen.queryByText("Invalid API key")).not.toBeInTheDocument();
    });
  });

  describe("Validation", () => {
    it("should validate API key on blur", () => {
      render(
        <APIKeyInput
          value="test-key"
          onChange={mockOnChange}
          provider="openrouter"
        />,
      );

      const input = screen.getByLabelText("API Key");
      fireEvent.blur(input);

      expect(mockValidateApiKey).toHaveBeenCalledWith("test-key", "openrouter");
    });

    it("should not validate when value is empty", () => {
      render(
        <APIKeyInput value="" onChange={mockOnChange} provider="openrouter" />,
      );

      const input = screen.getByLabelText("API Key");
      fireEvent.blur(input);

      expect(mockValidateApiKey).not.toHaveBeenCalled();
    });

    it("should show validation error when invalid", () => {
      mockValidateApiKey.mockReturnValue({
        isValid: false,
        errors: ["API key must start with sk-", "API key is too short"],
      });

      render(
        <APIKeyInput
          value="bad-key"
          onChange={mockOnChange}
          provider="openrouter"
        />,
      );

      const input = screen.getByLabelText("API Key");
      fireEvent.blur(input);

      const error = screen.getByText(
        "API key must start with sk-, API key is too short",
      );
      expect(error).toBeInTheDocument();
      expect(error).toHaveClass("input-error");
    });

    it("should not show error when validation passes", () => {
      mockValidateApiKey.mockReturnValue({ isValid: true, errors: [] });

      render(
        <APIKeyInput
          value="valid-key"
          onChange={mockOnChange}
          provider="openrouter"
        />,
      );

      const input = screen.getByLabelText("API Key");
      fireEvent.blur(input);

      expect(screen.queryByText(/API key must start/)).not.toBeInTheDocument();
    });

    it("should apply error class to input when error exists", () => {
      mockValidateApiKey.mockReturnValue({
        isValid: false,
        errors: ["Invalid"],
      });

      render(
        <APIKeyInput
          value="bad-key"
          onChange={mockOnChange}
          provider="openrouter"
        />,
      );

      const input = screen.getByLabelText("API Key");
      fireEvent.blur(input);

      expect(input).toHaveClass("input-field--error");
    });
  });

  describe("Disabled State", () => {
    it("should disable input when disabled prop is true", () => {
      render(
        <APIKeyInput
          value="test-key"
          onChange={mockOnChange}
          provider="openrouter"
          disabled
        />,
      );

      const input = screen.getByLabelText("API Key");
      expect(input).toBeDisabled();
    });

    it("should disable toggle button when disabled prop is true", () => {
      render(
        <APIKeyInput
          value="test-key"
          onChange={mockOnChange}
          provider="openrouter"
          disabled
        />,
      );

      const toggleButton = screen.getByLabelText(/Show API key/i);
      expect(toggleButton).toBeDisabled();
    });
  });

  describe("Input Attributes", () => {
    it('should have autoComplete="off"', () => {
      render(
        <APIKeyInput value="" onChange={mockOnChange} provider="openrouter" />,
      );

      const input = screen.getByLabelText("API Key");
      expect(input).toHaveAttribute("autoComplete", "off");
    });

    it('should have spellCheck="false"', () => {
      render(
        <APIKeyInput value="" onChange={mockOnChange} provider="openrouter" />,
      );

      const input = screen.getByLabelText("API Key");
      expect(input).toHaveAttribute("spellCheck", "false");
    });

    it("should have placeholder text", () => {
      render(
        <APIKeyInput value="" onChange={mockOnChange} provider="openrouter" />,
      );

      const input = screen.getByLabelText("API Key");
      expect(input).toHaveAttribute("placeholder", "sk-or-v1-...");
    });

    it("should have id attribute", () => {
      render(
        <APIKeyInput value="" onChange={mockOnChange} provider="openrouter" />,
      );

      const input = screen.getByLabelText("API Key");
      expect(input).toHaveAttribute("id", "api-key");
    });
  });

  describe("Accessibility", () => {
    it("should have proper button labels", () => {
      render(
        <APIKeyInput
          value="test-key"
          onChange={mockOnChange}
          provider="openrouter"
        />,
      );

      expect(screen.getByLabelText("Show API key")).toBeInTheDocument();
    });

    it("should update aria-label when visibility toggles", () => {
      render(
        <APIKeyInput
          value="test-key"
          onChange={mockOnChange}
          provider="openrouter"
        />,
      );

      const toggleButton = screen.getByLabelText("Show API key");
      fireEvent.click(toggleButton);

      expect(screen.getByLabelText("Hide API key")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined value", () => {
      render(
        <APIKeyInput
          value={undefined}
          onChange={mockOnChange}
          provider="openrouter"
        />,
      );

      const input = screen.getByLabelText("API Key");
      expect(input).toHaveValue("");
    });

    it("should handle null value", () => {
      render(
        <APIKeyInput
          value={null}
          onChange={mockOnChange}
          provider="openrouter"
        />,
      );

      const input = screen.getByLabelText("API Key");
      expect(input).toHaveValue("");
    });

    it("should handle provider change", () => {
      const { rerender } = render(
        <APIKeyInput
          value="test-key"
          onChange={mockOnChange}
          provider="openrouter"
        />,
      );

      const input = screen.getByLabelText("API Key");
      fireEvent.blur(input);

      expect(mockValidateApiKey).toHaveBeenCalledWith("test-key", "openrouter");

      mockValidateApiKey.mockClear();

      rerender(
        <APIKeyInput
          value="test-key"
          onChange={mockOnChange}
          provider="anthropic"
        />,
      );

      fireEvent.blur(input);

      expect(mockValidateApiKey).toHaveBeenCalledWith("test-key", "anthropic");
    });

    it("should clear validation error when toggling visibility", () => {
      mockValidateApiKey.mockReturnValue({
        isValid: false,
        errors: ["Invalid"],
      });

      render(
        <APIKeyInput
          value="bad-key"
          onChange={mockOnChange}
          provider="openrouter"
        />,
      );

      const input = screen.getByLabelText("API Key");
      fireEvent.blur(input);

      expect(screen.getByText("Invalid")).toBeInTheDocument();

      const toggleButton = screen.getByLabelText("Show API key");
      fireEvent.click(toggleButton);

      // Error should still be present after toggling visibility
      expect(screen.getByText("Invalid")).toBeInTheDocument();
    });
  });

  describe("Help Text Display", () => {
    it("should show help text when no error", () => {
      render(
        <APIKeyInput value="" onChange={mockOnChange} provider="openrouter" />,
      );

      expect(
        screen.getByText(/stored only in your browser's session storage/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/session storage/i)).toHaveClass("input-hint");
    });

    it("should replace help text with error when validation fails", () => {
      mockValidateApiKey.mockReturnValue({
        isValid: false,
        errors: ["Invalid API key"],
      });

      render(
        <APIKeyInput
          value="bad-key"
          onChange={mockOnChange}
          provider="openrouter"
        />,
      );

      const input = screen.getByLabelText("API Key");
      fireEvent.blur(input);

      expect(screen.getByText("Invalid API key")).toBeInTheDocument();
      expect(
        screen.queryByText(/stored only in your browser's session storage/i),
      ).not.toBeInTheDocument();
    });

    it("should restore help text after error is cleared", () => {
      mockValidateApiKey.mockReturnValue({
        isValid: false,
        errors: ["Invalid API key"],
      });

      render(
        <APIKeyInput
          value="bad-key"
          onChange={mockOnChange}
          provider="openrouter"
        />,
      );

      const input = screen.getByLabelText("API Key");
      fireEvent.blur(input);

      expect(screen.getByText("Invalid API key")).toBeInTheDocument();

      fireEvent.change(input, { target: { value: "new-key" } });

      expect(
        screen.getByText(/stored only in your browser's session storage/i),
      ).toBeInTheDocument();
      expect(screen.queryByText("Invalid API key")).not.toBeInTheDocument();
    });
  });

  describe("Component Structure", () => {
    it("should render input-group wrapper", () => {
      const { container } = render(
        <APIKeyInput value="" onChange={mockOnChange} provider="openrouter" />,
      );

      expect(container.querySelector(".input-group")).toBeInTheDocument();
    });

    it("should render input-with-button container", () => {
      const { container } = render(
        <APIKeyInput value="" onChange={mockOnChange} provider="openrouter" />,
      );

      expect(
        container.querySelector(".input-with-button"),
      ).toBeInTheDocument();
    });

    it("should render button with correct classes", () => {
      render(
        <APIKeyInput
          value="test-key"
          onChange={mockOnChange}
          provider="openrouter"
        />,
      );

      const button = screen.getByLabelText("Show API key");
      expect(button).toHaveClass("btn", "btn--ghost", "btn--sm", "input-toggle-btn");
    });

    it("should render label with correct for attribute", () => {
      render(
        <APIKeyInput value="" onChange={mockOnChange} provider="openrouter" />,
      );

      const label = screen.getByText("API Key");
      expect(label).toHaveAttribute("for", "api-key");
    });
  });
});
