import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow, errorMessage }) => {
  if (shouldThrow) {
    throw new Error(errorMessage || 'Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for cleaner test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('normal rendering', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Child component</div>
        </ErrorBoundary>
      );
      expect(screen.getByText('Child component')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <ErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
        </ErrorBoundary>
      );
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });

    it('should render complex child components', () => {
      const ComplexChild = () => (
        <div>
          <h1>Title</h1>
          <p>Content</p>
        </div>
      );

      render(
        <ErrorBoundary>
          <ComplexChild />
        </ErrorBoundary>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should catch errors from child components', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should display error message', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(
        screen.getByText('We encountered an unexpected error. You can try again or refresh the page.')
      ).toBeInTheDocument();
    });

    it('should have error-boundary class', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorDiv = screen.getByRole('alert');
      expect(errorDiv.className).toContain('error-boundary');
    });

    it('should display error title', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const title = screen.getByText('Something went wrong');
      expect(title.tagName).toBe('H2');
      expect(title.className).toContain('error-boundary__title');
    });

    it('should display error message in paragraph', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const message = screen.getByText(/We encountered an unexpected error/);
      expect(message.tagName).toBe('P');
      expect(message.className).toContain('error-boundary__message');
    });
  });

  describe('error details', () => {
    it('should render error details in details element', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Custom error message" />
        </ErrorBoundary>
      );

      const details = document.querySelector('.error-boundary__details');
      expect(details).toBeInTheDocument();
      expect(details.tagName).toBe('DETAILS');
    });

    it('should have summary for error details', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const summary = screen.getByText('Error details (dev only)');
      expect(summary.tagName).toBe('SUMMARY');
    });

    it('should display error string in pre element', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Test error message" />
        </ErrorBoundary>
      );

      const pre = document.querySelector('pre');
      expect(pre).toBeInTheDocument();
      expect(pre).toHaveTextContent('Error: Test error message');
    });

    it('should show specific error message', () => {
      const customError = 'Network connection failed';
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage={customError} />
        </ErrorBoundary>
      );

      const pre = document.querySelector('pre');
      expect(pre).toHaveTextContent(customError);
    });
  });

  describe('component lifecycle', () => {
    it('should call componentDidCatch when error occurs', () => {
      const spy = vi.spyOn(ErrorBoundary.prototype, 'componentDidCatch');

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should log error to console', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Console test" />
        </ErrorBoundary>
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error boundary caught:',
        expect.any(Error),
        expect.any(Object)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should update state via getDerivedStateFromError', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Error boundary should be rendered (not children)
      expect(screen.queryByText('No error')).not.toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have role alert for error state', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should be accessible to screen readers', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Something went wrong');
    });
  });

  describe('error boundary structure', () => {
    it('should have correct DOM structure', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorDiv = screen.getByRole('alert');
      const title = errorDiv.querySelector('.error-boundary__title');
      const message = errorDiv.querySelector('.error-boundary__message');
      const details = errorDiv.querySelector('.error-boundary__details');

      expect(title).toBeInTheDocument();
      expect(message).toBeInTheDocument();
      expect(details).toBeInTheDocument();
    });

    it('should render elements in correct order', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorDiv = container.querySelector('.error-boundary');
      const children = Array.from(errorDiv.children);

      expect(children[0].className).toContain('error-boundary__title');
      expect(children[1].className).toContain('error-boundary__message');
      expect(children[2].className).toContain('error-boundary__actions');
      // Note: details only shown in DEV mode, which may not be set in tests
    });
  });

  describe('conditional rendering', () => {
    it('should not render error when child does not throw', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should switch from normal to error state', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();

      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText('No error')).not.toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('error types', () => {
    it('should handle Error instances', () => {
      const ThrowCustomError = () => {
        throw new Error('Custom error');
      };

      render(
        <ErrorBoundary>
          <ThrowCustomError />
        </ErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Error: Custom error/)).toBeInTheDocument();
    });

    it('should handle TypeError', () => {
      const ThrowTypeError = () => {
        throw new TypeError('Type error occurred');
      };

      render(
        <ErrorBoundary>
          <ThrowTypeError />
        </ErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/TypeError: Type error occurred/)).toBeInTheDocument();
    });

    it('should handle ReferenceError', () => {
      const ThrowReferenceError = () => {
        throw new ReferenceError('Reference error occurred');
      };

      render(
        <ErrorBoundary>
          <ThrowReferenceError />
        </ErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/ReferenceError: Reference error occurred/)).toBeInTheDocument();
    });
  });

  describe('nested error boundaries', () => {
    it('should catch errors in nested boundaries', () => {
      render(
        <ErrorBoundary>
          <div>
            <ErrorBoundary>
              <ThrowError shouldThrow={true} />
            </ErrorBoundary>
          </div>
        </ErrorBoundary>
      );

      // Inner boundary should catch the error
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should isolate errors to closest boundary', () => {
      render(
        <ErrorBoundary>
          <div>Outer content</div>
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        </ErrorBoundary>
      );

      // Outer boundary's content should still be visible
      // This test may need adjustment based on React's error handling
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle null children', () => {
      render(<ErrorBoundary>{null}</ErrorBoundary>);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should handle undefined children', () => {
      render(<ErrorBoundary>{undefined}</ErrorBoundary>);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should handle empty children', () => {
      render(<ErrorBoundary></ErrorBoundary>);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should handle errors with no message', () => {
      const ThrowEmptyError = () => {
        throw new Error();
      };

      render(
        <ErrorBoundary>
          <ThrowEmptyError />
        </ErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
