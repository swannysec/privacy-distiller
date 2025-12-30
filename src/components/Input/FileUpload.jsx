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

  const uploadZoneClasses = [
    'upload-zone',
    isDragging && 'upload-zone--dragging',
    selectedFile && 'upload-zone--has-file',
    disabled && 'upload-zone--disabled',
    error && 'upload-zone--error'
  ].filter(Boolean).join(' ');

  return (
    <div className={`file-upload ${className}`}>
      <div
        className={uploadZoneClasses}
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
          className="upload-zone__input"
          aria-label="Choose PDF file"
        />

        {!selectedFile ? (
          <>
            <div className="upload-zone__icon" aria-hidden="true">
              📄
            </div>
            <div className="upload-zone__text">
              Drop a PDF here, or{' '}
              <button
                type="button"
                className="upload-zone__link"
                onClick={handleBrowseClick}
                disabled={disabled}
              >
                browse files
              </button>
            </div>
            <p className="upload-zone__hint" id="file-upload-description">
              Maximum file size: {formatFileSize(FILE_CONSTRAINTS.MAX_SIZE_BYTES)}
            </p>
          </>
        ) : (
          <div className="upload-zone__selected">
            <div className="upload-zone__file-icon" aria-hidden="true">
              📄
            </div>
            <div className="upload-zone__file-info">
              <p className="upload-zone__file-name">{selectedFile.name}</p>
              <p className="upload-zone__file-size">
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
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="error-message" role="alert" aria-live="polite">
          <span aria-hidden="true">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Requirements hint */}
      <p className="input-hint" style={{ marginTop: 'var(--space-3)' }}>
        PDF format only • Text-based PDF (scanned images not supported)
      </p>
    </div>
  );
}
