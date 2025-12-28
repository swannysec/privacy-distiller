import { useState, useCallback, useRef, useEffect } from 'react';
import { Button, Input } from '../Common';

/**
 * URLInput - Input component for privacy policy URLs
 * @param {Object} props
 * @param {Function} props.onSubmit - Callback when URL is submitted
 * @param {boolean} props.disabled - Whether input is disabled
 * @param {string} props.error - Error message to display
 * @param {string} props.placeholder - Input placeholder text
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function URLInput({
  onSubmit,
  disabled = false,
  error = null,
  placeholder = 'https://example.com/privacy-policy',
  className = ''
}) {
  const [url, setUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const inputRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  /**
   * Handle URL input change
   * @param {React.ChangeEvent<HTMLInputElement>} e
   */
  const handleChange = useCallback((e) => {
    setUrl(e.target.value);
  }, []);

  /**
   * Handle form submission
   * @param {React.FormEvent} e
   */
  const handleSubmit = useCallback((e) => {
    e.preventDefault();

    if (!url.trim() || disabled || isValidating) {
      return;
    }

    setIsValidating(true);

    try {
      onSubmit(url.trim());
    } finally {
      setIsValidating(false);
    }
  }, [url, disabled, isValidating, onSubmit]);

  /**
   * Handle Enter key
   * @param {React.KeyboardEvent} e
   */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const isDisabled = disabled || isValidating;
  const hasValue = url.trim().length > 0;

  return (
    <form
      className={`url-input ${className}`}
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="url-input__container">
        <Input
          ref={inputRef}
          type="url"
          name="policy-url"
          label="Privacy Policy URL"
          value={url}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isDisabled}
          error={error}
          required
          autoComplete="url"
          spellCheck={false}
          aria-describedby={error ? 'url-input-error' : undefined}
          className="url-input__field"
        />

        <div className="url-input__actions">
          <Button
            type="submit"
            variant="primary"
            size="large"
            disabled={isDisabled || !hasValue}
            loading={isValidating}
            ariaLabel="Analyze privacy policy"
            className="url-input__submit"
          >
            Analyze Policy
          </Button>
        </div>
      </div>

      {/* Help text */}
      <p className="url-input__help" id="url-input-help">
        Enter the URL of any privacy policy or terms of service document
      </p>

      {/* Examples */}
      <div className="url-input__examples">
        <p className="url-input__examples-label">Examples:</p>
        <ul className="url-input__examples-list">
          <li>
            <button
              type="button"
              className="url-input__example-button"
              onClick={() => setUrl('https://www.google.com/policies/privacy/')}
              disabled={isDisabled}
            >
              Google Privacy Policy
            </button>
          </li>
          <li>
            <button
              type="button"
              className="url-input__example-button"
              onClick={() => setUrl('https://www.facebook.com/privacy/policy/')}
              disabled={isDisabled}
            >
              Facebook Privacy Policy
            </button>
          </li>
          <li>
            <button
              type="button"
              className="url-input__example-button"
              onClick={() => setUrl('https://www.amazon.com/gp/help/customer/display.html?nodeId=468496')}
              disabled={isDisabled}
            >
              Amazon Privacy Notice
            </button>
          </li>
        </ul>
      </div>
    </form>
  );
}
