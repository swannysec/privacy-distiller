import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from './Button';

/**
 * LegalDocumentModal - Displays legal documents (Privacy Policy, ToS) in a modal
 * @param {Object} props
 * @param {string} props.documentPath - Path to the markdown file (relative to public/)
 * @param {string} props.title - Modal title
 * @param {Function} props.onClose - Callback to close modal
 * @returns {JSX.Element}
 */
export function LegalDocumentModal({ documentPath, title, onClose }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocument = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = `${import.meta.env.BASE_URL}${documentPath}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to load document: ${response.status}`);
        }

        const text = await response.text();
        setContent(text);
      } catch (err) {
        console.error('Error fetching legal document:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentPath]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal--legal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
      >
        <div className="modal__header">
          <h2 className="modal__title" id="legal-modal-title">{title}</h2>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label={`Close ${title}`}
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div className="modal__body modal__body--scrollable">
          {loading && (
            <div className="legal-document__loading">
              <p>Loading document...</p>
            </div>
          )}

          {error && (
            <div className="legal-document__error">
              <p>Failed to load document: {error}</p>
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          )}

          {!loading && !error && (
            <div className="legal-document__content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <div className="modal__footer">
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
