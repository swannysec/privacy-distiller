/**
 * @file Input Component
 */

import React from "react";

export interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> {
  type?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  id?: string;
  name?: string;
  required?: boolean;
  className?: string;
}

export function Input({
  type = "text",
  value,
  onChange,
  placeholder,
  disabled = false,
  error,
  label,
  id,
  name,
  required = false,
  className = "",
  ...props
}: InputProps): React.ReactElement {
  const inputId =
    id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`input-wrapper ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && (
            <span className="input-required" aria-label="required">
              *
            </span>
          )}
        </label>
      )}
      <input
        type={type}
        id={inputId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`input ${error ? "input--error" : ""}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <div id={`${inputId}-error`} className="input-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
