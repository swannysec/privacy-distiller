import { useState, useCallback } from "react";
import { validateApiKey } from "../../utils/validation";
import type { LLMProvider } from "../../types";

interface APIKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  provider: LLMProvider;
  disabled?: boolean;
  className?: string;
}

export function APIKeyInput({
  value,
  onChange,
  provider: _provider,
  disabled = false,
  className = "",
}: APIKeyInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setError(null);
      onChange(newValue);
    },
    [onChange],
  );

  const handleBlur = useCallback(() => {
    if (value) {
      const validation = validateApiKey(value);
      if (!validation.valid) {
        setError(validation.errors.map((e) => e.message).join(", "));
      }
    }
  }, [value]);

  const toggleVisibility = useCallback(() => {
    setIsVisible((prev) => !prev);
  }, []);

  const hasValue = value && value.length > 0;

  return (
    <div className={`input-group ${className}`}>
      <label htmlFor="api-key" className="input-label">
        API Key
      </label>

      <div className="input-with-button">
        <input
          type={isVisible ? "text" : "password"}
          id="api-key"
          className={`input-field ${error ? "input-field--error" : ""}`}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="sk-or-v1-..."
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          className="btn btn--ghost btn--sm input-toggle-btn"
          onClick={toggleVisibility}
          disabled={disabled || !hasValue}
          aria-label={isVisible ? "Hide API key" : "Show API key"}
        >
          {isVisible ? "🙈" : "👁️"}
        </button>
      </div>

      {error ? (
        <p className="input-error">{error}</p>
      ) : (
        <p className="input-hint">
          Your API key is stored only in your browser's session storage
        </p>
      )}
    </div>
  );
}
