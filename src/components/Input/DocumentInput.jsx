import { useState, useCallback } from 'react';
import { URLInput } from './URLInput';
import { FileUpload } from './FileUpload';
import { Card } from '../Common';
import { validateUrl, validateFile } from '../../utils/validation';

/**
 * @typedef {'url' | 'file'} InputMode
 */

/**
 * DocumentInput - Main input component for selecting and providing document source
 * @param {Object} props
 * @param {Function} props.onDocumentSelected - Callback when document is selected (url or file)
 * @param {boolean} props.disabled - Whether input is disabled
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function DocumentInput({ onDocumentSelected, disabled = false, className = '' }) {
  const [inputMode, setInputMode] = useState(/** @type {InputMode} */ ('url'));
  const [error, setError] = useState(null);

  /**
   * Handle URL submission
   * @param {string} url
   */
  const handleUrlSubmit = useCallback((url) => {
    setError(null);
    const validation = validateUrl(url);

    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    onDocumentSelected({
      type: 'url',
      source: url,
      metadata: {
        inputMode: 'url',
        timestamp: new Date().toISOString()
      }
    });
  }, [onDocumentSelected]);

  /**
   * Handle file selection
   * @param {File} file
   */
  const handleFileSelect = useCallback((file) => {
    setError(null);
    const validation = validateFile(file);

    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    onDocumentSelected({
      type: 'file',
      source: file,
      metadata: {
        inputMode: 'file',
        fileName: file.name,
        fileSize: file.size,
        timestamp: new Date().toISOString()
      }
    });
  }, [onDocumentSelected]);

  /**
   * Handle mode toggle
   * @param {InputMode} mode
   */
  const handleModeChange = useCallback((mode) => {
    setInputMode(mode);
    setError(null);
  }, []);

  return (
    <Card
      className={`document-input ${className}`}
      title="Select Document Source"
      subtitle="Provide a privacy policy URL or upload a PDF document"
    >
      <div className="document-input__container">
        {/* Mode toggle */}
        <div className="document-input__mode-toggle" role="tablist" aria-label="Document input method">
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === 'url'}
            aria-controls="url-input-panel"
            className={`mode-toggle__button ${inputMode === 'url' ? 'mode-toggle__button--active' : ''}`}
            onClick={() => handleModeChange('url')}
            disabled={disabled}
          >
            <span className="mode-toggle__icon" aria-hidden="true">🔗</span>
            <span className="mode-toggle__label">URL</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={inputMode === 'file'}
            aria-controls="file-input-panel"
            className={`mode-toggle__button ${inputMode === 'file' ? 'mode-toggle__button--active' : ''}`}
            onClick={() => handleModeChange('file')}
            disabled={disabled}
          >
            <span className="mode-toggle__icon" aria-hidden="true">📄</span>
            <span className="mode-toggle__label">PDF Upload</span>
          </button>
        </div>

        {/* Input panels */}
        <div className="document-input__panels">
          {inputMode === 'url' && (
            <div
              id="url-input-panel"
              role="tabpanel"
              aria-labelledby="url-tab"
              className="document-input__panel"
            >
              <URLInput
                onSubmit={handleUrlSubmit}
                disabled={disabled}
                error={error}
              />
            </div>
          )}

          {inputMode === 'file' && (
            <div
              id="file-input-panel"
              role="tabpanel"
              aria-labelledby="file-tab"
              className="document-input__panel"
            >
              <FileUpload
                onFileSelect={handleFileSelect}
                disabled={disabled}
                error={error}
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
