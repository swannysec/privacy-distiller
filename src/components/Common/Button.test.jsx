import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  describe('rendering', () => {
    it('should render with children', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('should render with default type button', () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should render with submit type', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should render with reset type', () => {
      render(<Button type="reset">Reset</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'reset');
    });
  });

  describe('variants', () => {
    it('should apply primary variant by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('btn--primary');
    });

    it('should apply secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('btn--secondary');
    });

    it('should apply danger variant', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('btn--danger');
    });
  });

  describe('sizes', () => {
    it('should apply medium size by default', () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole('button');
      // Medium is default - no size class is added (only small/large get classes)
      expect(button.className).toContain('btn');
      expect(button.className).not.toContain('btn--small');
      expect(button.className).not.toContain('btn--large');
    });

    it('should apply small size', () => {
      render(<Button size="small">Small</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('btn--small');
    });

    it('should apply large size', () => {
      render(<Button size="large">Large</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('btn--large');
    });
  });

  describe('disabled state', () => {
    it('should be enabled by default', () => {
      render(<Button>Enabled</Button>);
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('should apply disabled state', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should apply disabled class when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('btn--disabled');
    });

    it('should not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('should not be loading by default', () => {
      render(<Button>Not Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('aria-busy', 'true');
    });

    it('should apply loading state', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should disable button when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should apply loading class', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('btn--loading');
    });

    it('should render spinner when loading', () => {
      render(<Button loading>Loading</Button>);
      const spinner = document.querySelector('.btn__spinner');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });

    it('should not call onClick when loading', () => {
      const handleClick = vi.fn();
      render(<Button loading onClick={handleClick}>Loading</Button>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should apply both disabled and loading classes', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('btn--disabled');
      expect(button.className).toContain('btn--loading');
    });
  });

  describe('onClick handler', () => {
    it('should call onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should work without onClick handler', () => {
      render(<Button>No handler</Button>);
      const button = screen.getByRole('button');
      expect(() => fireEvent.click(button)).not.toThrow();
    });

    it('should pass event to onClick handler', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('className prop', () => {
    it('should apply custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-class');
    });

    it('should preserve base classes with custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('btn');
      expect(button.className).toContain('btn--primary');
      expect(button.className).toContain('custom-class');
    });
  });

  describe('aria-label', () => {
    it('should apply aria-label', () => {
      render(<Button ariaLabel="Custom label">Icon only</Button>);
      const button = screen.getByRole('button', { name: 'Custom label' });
      expect(button).toBeInTheDocument();
    });

    it('should work without aria-label', () => {
      render(<Button>Visible text</Button>);
      const button = screen.getByRole('button', { name: 'Visible text' });
      expect(button).toBeInTheDocument();
    });
  });

  describe('content structure', () => {
    it('should wrap children in button__content span', () => {
      render(<Button>Content</Button>);
      const content = document.querySelector('.btn__content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveTextContent('Content');
    });

    it('should render spinner before content when loading', () => {
      const { container } = render(<Button loading>Content</Button>);
      const button = container.querySelector('button');
      const spinner = button.querySelector('.btn__spinner');
      const content = button.querySelector('.btn__content');

      expect(spinner).toBeInTheDocument();
      expect(content).toBeInTheDocument();
      expect(button.children[0]).toBe(spinner);
      expect(button.children[1]).toBe(content);
    });
  });

  describe('additional props', () => {
    it('should forward additional props to button element', () => {
      render(<Button data-testid="custom-button" data-custom="value">Test</Button>);
      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('data-custom', 'value');
    });

    it('should support title attribute', () => {
      render(<Button title="Tooltip text">Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Tooltip text');
    });
  });

  describe('combined states', () => {
    it('should combine variant, size, and className', () => {
      render(
        <Button variant="secondary" size="large" className="custom">
          Combined
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button.className).toContain('btn--secondary');
      expect(button.className).toContain('btn--large');
      expect(button.className).toContain('custom');
    });

    it('should combine disabled and custom className', () => {
      render(
        <Button disabled className="custom">
          Disabled Custom
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button.className).toContain('btn--disabled');
      expect(button.className).toContain('custom');
    });

    it('should handle all props together', () => {
      const handleClick = vi.fn();
      render(
        <Button
          type="submit"
          variant="danger"
          size="small"
          disabled
          loading
          onClick={handleClick}
          className="custom"
          ariaLabel="Submit form"
        >
          Submit
        </Button>
      );
      const button = screen.getByRole('button', { name: 'Submit form' });
      expect(button).toHaveAttribute('type', 'submit');
      expect(button.className).toContain('btn--danger');
      expect(button.className).toContain('btn--small');
      expect(button.className).toContain('btn--disabled');
      expect(button.className).toContain('btn--loading');
      expect(button.className).toContain('custom');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });
});
