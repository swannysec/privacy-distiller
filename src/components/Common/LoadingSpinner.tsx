/**
 * @file Loading Spinner Component
 */

import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

export function LoadingSpinner({ size = 'medium', message }: LoadingSpinnerProps): JSX.Element {
  return (
    <div className="loading-spinner" role="status">
      <div className={`spinner spinner--${size}`} aria-hidden="true">
        <div className="spinner__circle"></div>
      </div>
      {message && <p className="loading-spinner__message">{message}</p>}
      <span className="sr-only">Loading...</span>
    </div>
  );
}
