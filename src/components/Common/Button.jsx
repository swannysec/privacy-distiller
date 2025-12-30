/**
 * @file Button Component
 */

import React from 'react';

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {'button' | 'submit' | 'reset'} [props.type='button']
 * @param {'primary' | 'secondary' | 'danger' | 'ghost'} [props.variant='primary']
 * @param {'small' | 'medium' | 'large'} [props.size='medium']
 * @param {boolean} [props.disabled=false]
 * @param {boolean} [props.loading=false]
 * @param {Function} [props.onClick]
 * @param {string} [props.className]
 * @param {string} [props.ariaLabel]
 * @param {Object} [props.style]
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
  style,
  ...props
}) {
  const baseClasses = 'btn';
  const variantClass = variant === 'primary' ? 'btn--primary' :
                       variant === 'secondary' ? 'btn--secondary' :
                       variant === 'danger' ? 'btn--danger' :
                       variant === 'ghost' ? 'btn--ghost' : '';
  const sizeClass = size === 'small' ? 'btn--small' :
                    size === 'large' ? 'btn--large' : '';
  const disabledClass = disabled || loading ? 'btn--disabled' : '';
  const loadingClass = loading ? 'btn--loading' : '';

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
      style={style}
      {...props}
    >
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      <span className="btn__content">{children}</span>
    </button>
  );
}
