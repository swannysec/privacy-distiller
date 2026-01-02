import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from './Button';

export interface LegalDocumentModalProps {
  documentPath: string;
  title: string;
  onClose: () => void;
}

/**
 * LegalDocumentModal - Displays legal documents (Privacy Policy, ToS) in a modal
 */
export function LegalDocumentModal({ documentPath, title, onClose }: LegalDocumentModalProps): JSX.Element {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocument = async (): Promise<void> => {
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
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentPath]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
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
