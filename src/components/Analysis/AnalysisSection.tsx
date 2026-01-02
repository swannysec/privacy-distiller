import { useAnalysis } from '../../contexts';
import { ProgressIndicator } from './ProgressIndicator';
import { ResultsDisplay } from '../Results';
import { Card } from '../Common';
import { ANALYSIS_STATUS } from '../../utils/constants';

/**
 * Props for AnalysisSection component
 */
interface AnalysisSectionProps {
  /** Callback to start new analysis */
  onNewAnalysis?: () => void;
  /** Optional callback to export results */
  onExportResults?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * AnalysisSection - Main section component for analysis workflow
 */
export function AnalysisSection({
  onNewAnalysis,
  onExportResults,
  className = ''
}: AnalysisSectionProps) {
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

  // Error state is now shown inline in App.jsx near the input for better visibility
  // Idle state - nothing to show
  return null;
}
