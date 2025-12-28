import { useState, useMemo } from 'react';
import { SummaryView } from './SummaryView';
import { RiskHighlights } from './RiskHighlights';
import { KeyTermsGlossary } from './KeyTermsGlossary';
import { Card, Button } from '../Common';
import { formatDate } from '../../utils/formatting';

/**
 * @typedef {'summary' | 'risks' | 'terms' | 'all'} ViewMode
 */

/**
 * ResultsDisplay - Main component for displaying analysis results
 * @param {Object} props
 * @param {import('../../types').AnalysisResult} props.result - Analysis result data
 * @param {Function} props.onNewAnalysis - Callback to start new analysis
 * @param {Function} props.onExport - Optional callback to export results
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function ResultsDisplay({ result, onNewAnalysis, onExport, className = '' }) {
  const [viewMode, setViewMode] = useState(/** @type {ViewMode} */ ('summary'));

  /**
   * Calculate overall risk score
   */
  const overallRiskScore = useMemo(() => {
    if (!result.risks || result.risks.length === 0) {
      return 'low';
    }

    const severityCounts = result.risks.reduce((acc, risk) => {
      acc[risk.severity] = (acc[risk.severity] || 0) + 1;
      return acc;
    }, {});

    if (severityCounts.critical > 0 || severityCounts.high >= 3) {
      return 'high';
    } else if (severityCounts.high > 0 || severityCounts.medium >= 3) {
      return 'medium';
    }
    return 'low';
  }, [result.risks]);

  /**
   * Get risk score color
   */
  const getRiskScoreColor = (score) => {
    const colors = {
      low: '#10b981',    // green
      medium: '#f59e0b', // amber
      high: '#ef4444'    // red
    };
    return colors[score] || colors.medium;
  };

  return (
    <div className={`results-display ${className}`}>
      {/* Header with metadata */}
      <Card className="results-display__header">
        <div className="results-display__metadata">
          <div className="results-display__metadata-item">
            <span className="results-display__metadata-label">Document:</span>
            <span className="results-display__metadata-value">
              {result.documentMetadata.source}
            </span>
          </div>

          <div className="results-display__metadata-item">
            <span className="results-display__metadata-label">Analyzed:</span>
            <span className="results-display__metadata-value">
              {formatDate(result.timestamp)}
            </span>
          </div>

          <div className="results-display__metadata-item">
            <span className="results-display__metadata-label">Overall Risk:</span>
            <span
              className="results-display__risk-badge"
              style={{
                backgroundColor: getRiskScoreColor(overallRiskScore),
                color: 'white'
              }}
            >
              {overallRiskScore.toUpperCase()}
            </span>
          </div>
        </div>

        {/* View mode tabs */}
        <div className="results-display__tabs" role="tablist" aria-label="Results view mode">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'summary'}
            aria-controls="summary-panel"
            className={`results-display__tab ${viewMode === 'summary' ? 'results-display__tab--active' : ''}`}
            onClick={() => setViewMode('summary')}
          >
            Summary
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'risks'}
            aria-controls="risks-panel"
            className={`results-display__tab ${viewMode === 'risks' ? 'results-display__tab--active' : ''}`}
            onClick={() => setViewMode('risks')}
          >
            Privacy Risks
            {result.risks.length > 0 && (
              <span className="results-display__tab-badge">{result.risks.length}</span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'terms'}
            aria-controls="terms-panel"
            className={`results-display__tab ${viewMode === 'terms' ? 'results-display__tab--active' : ''}`}
            onClick={() => setViewMode('terms')}
          >
            Key Terms
            {result.keyTerms.length > 0 && (
              <span className="results-display__tab-badge">{result.keyTerms.length}</span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'all'}
            aria-controls="all-panel"
            className={`results-display__tab ${viewMode === 'all' ? 'results-display__tab--active' : ''}`}
            onClick={() => setViewMode('all')}
          >
            Full Report
          </button>
        </div>
      </Card>

      {/* Content panels */}
      <div className="results-display__content">
        {(viewMode === 'summary' || viewMode === 'all') && (
          <div
            id="summary-panel"
            role="tabpanel"
            aria-labelledby="summary-tab"
            className="results-display__panel"
          >
            <SummaryView summary={result.summary} />
          </div>
        )}

        {(viewMode === 'risks' || viewMode === 'all') && (
          <div
            id="risks-panel"
            role="tabpanel"
            aria-labelledby="risks-tab"
            className="results-display__panel"
          >
            <RiskHighlights
              risks={result.risks}
              documentMetadata={result.documentMetadata}
            />
          </div>
        )}

        {(viewMode === 'terms' || viewMode === 'all') && (
          <div
            id="terms-panel"
            role="tabpanel"
            aria-labelledby="terms-tab"
            className="results-display__panel"
          >
            <KeyTermsGlossary keyTerms={result.keyTerms} />
          </div>
        )}
      </div>

      {/* Actions */}
      <Card className="results-display__actions">
        <div className="results-display__actions-group">
          <Button
            variant="secondary"
            onClick={onNewAnalysis}
            ariaLabel="Analyze another document"
          >
            Analyze Another Document
          </Button>

          {onExport && (
            <Button
              variant="primary"
              onClick={() => onExport(result)}
              ariaLabel="Export results"
            >
              Export Results
            </Button>
          )}
        </div>

        <p className="results-display__disclaimer">
          <strong>Disclaimer:</strong> This analysis is provided by an AI language model
          and should not be considered legal advice. Always consult with a qualified
          attorney for legal concerns about privacy policies.
        </p>
      </Card>
    </div>
  );
}
