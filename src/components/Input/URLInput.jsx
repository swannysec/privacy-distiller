import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "../Common";

/**
 * URLInput - Input component for privacy policy URLs
 * Updated: Error display positioned between Analyze button and examples
 * @param {Object} props
 * @param {Function} props.onSubmit - Callback when URL is submitted
 * @param {boolean} props.disabled - Whether input is disabled
 * @param {string} props.error - Error message to display
 * @param {string} props.analysisError - Analysis error message to display
 * @param {Function} props.onClearAnalysisError - Callback to clear analysis error
 * @param {string} props.placeholder - Input placeholder text
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function URLInput({
  onSubmit,
  disabled = false,
  error = null,
  onClearError = null,
  analysisError = null,
  onClearAnalysisError = null,
  placeholder = "https://example.com/privacy-policy",
  className = "",
}) {
  const [url, setUrl] = useState("");
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
    // Clear error when user starts typing
    if (error && onClearError) {
      onClearError();
    }
  }, [error, onClearError]);

  /**
   * Handle form submission
   * @param {React.FormEvent} e
   */
  const handleSubmit = useCallback(
    (e) => {
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
    },
    [url, disabled, isValidating, onSubmit],
  );

  /**
   * Handle Enter key
   * @param {React.KeyboardEvent} e
   */
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        handleSubmit(e);
      }
    },
    [handleSubmit],
  );

  /**
   * Handle example click
   * @param {string} exampleUrl
   */
  const handleExampleClick = useCallback((exampleUrl) => {
    setUrl(exampleUrl);
    if (onClearError) {
      onClearError();
    }
  }, [onClearError]);

  const isDisabled = disabled || isValidating;
  const hasValue = url.trim().length > 0;

  const examples = [
    { label: "Google", url: "https://policies.google.com/privacy" },
    { label: "Facebook", url: "https://www.facebook.com/privacy/policy/" },
    { label: "Amazon", url: "https://www.amazon.com/gp/help/customer/display.html?nodeId=468496" },
    { label: "Apple", url: "https://www.apple.com/legal/privacy/en-ww/" },
    { label: "Microsoft", url: "https://privacy.microsoft.com/en-us/privacystatement" },
  ];

  return (
    <form
      className={`url-input ${className}`}
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="input-group">
        <label htmlFor="policy-url-input" className="input-label">
          Privacy Policy URL
        </label>
        <input
          ref={inputRef}
          id="policy-url-input"
          type="url"
          name="policy-url"
          value={url}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isDisabled}
          required
          autoComplete="url"
          spellCheck={false}
          aria-describedby={error ? "url-input-error" : "url-input-hint"}
          aria-invalid={error ? "true" : undefined}
          className={`input-field ${error ? "input-field--error" : ""}`}
        />
        <p id="url-input-hint" className="input-hint">
          Enter the direct URL to a privacy policy page
        </p>
        {error && (
          <p id="url-input-error" className="input__error" role="alert">
            {error}
          </p>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        disabled={isDisabled || !hasValue}
        loading={isValidating}
        ariaLabel="Analyze privacy policy"
        style={{ width: "100%" }}
      >
        Analyze Policy
      </Button>

      {/* Analysis Error Display */}
      {analysisError && (
        <div className="analysis-error" role="alert">
          <div className="analysis-error__content">
            <span className="analysis-error__icon" aria-hidden="true">⚠️</span>
            <div className="analysis-error__text">
              <strong className="analysis-error__title">Analysis Failed</strong>
              <p className="analysis-error__message">{analysisError}</p>
            </div>
          </div>
          {onClearAnalysisError && (
            <div className="analysis-error__actions">
              <Button
                type="button"
                variant="primary"
                size="small"
                onClick={onClearAnalysisError}
                ariaLabel="Try again"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Example links */}
      <div className="examples">
        <p className="examples__label">Try an example:</p>
        <div className="examples__list">
          {examples.map((example) => (
            <button
              key={example.label}
              type="button"
              className="example-link"
              onClick={() => handleExampleClick(example.url)}
              disabled={isDisabled}
            >
              {example.label}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
