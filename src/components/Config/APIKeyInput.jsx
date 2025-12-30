import { useState, useCallback } from 'react';
import { validateApiKey } from '../../utils/validation';

/**
 * APIKeyInput - Secure input component for API keys
 * @param {Object} props
 * @param {string} props.value - Current API key value
 * @param {Function} props.onChange - Callback when API key changes
 * @param {string} props.provider - Current provider ID
 * @param {boolean} props.disabled - Whether input is disabled
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function APIKeyInput({ value, onChange, provider, disabled = false, className = '' }) {
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Handle API key change
   * @param {React.ChangeEvent<HTMLInputElement>} e
   */
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    setError(null);
    onChange(newValue);
  }, [onChange]);

  /**
   * Handle blur - validate API key
   */
  const handleBlur = useCallback(() => {
    if (value) {
      const validation = validateApiKey(value, provider);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
      }
    }
  }, [value, provider]);

  /**
   * Toggle visibility
   */
  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  const hasValue = value && value.length > 0;

  return (
    <div className={`input-group ${className}`}>
      <label htmlFor="api-key" className="input-label">
        API Key
      </label>

      <div className="input-with-button">
        <input
          type={isVisible ? 'text' : 'password'}
          id="api-key"
          className={`input-field ${error ? 'input-field--error' : ''}`}
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
          aria-label={isVisible ? 'Hide API key' : 'Show API key'}
        >
          {isVisible ? '🙈' : '👁️'}
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
