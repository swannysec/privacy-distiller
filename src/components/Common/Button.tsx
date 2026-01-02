/**
 * @file Button Component
 */

import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  ariaLabel?: string;
  style?: React.CSSProperties;
}

export function Button({
  children,
  type = "button",
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  onClick,
  className = "",
  ariaLabel,
  style,
  ...props
}: ButtonProps): React.ReactElement {
  const baseClasses = "btn";
  const variantClass =
    variant === "primary"
      ? "btn--primary"
      : variant === "secondary"
        ? "btn--secondary"
        : variant === "danger"
          ? "btn--danger"
          : variant === "ghost"
            ? "btn--ghost"
            : "";
  const sizeClass =
    size === "small" ? "btn--small" : size === "large" ? "btn--large" : "";
  const disabledClass = disabled || loading ? "btn--disabled" : "";
  const loadingClass = loading ? "btn--loading" : "";

  const classes = [
    baseClasses,
    variantClass,
    sizeClass,
    disabledClass,
    loadingClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

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
