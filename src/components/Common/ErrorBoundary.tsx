/**
 * @file Error Boundary Component
 * @description Catches React errors and provides recovery options
 */

import React from 'react';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Only log in development to avoid exposing details in production
    if (import.meta.env.DEV) {
      console.error('Error boundary caught:', error, errorInfo);
    }
  }

  /**
   * Resets error state to allow recovery without page refresh
   */
  handleReset(): void {
    this.setState({ hasError: false, error: null });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert">
          <h2 className="error-boundary__title">Something went wrong</h2>
          <p className="error-boundary__message">
            We encountered an unexpected error. You can try again or refresh the page.
          </p>
          <div className="error-boundary__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={this.handleReset}
            >
              Try Again
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <details className="error-boundary__details">
              <summary>Error details (dev only)</summary>
              <pre>{this.state.error.toString()}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
