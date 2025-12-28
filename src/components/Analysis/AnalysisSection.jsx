import { useAnalysis } from '../../contexts';
import { ProgressIndicator } from './ProgressIndicator';
import { ResultsDisplay } from '../Results';
import { Card, Button } from '../Common';
import { ANALYSIS_STATUS } from '../../utils/constants';

/**
 * AnalysisSection - Main section component for analysis workflow
 * @param {Object} props
 * @param {Function} props.onNewAnalysis - Callback to start new analysis
 * @param {Function} props.onExportResults - Optional callback to export results
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function AnalysisSection({ onNewAnalysis, onExportResults, className = '' }) {
  const { status, result, error, progress, currentStep, resetAnalysis } = useAnalysis();

  /**
   * Handle retry
   */
  const handleRetry = () => {
    resetAnalysis();
    if (onNewAnalysis) {
      onNewAnalysis();
    }
  };

  // Show results if analysis completed successfully
  if (status === ANALYSIS_STATUS.COMPLETED && result) {
    return (
      <div className={`analysis-section ${className}`}>
        <ResultsDisplay
          result={result}
          onNewAnalysis={handleRetry}
          onExport={onExportResults}
        />
      </div>
    );
  }

  // Show progress indicator for active analysis
  if (status === ANALYSIS_STATUS.EXTRACTING || status === ANALYSIS_STATUS.ANALYZING) {
    return (
      <div className={`analysis-section ${className}`}>
        <Card className="analysis-section__progress-card">
          <ProgressIndicator
            status={status}
            progress={progress}
            currentStep={currentStep}
          />

          <div className="analysis-section__info">
            <h3 className="analysis-section__info-title">What's happening?</h3>
            <div className="analysis-section__info-content">
              {status === ANALYSIS_STATUS.EXTRACTING && (
                <>
                  <p>
                    Extracting text content from your document. This may take a moment
                    for large files or complex web pages.
                  </p>
                  <ul className="analysis-section__info-list">
                    <li>For PDFs: Reading each page and extracting text</li>
                    <li>For URLs: Fetching the page and parsing content</li>
                  </ul>
                </>
              )}

              {status === ANALYSIS_STATUS.ANALYZING && (
                <>
                  <p>
                    Analyzing the privacy policy with AI. This involves multiple steps
                    to ensure comprehensive coverage:
                  </p>
                  <ul className="analysis-section__info-list">
                    <li>Generating layered summaries (brief, detailed, full)</li>
                    <li>Identifying privacy risks and concerns</li>
                    <li>Extracting and explaining key terms</li>
                    <li>Assessing overall privacy impact</li>
                  </ul>
                </>
              )}
            </div>

            <p className="analysis-section__info-note">
              <strong>Please wait:</strong> Analysis typically takes 30-60 seconds
              depending on document length and LLM provider response time.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Show error state
  if (status === ANALYSIS_STATUS.FAILED) {
    return (
      <div className={`analysis-section ${className}`}>
        <Card className="analysis-section__error-card">
          <div className="analysis-section__error">
            <span className="analysis-section__error-icon" aria-hidden="true">
              ⚠️
            </span>

            <h3 className="analysis-section__error-title">
              Analysis Failed
            </h3>

            <p className="analysis-section__error-message">
              {error || 'An unexpected error occurred during analysis.'}
            </p>

            {/* Common error scenarios */}
            <div className="analysis-section__error-help">
              <h4 className="analysis-section__error-help-title">
                Common issues:
              </h4>
              <ul className="analysis-section__error-help-list">
                <li>
                  <strong>API Key:</strong> Check that your API key is correct and has
                  sufficient credits (for OpenRouter)
                </li>
                <li>
                  <strong>Local LLM:</strong> Ensure Ollama or LM Studio is running and
                  the model is loaded
                </li>
                <li>
                  <strong>Network:</strong> Verify your internet connection for URL
                  fetching or API calls
                </li>
                <li>
                  <strong>Document:</strong> Make sure the PDF is text-based (not scanned)
                  and the URL is accessible
                </li>
              </ul>
            </div>

            <div className="analysis-section__error-actions">
              <Button
                variant="primary"
                onClick={handleRetry}
                ariaLabel="Retry analysis"
              >
                Try Again
              </Button>

              <Button
                variant="secondary"
                onClick={resetAnalysis}
                ariaLabel="Start over"
              >
                Start Over
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Idle state - nothing to show
  return null;
}
