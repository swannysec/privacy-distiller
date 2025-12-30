import PropTypes from 'prop-types';
import { Button } from './Button';

/**
 * TipsModal - Modal displaying usage tips for optimal privacy policy analysis
 * @param {Object} props
 * @param {Function} props.onClose - Callback to close the modal
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function TipsModal({ onClose, className = '' }) {
  return (
    <div className={`modal ${className}`} onClick={(e) => e.stopPropagation()}>
      <div className="modal__header">
        <h2 className="modal__title">💡 Tips for Best Results</h2>
        <button
          type="button"
          className="modal__close"
          onClick={onClose}
          aria-label="Close tips"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>

      <div className="modal__body">
        <div className="tips-content">
          <p className="tips-intro">
            Get the most out of your privacy policy analysis with these expert tips:
          </p>

          <div className="tips-list">
            <div className="tip-item">
              <h3 className="tip-item__title">🔄 Comparing Documents</h3>
              <p className="tip-item__text">
                If comparing documents, use the same model for consistency. Different models may have varying interpretations and risk scoring methods.
              </p>
            </div>

            <div className="tip-item">
              <h3 className="tip-item__title">🎯 Find Your Model</h3>
              <p className="tip-item__text">
                Experiment with models to identify the style and risk posture that best suits you, then stick with it. Each model has a unique approach to privacy analysis.
              </p>
            </div>

            <div className="tip-item">
              <h3 className="tip-item__title">⭐ Gemini 3 Flash</h3>
              <p className="tip-item__text">
                Gemini 3 Flash is very consistent and produces balanced results. It's an excellent starting point for most users.
              </p>
            </div>

            <div className="tip-item">
              <h3 className="tip-item__title">🔍 Stringent Analysis</h3>
              <p className="tip-item__text">
                gpt-oss:120b and Nemotron 3 are more variable between runs and generally more stringent, returning lower scores on average. Consider these if you want a more critical assessment.
              </p>
            </div>

            <div className="tip-item">
              <h3 className="tip-item__title">📊 ChatGPT Models</h3>
              <p className="tip-item__text">
                ChatGPT models appear to vary quite a bit from run to run. They may provide different perspectives on the same policy with each analysis.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="modal__footer">
        <Button variant="primary" onClick={onClose}>
          Got It
        </Button>
      </div>
    </div>
  );
}

TipsModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  className: PropTypes.string,
};
