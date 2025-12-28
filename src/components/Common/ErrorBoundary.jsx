/**
 * @file Error Boundary Component
 */

import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert">
          <h2 className="error-boundary__title">Something went wrong</h2>
          <p className="error-boundary__message">
            We encountered an unexpected error. Please refresh the page and try again.
          </p>
          {this.state.error && (
            <details className="error-boundary__details">
              <summary>Error details</summary>
              <pre>{this.state.error.toString()}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
