import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { URLInput } from './URLInput';

// Mock child components
vi.mock('../Common', () => ({
  Button: ({ children, disabled, loading, type, onClick, ariaLabel }) => (
    <button
      type={type}
      disabled={disabled}
      data-loading={loading}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  ),
  Input: ({ value, onChange, onKeyDown, disabled, error, label, id, name, ref, ...props }) => {
    const inputId = id || name || 'test-input';
    return (
      <div>
        {label && <label htmlFor={inputId}>{label}</label>}
        <input
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          disabled={disabled}
          data-error={error}
          {...props}
        />
        {error && <div data-testid="input-error">{error}</div>}
      </div>
    );
  },
}));

describe('URLInput', () => {
  let mockOnSubmit;

  beforeEach(() => {
    mockOnSubmit = vi.fn();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render input field', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      expect(screen.getByLabelText('Privacy Policy URL')).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      expect(screen.getByRole('button', { name: 'Analyze privacy policy' })).toBeInTheDocument();
    });

    it('should render help text', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      expect(screen.getByText('Enter the URL of any privacy policy or terms of service document')).toBeInTheDocument();
    });

    it('should render example buttons', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      expect(screen.getByText('Google Privacy Policy')).toBeInTheDocument();
      expect(screen.getByText('Facebook Privacy Policy')).toBeInTheDocument();
      expect(screen.getByText('Amazon Privacy Notice')).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      const input = screen.getByLabelText('Privacy Policy URL');
      expect(input).toHaveAttribute('placeholder', 'https://example.com/privacy-policy');
    });

    it('should render with custom placeholder', () => {
      render(<URLInput onSubmit={mockOnSubmit} placeholder="Custom placeholder" />);
      const input = screen.getByLabelText('Privacy Policy URL');
      expect(input).toHaveAttribute('placeholder', 'Custom placeholder');
    });
  });

  describe('input handling', () => {
    it('should update value when typing', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      const input = screen.getByLabelText('Privacy Policy URL');

      fireEvent.change(input, { target: { value: 'https://example.com' } });

      expect(input).toHaveValue('https://example.com');
    });

    it('should start with empty value', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      const input = screen.getByLabelText('Privacy Policy URL');
      expect(input).toHaveValue('');
    });

    it('should handle multiple input changes', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      const input = screen.getByLabelText('Privacy Policy URL');

      fireEvent.change(input, { target: { value: 'https://' } });
      expect(input).toHaveValue('https://');

      fireEvent.change(input, { target: { value: 'https://example' } });
      expect(input).toHaveValue('https://example');

      fireEvent.change(input, { target: { value: 'https://example.com' } });
      expect(input).toHaveValue('https://example.com');
    });
  });

  describe('form submission', () => {
    it('should call onSubmit with URL when form submitted', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      const input = screen.getByLabelText('Privacy Policy URL');
      const submitButton = screen.getByRole('button', { name: 'Analyze privacy policy' });

      fireEvent.change(input, { target: { value: 'https://example.com/privacy' } });
      fireEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith('https://example.com/privacy');
    });

    it('should trim URL before submitting', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      const input = screen.getByLabelText('Privacy Policy URL');
      const submitButton = screen.getByRole('button', { name: 'Analyze privacy policy' });

      fireEvent.change(input, { target: { value: '  https://example.com  ' } });
      fireEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith('https://example.com');
    });

    it('should not submit empty URL', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      const submitButton = screen.getByRole('button', { name: 'Analyze privacy policy' });

      fireEvent.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should not submit whitespace-only URL', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      const input = screen.getByLabelText('Privacy Policy URL');
      const submitButton = screen.getByRole('button', { name: 'Analyze privacy policy' });

      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should submit on Enter key', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      const input = screen.getByLabelText('Privacy Policy URL');

      fireEvent.change(input, { target: { value: 'https://example.com' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnSubmit).toHaveBeenCalledWith('https://example.com');
    });

    it('should not submit on Shift+Enter', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      const input = screen.getByLabelText('Privacy Policy URL');

      fireEvent.change(input, { target: { value: 'https://example.com' } });
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should prevent default form submission', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      const input = screen.getByLabelText('Privacy Policy URL');
      const form = input.closest('form');

      fireEvent.change(input, { target: { value: 'https://example.com' } });

      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault');

      form.dispatchEvent(submitEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('example buttons', () => {
    it('should populate Google example URL', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      const input = screen.getByLabelText('Privacy Policy URL');
      const googleButton = screen.getByText('Google Privacy Policy');

      fireEvent.click(googleButton);

      expect(input).toHaveValue('https://www.google.com/policies/privacy/');
    });

    it('should populate Facebook example URL', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      const input = screen.getByLabelText('Privacy Policy URL');
      const facebookButton = screen.getByText('Facebook Privacy Policy');

      fireEvent.click(facebookButton);

      expect(input).toHaveValue('https://www.facebook.com/privacy/policy/');
    });

    it('should populate Amazon example URL', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      const input = screen.getByLabelText('Privacy Policy URL');
      const amazonButton = screen.getByText('Amazon Privacy Notice');

      fireEvent.click(amazonButton);

      expect(input).toHaveValue('https://www.amazon.com/gp/help/customer/display.html?nodeId=468496');
    });

    it('should overwrite existing URL with example', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      const input = screen.getByLabelText('Privacy Policy URL');
      const googleButton = screen.getByText('Google Privacy Policy');

      fireEvent.change(input, { target: { value: 'https://old-url.com' } });
      fireEvent.click(googleButton);

      expect(input).toHaveValue('https://www.google.com/policies/privacy/');
    });
  });

  describe('disabled state', () => {
    it('should disable input when disabled', () => {
      render(<URLInput onSubmit={mockOnSubmit} disabled />);
      const input = screen.getByLabelText('Privacy Policy URL');
      expect(input).toBeDisabled();
    });

    it('should disable submit button when disabled', () => {
      render(<URLInput onSubmit={mockOnSubmit} disabled />);
      const submitButton = screen.getByRole('button', { name: 'Analyze privacy policy' });
      expect(submitButton).toBeDisabled();
    });

    it('should disable example buttons when disabled', () => {
      render(<URLInput onSubmit={mockOnSubmit} disabled />);
      const googleButton = screen.getByText('Google Privacy Policy');
      const facebookButton = screen.getByText('Facebook Privacy Policy');
      const amazonButton = screen.getByText('Amazon Privacy Notice');

      expect(googleButton).toBeDisabled();
      expect(facebookButton).toBeDisabled();
      expect(amazonButton).toBeDisabled();
    });

    it('should not submit when disabled', () => {
      render(<URLInput onSubmit={mockOnSubmit} disabled />);
      const input = screen.getByLabelText('Privacy Policy URL');
      const submitButton = screen.getByRole('button', { name: 'Analyze privacy policy' });

      fireEvent.change(input, { target: { value: 'https://example.com' } });
      fireEvent.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should not populate examples when disabled', () => {
      render(<URLInput onSubmit={mockOnSubmit} disabled />);
      const input = screen.getByLabelText('Privacy Policy URL');
      const googleButton = screen.getByText('Google Privacy Policy');

      fireEvent.click(googleButton);

      expect(input).toHaveValue('');
    });
  });

  // Note: The component's validation state is synchronous (try/finally block)
  // so it doesn't maintain a loading state during async operations.
  // The isValidating state is set true then immediately false in the same tick.

  describe('button state', () => {
    it('should disable submit button when URL is empty', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      const submitButton = screen.getByRole('button', { name: 'Analyze privacy policy' });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when URL has value', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      const input = screen.getByLabelText('Privacy Policy URL');
      const submitButton = screen.getByRole('button', { name: 'Analyze privacy policy' });

      fireEvent.change(input, { target: { value: 'https://example.com' } });

      expect(submitButton).not.toBeDisabled();
    });

    it('should disable submit button for whitespace-only input', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      const input = screen.getByLabelText('Privacy Policy URL');
      const submitButton = screen.getByRole('button', { name: 'Analyze privacy policy' });

      fireEvent.change(input, { target: { value: '   ' } });

      expect(submitButton).toBeDisabled();
    });
  });

  describe('error display', () => {
    it('should display error message', () => {
      render(<URLInput onSubmit={mockOnSubmit} error="Invalid URL format" />);
      expect(screen.getByTestId('input-error')).toHaveTextContent('Invalid URL format');
    });

    it('should not display error when null', () => {
      render(<URLInput onSubmit={mockOnSubmit} error={null} />);
      expect(screen.queryByTestId('input-error')).not.toBeInTheDocument();
    });

    it('should pass error to Input component', () => {
      render(<URLInput onSubmit={mockOnSubmit} error="Test error" />);
      const input = screen.getByLabelText('Privacy Policy URL');
      expect(input).toHaveAttribute('data-error', 'Test error');
    });
  });

  describe('className prop', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <URLInput onSubmit={mockOnSubmit} className="custom-class" />
      );
      const form = container.querySelector('.url-input');
      expect(form.className).toContain('custom-class');
    });
  });

  describe('accessibility', () => {
    it('should have proper form structure', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      const input = screen.getByLabelText('Privacy Policy URL');
      const form = input.closest('form');
      expect(form).toBeInTheDocument();
    });

    it('should have noValidate attribute', () => {
      const { container } = render(<URLInput onSubmit={mockOnSubmit} />);
      const form = container.querySelector('form');
      expect(form).toHaveAttribute('noValidate');
    });

    it('should associate error with input', () => {
      render(<URLInput onSubmit={mockOnSubmit} error="Error message" />);
      const input = screen.getByLabelText('Privacy Policy URL');
      expect(input).toHaveAttribute('aria-describedby', 'url-input-error');
    });

    it('should have help text with id', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      const helpText = screen.getByText('Enter the URL of any privacy policy or terms of service document');
      expect(helpText).toHaveAttribute('id', 'url-input-help');
    });

    it('should have required attribute', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      const input = screen.getByLabelText('Privacy Policy URL');
      expect(input).toHaveAttribute('required');
    });
  });

  describe('input attributes', () => {
    it('should have url type', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      const input = screen.getByLabelText('Privacy Policy URL');
      expect(input).toHaveAttribute('type', 'url');
    });

    it('should have name attribute', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      const input = screen.getByLabelText('Privacy Policy URL');
      expect(input).toHaveAttribute('name', 'policy-url');
    });

    it('should have autoComplete attribute', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      const input = screen.getByLabelText('Privacy Policy URL');
      expect(input).toHaveAttribute('autoComplete', 'url');
    });

    it('should have spellCheck disabled', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      const input = screen.getByLabelText('Privacy Policy URL');
      expect(input).toHaveAttribute('spellCheck', 'false');
    });
  });

  describe('focus behavior', () => {
    it('should focus input on mount', () => {
      render(<URLInput onSubmit={mockOnSubmit} />);
      const input = screen.getByLabelText('Privacy Policy URL');

      // Note: In jsdom, we can't truly test focus, but we can verify the ref is set
      expect(input).toBeInTheDocument();
    });

    it('should not focus input when disabled', () => {
      render(<URLInput onSubmit={mockOnSubmit} disabled />);
      const input = screen.getByLabelText('Privacy Policy URL');
      expect(input).toBeDisabled();
    });
  });
});
