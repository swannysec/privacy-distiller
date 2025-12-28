import { useState, useCallback } from 'react';
import { Input, Button } from '../Common';
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

  /**
   * Clear API key
   */
  const handleClear = useCallback(() => {
    onChange('');
    setError(null);
  }, [onChange]);

  const hasValue = value && value.length > 0;

  return (
    <div className={`api-key-input ${className}`}>
      <div className="api-key-input__container">
        <Input
          type={isVisible ? 'text' : 'password'}
          name="api-key"
          label="API Key"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter your API key"
          disabled={disabled}
          error={error}
          required
          autoComplete="off"
          spellCheck={false}
          className="api-key-input__field"
          aria-describedby="api-key-help"
        />

        <div className="api-key-input__actions">
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={toggleVisibility}
            disabled={disabled || !hasValue}
            ariaLabel={isVisible ? 'Hide API key' : 'Show API key'}
            className="api-key-input__toggle"
          >
            {isVisible ? '🙈' : '👁️'}
          </Button>

          {hasValue && (
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={handleClear}
              disabled={disabled}
              ariaLabel="Clear API key"
              className="api-key-input__clear"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Help text */}
      <div className="api-key-input__help" id="api-key-help">
        <p className="api-key-input__help-text">
          Your API key is stored securely in your browser's session storage and is only
          sent to {provider === 'openrouter' ? 'OpenRouter' : 'your chosen provider'}.
        </p>

        {provider === 'openrouter' && (
          <p className="api-key-input__help-text">
            Get your OpenRouter API key from{' '}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="api-key-input__link"
            >
              openrouter.ai/keys
            </a>
          </p>
        )}
      </div>

      {/* Security notice */}
      <div className="api-key-input__security-notice">
        <span className="api-key-input__security-icon" aria-hidden="true">🔒</span>
        <span className="api-key-input__security-text">
          Your API key never leaves your browser and is not stored on any server
        </span>
      </div>
    </div>
  );
}
