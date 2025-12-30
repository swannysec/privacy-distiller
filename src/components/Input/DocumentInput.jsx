import { useState, useCallback } from "react";
import { URLInput } from "./URLInput";
import { FileUpload } from "./FileUpload";
import { Card } from "../Common";
import { validateUrl, validateFile } from "../../utils/validation";

/**
 * @typedef {'url' | 'file'} InputMode
 */

/**
 * DocumentInput - Main input component for selecting and providing document source
 * @param {Object} props
 * @param {Function} props.onDocumentSelected - Callback when document is selected (url or file)
 * @param {boolean} props.disabled - Whether input is disabled
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.analysisError - Analysis error message to display
 * @param {Function} props.onClearAnalysisError - Callback to clear analysis error
 * @param {Function} props.onTipsOpen - Callback to open Tips modal
 * @returns {JSX.Element}
 */
export function DocumentInput({
  onDocumentSelected,
  disabled = false,
  className = "",
  analysisError = null,
  onClearAnalysisError = null,
  onTipsOpen = null,
}) {
  const [inputMode, setInputMode] = useState(/** @type {InputMode} */ ("url"));
  const [error, setError] = useState(null);

  /**
   * Handle URL submission
   * @param {string} url
   */
  const handleUrlSubmit = useCallback(
    (url) => {
      setError(null);
      const validation = validateUrl(url);

      if (!validation.valid) {
        setError(validation.errors.map((e) => e.message).join(", "));
        return;
      }

      onDocumentSelected({
        type: "url",
        source: url,
        metadata: {
          inputMode: "url",
          timestamp: new Date().toISOString(),
        },
      });
    },
    [onDocumentSelected],
  );

  /**
   * Handle file selection
   * @param {File} file
   */
  const handleFileSelect = useCallback(
    (file) => {
      setError(null);
      const validation = validateFile(file);

      if (!validation.valid) {
        setError(validation.errors.map((e) => e.message).join(", "));
        return;
      }

      onDocumentSelected({
        type: "file",
        source: file,
        metadata: {
          inputMode: "file",
          fileName: file.name,
          fileSize: file.size,
          timestamp: new Date().toISOString(),
        },
      });
    },
    [onDocumentSelected],
  );

  /**
   * Handle mode toggle
   * @param {InputMode} mode
   */
  const handleModeChange = useCallback((mode) => {
    setInputMode(mode);
    setError(null);
  }, []);

  return (
    <Card className={`document-input ${className}`}>
      <div className="card__header">
        <h2 className="card__title">Analyze a Privacy Policy</h2>
        <p className="card__subtitle">Paste a URL or upload a PDF document to get started</p>
      </div>

      <div className="document-input__container">
        {/* Tab toggle */}
        <div
          className="tabs"
          role="tablist"
          aria-label="Document input method"
        >
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === "url"}
            aria-controls="tab-url"
            className={`tab ${inputMode === "url" ? "tab--active" : ""}`}
            onClick={() => handleModeChange("url")}
            disabled={disabled}
          >
            <span className="icon" aria-hidden="true">🔗</span>
            URL
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={inputMode === "file"}
            aria-controls="tab-pdf"
            className={`tab ${inputMode === "file" ? "tab--active" : ""}`}
            onClick={() => handleModeChange("file")}
            disabled={disabled}
          >
            <span className="icon" aria-hidden="true">📄</span>
            PDF Upload
          </button>
        </div>

        {/* Input panels */}
        {inputMode === "url" && (
          <div
            id="tab-url"
            role="tabpanel"
            aria-labelledby="url-tab"
          >
            <URLInput
              onSubmit={handleUrlSubmit}
              disabled={disabled}
              error={error}
              onClearError={() => setError(null)}
              analysisError={analysisError}
              onClearAnalysisError={onClearAnalysisError}
            />
          </div>
        )}

        {inputMode === "file" && (
          <div
            id="tab-pdf"
            role="tabpanel"
            aria-labelledby="file-tab"
          >
            <FileUpload
              onFileSelect={handleFileSelect}
              disabled={disabled}
              error={error}
            />
          </div>
        )}

        {/* Tips hint */}
        {onTipsOpen && (
          <div className="document-input__tip-hint">
            <span className="tip-hint__icon" aria-hidden="true">💡</span>
            <span className="tip-hint__text">
              <button
                type="button"
                className="tip-hint__link"
                onClick={onTipsOpen}
                disabled={disabled}
              >
                Check out our Tips
              </button>
              {" "}for best results.
            </span>
          </div>
        )}

      </div>
    </Card>
  );
}
