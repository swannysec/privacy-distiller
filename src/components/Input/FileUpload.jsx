import { useState, useCallback, useRef } from 'react';
import { Button } from '../Common';
import { formatFileSize } from '../../utils/formatting';
import { FILE_CONSTRAINTS } from '../../utils/constants';

/**
 * FileUpload - Component for uploading PDF privacy policy documents
 * @param {Object} props
 * @param {Function} props.onFileSelect - Callback when file is selected
 * @param {boolean} props.disabled - Whether upload is disabled
 * @param {string} props.error - Error message to display
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function FileUpload({
  onFileSelect,
  disabled = false,
  error = null,
  className = ''
}) {
  const [selectedFile, setSelectedFile] = useState(/** @type {File | null} */ (null));
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  /**
   * Handle file selection from input
   * @param {React.ChangeEvent<HTMLInputElement>} e
   */
  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  /**
   * Handle drag over
   * @param {React.DragEvent} e
   */
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  /**
   * Handle drag leave
   * @param {React.DragEvent} e
   */
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  /**
   * Handle file drop
   * @param {React.DragEvent} e
   */
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) {
      return;
    }

    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [disabled, onFileSelect]);

  /**
   * Handle browse button click
   */
  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Handle clear selection
   */
  const handleClear = useCallback(() => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const dropzoneClasses = [
    'file-upload__dropzone',
    isDragging && 'file-upload__dropzone--dragging',
    selectedFile && 'file-upload__dropzone--has-file',
    disabled && 'file-upload__dropzone--disabled',
    error && 'file-upload__dropzone--error'
  ].filter(Boolean).join(' ');

  return (
    <div className={`file-upload ${className}`}>
      <div
        className={dropzoneClasses}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="File upload dropzone"
        aria-describedby="file-upload-description"
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          disabled={disabled}
          className="file-upload__input"
          aria-label="Choose PDF file"
        />

        {!selectedFile ? (
          <div className="file-upload__prompt">
            <div className="file-upload__icon" aria-hidden="true">
              📄
            </div>
            <div className="file-upload__text">
              <p className="file-upload__primary-text">
                Drop a PDF here, or{' '}
                <button
                  type="button"
                  className="file-upload__browse-button"
                  onClick={handleBrowseClick}
                  disabled={disabled}
                >
                  browse files
                </button>
              </p>
              <p className="file-upload__secondary-text" id="file-upload-description">
                Maximum file size: {formatFileSize(FILE_CONSTRAINTS.MAX_SIZE)}
              </p>
            </div>
          </div>
        ) : (
          <div className="file-upload__selected">
            <div className="file-upload__file-icon" aria-hidden="true">
              📄
            </div>
            <div className="file-upload__file-info">
              <p className="file-upload__file-name">{selectedFile.name}</p>
              <p className="file-upload__file-size">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={handleClear}
              disabled={disabled}
              ariaLabel="Clear selected file"
              className="file-upload__clear-button"
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="file-upload__error" role="alert" aria-live="polite">
          <span className="file-upload__error-icon" aria-hidden="true">⚠️</span>
          <span className="file-upload__error-text">{error}</span>
        </div>
      )}

      {/* Requirements */}
      <div className="file-upload__requirements">
        <p className="file-upload__requirements-title">Requirements:</p>
        <ul className="file-upload__requirements-list">
          <li>PDF format only (.pdf)</li>
          <li>Maximum {formatFileSize(FILE_CONSTRAINTS.MAX_SIZE)}</li>
          <li>Text-based PDF (scanned images not supported)</li>
        </ul>
      </div>
    </div>
  );
}
