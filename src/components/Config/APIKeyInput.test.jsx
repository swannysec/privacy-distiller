import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { APIKeyInput } from "./APIKeyInput";

// Mock child components
vi.mock("../Common", () => ({
  Input: vi.fn(
    ({
      type,
      name,
      label,
      value,
      onChange,
      onBlur,
      placeholder,
      disabled,
      error,
      required,
      autoComplete,
      spellCheck,
      className,
    }) => (
      <div className={className}>
        <label htmlFor={name}>{label}</label>
        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          spellCheck={spellCheck}
          aria-invalid={error ? "true" : "false"}
        />
        {error && <span role="alert">{error}</span>}
      </div>
    ),
  ),
  Button: vi.fn(
    ({
      type,
      variant,
      size,
      onClick,
      disabled,
      ariaLabel,
      className,
      children,
    }) => (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className={className}
        data-variant={variant}
        data-size={size}
      >
        {children}
      </button>
    ),
  ),
}));

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
    it("should render Input component", () => {
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

    it("should render Clear button when value exists", () => {
      render(
        <APIKeyInput
          value="test-key"
          onChange={mockOnChange}
          provider="openrouter"
        />,
      );

      expect(screen.getByLabelText("Clear API key")).toBeInTheDocument();
    });

    it("should NOT render Clear button when value is empty", () => {
      render(
        <APIKeyInput value="" onChange={mockOnChange} provider="openrouter" />,
      );

      expect(screen.queryByLabelText("Clear API key")).not.toBeInTheDocument();
    });

    it("should render help text", () => {
      render(
        <APIKeyInput value="" onChange={mockOnChange} provider="openrouter" />,
      );

      expect(
        screen.getByText(/stored securely in your browser/i),
      ).toBeInTheDocument();
    });

    it("should render security notice", () => {
      render(
        <APIKeyInput value="" onChange={mockOnChange} provider="openrouter" />,
      );

      expect(
        screen.getByText(/never leaves your browser/i),
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
        container.querySelector(".api-key-input.custom-class"),
      ).toBeInTheDocument();
    });
  });

  describe("Provider-Specific Content", () => {
    it("should show OpenRouter link when provider is openrouter", () => {
      render(
        <APIKeyInput value="" onChange={mockOnChange} provider="openrouter" />,
      );

      const link = screen.getByRole("link", { name: /openrouter.ai\/keys/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "https://openrouter.ai/keys");
    });

    it("should mention OpenRouter in help text", () => {
      render(
        <APIKeyInput value="" onChange={mockOnChange} provider="openrouter" />,
      );

      expect(screen.getByText(/only sent to OpenRouter/i)).toBeInTheDocument();
    });

    it("should mention provider in help text for non-OpenRouter", () => {
      render(<APIKeyInput value="" onChange={mockOnChange} provider="other" />);

      expect(
        screen.getByText(/only sent to your chosen provider/i),
      ).toBeInTheDocument();
    });

    it("should not show OpenRouter link for other providers", () => {
      render(<APIKeyInput value="" onChange={mockOnChange} provider="other" />);

      expect(
        screen.queryByRole("link", { name: /openrouter.ai\/keys/i }),
      ).not.toBeInTheDocument();
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

      expect(screen.getByRole("alert")).toHaveTextContent("Invalid API key");

      fireEvent.change(input, { target: { value: "new-key" } });

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
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

      const error = screen.getByRole("alert");
      expect(error).toHaveTextContent(
        "API key must start with sk-, API key is too short",
      );
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

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("Clear Functionality", () => {
    it("should call onChange with empty string when Clear clicked", () => {
      render(
        <APIKeyInput
          value="test-key"
          onChange={mockOnChange}
          provider="openrouter"
        />,
      );

      const clearButton = screen.getByLabelText("Clear API key");
      fireEvent.click(clearButton);

      expect(mockOnChange).toHaveBeenCalledWith("");
    });

    it("should clear error when Clear clicked", () => {
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

      expect(screen.getByRole("alert")).toBeInTheDocument();

      const clearButton = screen.getByLabelText("Clear API key");
      fireEvent.click(clearButton);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("should disable Clear button when input is disabled", () => {
      render(
        <APIKeyInput
          value="test-key"
          onChange={mockOnChange}
          provider="openrouter"
          disabled
        />,
      );

      const clearButton = screen.getByLabelText("Clear API key");
      expect(clearButton).toBeDisabled();
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

    it("should disable all buttons when disabled prop is true", () => {
      render(
        <APIKeyInput
          value="test-key"
          onChange={mockOnChange}
          provider="openrouter"
          disabled
        />,
      );

      const toggleButton = screen.getByLabelText(/Show API key/i);
      const clearButton = screen.getByLabelText("Clear API key");

      expect(toggleButton).toBeDisabled();
      expect(clearButton).toBeDisabled();
    });
  });

  describe("Input Attributes", () => {
    it("should have required attribute", () => {
      render(
        <APIKeyInput value="" onChange={mockOnChange} provider="openrouter" />,
      );

      const input = screen.getByLabelText("API Key");
      expect(input).toBeRequired();
    });

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
      expect(input).toHaveAttribute("placeholder", "Enter your API key");
    });

    it("should have name attribute", () => {
      render(
        <APIKeyInput value="" onChange={mockOnChange} provider="openrouter" />,
      );

      const input = screen.getByLabelText("API Key");
      expect(input).toHaveAttribute("name", "api-key");
    });
  });

  describe("Accessibility", () => {
    it("should have aria-describedby for help text", () => {
      render(
        <APIKeyInput value="" onChange={mockOnChange} provider="openrouter" />,
      );

      const helpText = screen
        .getByText(/stored securely in your browser/i)
        .closest("#api-key-help");
      expect(helpText).toBeInTheDocument();
    });

    it("should have aria-invalid when error exists", () => {
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

      expect(input).toHaveAttribute("aria-invalid", "true");
    });

    it("should mark error as alert role", () => {
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

      const error = screen.getByRole("alert");
      expect(error).toBeInTheDocument();
    });

    it("should have aria-hidden on security icon", () => {
      const { container } = render(
        <APIKeyInput value="" onChange={mockOnChange} provider="openrouter" />,
      );

      const securityIcon = container.querySelector(
        ".api-key-input__security-icon",
      );
      expect(securityIcon).toHaveAttribute("aria-hidden", "true");
    });

    it("should have proper button labels", () => {
      render(
        <APIKeyInput
          value="test-key"
          onChange={mockOnChange}
          provider="openrouter"
        />,
      );

      expect(screen.getByLabelText("Show API key")).toBeInTheDocument();
      expect(screen.getByLabelText("Clear API key")).toBeInTheDocument();
    });

    it('should have target="_blank" and rel="noopener noreferrer" on external links', () => {
      render(
        <APIKeyInput value="" onChange={mockOnChange} provider="openrouter" />,
      );

      const link = screen.getByRole("link", { name: /openrouter.ai\/keys/i });
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
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

    it("should handle validation errors as array", () => {
      mockValidateApiKey.mockReturnValue({
        isValid: false,
        errors: ["Error 1", "Error 2", "Error 3"],
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

      const error = screen.getByRole("alert");
      expect(error).toHaveTextContent("Error 1, Error 2, Error 3");
    });

    it("should handle rapid visibility toggles", () => {
      render(
        <APIKeyInput
          value="test-key"
          onChange={mockOnChange}
          provider="openrouter"
        />,
      );

      const input = screen.getByLabelText("API Key");

      for (let i = 0; i < 5; i++) {
        const toggleButton = screen.getByLabelText(/^(Show|Hide) API key$/i);
        fireEvent.click(toggleButton);
      }

      expect(input).toHaveAttribute("type", "text");
    });
  });
});
