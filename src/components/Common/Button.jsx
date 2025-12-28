/**
 * @file Button Component
 */

import React from 'react';

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {'button' | 'submit' | 'reset'} [props.type='button']
 * @param {'primary' | 'secondary' | 'danger'} [props.variant='primary']
 * @param {'small' | 'medium' | 'large'} [props.size='medium']
 * @param {boolean} [props.disabled=false]
 * @param {boolean} [props.loading=false]
 * @param {Function} [props.onClick]
 * @param {string} [props.className]
 * @param {string} [props.ariaLabel]
 */
export function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  ariaLabel,
  ...props
}) {
  const baseClasses = 'button';
  const variantClass = `button--${variant}`;
  const sizeClass = `button--${size}`;
  const disabledClass = disabled || loading ? 'button--disabled' : '';
  const loadingClass = loading ? 'button--loading' : '';

  const classes = [baseClasses, variantClass, sizeClass, disabledClass, loadingClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-busy={loading}
      {...props}
    >
      {loading && <span className="button__spinner" aria-hidden="true" />}
      <span className="button__content">{children}</span>
    </button>
  );
}
