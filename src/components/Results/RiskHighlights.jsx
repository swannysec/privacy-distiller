import { useState, useMemo } from 'react';
import { Card } from '../Common';
import { sanitizeHtml } from '../../utils/sanitization';

/**
 * Severity levels with colors and icons
 */
const SEVERITY_CONFIG = {
  critical: {
    color: '#dc2626',
    bgColor: '#fee2e2',
    icon: '🚨',
    label: 'Critical'
  },
  high: {
    color: '#ea580c',
    bgColor: '#ffedd5',
    icon: '⚠️',
    label: 'High'
  },
  medium: {
    color: '#d97706',
    bgColor: '#fef3c7',
    icon: '⚡',
    label: 'Medium'
  },
  low: {
    color: '#65a30d',
    bgColor: '#ecfccb',
    icon: 'ℹ️',
    label: 'Low'
  }
};

/**
 * RiskHighlights - Component for displaying privacy risks with severity levels
 * @param {Object} props
 * @param {import('../../types').PrivacyRisk[]} props.risks - Array of identified risks
 * @param {Object} props.documentMetadata - Document metadata
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function RiskHighlights({ risks, documentMetadata, className = '' }) {
  const [filterSeverity, setFilterSeverity] = useState(/** @type {string | null} */ (null));
  const [expandedRisks, setExpandedRisks] = useState(/** @type {Set<number>} */ (new Set()));

  /**
   * Filter and sort risks
   */
  const filteredRisks = useMemo(() => {
    let filtered = risks;

    if (filterSeverity) {
      filtered = risks.filter(risk => risk.severity === filterSeverity);
    }

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return filtered.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }, [risks, filterSeverity]);

  /**
   * Count risks by severity
   */
  const severityCounts = useMemo(() => {
    return risks.reduce((acc, risk) => {
      acc[risk.severity] = (acc[risk.severity] || 0) + 1;
      return acc;
    }, {});
  }, [risks]);

  /**
   * Toggle risk expansion
   * @param {number} index
   */
  const toggleRisk = (index) => {
    setExpandedRisks(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  if (risks.length === 0) {
    return (
      <Card className={`risk-highlights ${className}`} title="Privacy Risks">
        <div className="risk-highlights__empty">
          <span className="risk-highlights__empty-icon" aria-hidden="true">✅</span>
          <p className="risk-highlights__empty-text">
            No significant privacy risks were identified in this policy.
          </p>
          <p className="risk-highlights__empty-subtext">
            This doesn't guarantee the policy is perfect, but no major concerns were detected.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`risk-highlights ${className}`}
      title="Privacy Risks"
      subtitle={`${risks.length} potential ${risks.length === 1 ? 'concern' : 'concerns'} identified`}
    >
      {/* Severity filter */}
      <div className="risk-highlights__filters">
        <span className="risk-highlights__filter-label">Filter by severity:</span>

        <div className="risk-highlights__filter-buttons" role="group" aria-label="Risk severity filter">
          <button
            type="button"
            className={`risk-highlights__filter-button ${!filterSeverity ? 'risk-highlights__filter-button--active' : ''}`}
            onClick={() => setFilterSeverity(null)}
          >
            All ({risks.length})
          </button>

          {Object.entries(SEVERITY_CONFIG).map(([severity, config]) => {
            const count = severityCounts[severity] || 0;
            if (count === 0) return null;

            return (
              <button
                key={severity}
                type="button"
                className={`risk-highlights__filter-button ${filterSeverity === severity ? 'risk-highlights__filter-button--active' : ''}`}
                style={{
                  borderColor: filterSeverity === severity ? config.color : undefined
                }}
                onClick={() => setFilterSeverity(severity)}
              >
                <span aria-hidden="true">{config.icon}</span>
                {config.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Risk list */}
      <div className="risk-highlights__list">
        {filteredRisks.map((risk, index) => {
          const config = SEVERITY_CONFIG[risk.severity];
          const isExpanded = expandedRisks.has(index);
          const sanitizedDescription = sanitizeHtml(risk.description);
          const sanitizedExplanation = sanitizeHtml(risk.explanation);

          return (
            <div
              key={index}
              className="risk-highlights__item"
              style={{ borderLeftColor: config.color }}
            >
              {/* Risk header */}
              <button
                type="button"
                className="risk-highlights__item-header"
                onClick={() => toggleRisk(index)}
                aria-expanded={isExpanded}
              >
                <div className="risk-highlights__item-header-content">
                  <span
                    className="risk-highlights__severity-badge"
                    style={{
                      backgroundColor: config.bgColor,
                      color: config.color
                    }}
                  >
                    <span aria-hidden="true">{config.icon}</span>
                    {config.label}
                  </span>

                  <h3 className="risk-highlights__item-title">
                    {risk.title}
                  </h3>
                </div>

                <span
                  className={`risk-highlights__expand-icon ${isExpanded ? 'risk-highlights__expand-icon--expanded' : ''}`}
                  aria-hidden="true"
                >
                  ▼
                </span>
              </button>

              {/* Risk details */}
              {isExpanded && (
                <div className="risk-highlights__item-details">
                  <div
                    className="risk-highlights__description"
                    dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                  />

                  {risk.explanation && (
                    <div className="risk-highlights__explanation">
                      <h4 className="risk-highlights__explanation-title">
                        Why this matters:
                      </h4>
                      <div
                        className="risk-highlights__explanation-text"
                        dangerouslySetInnerHTML={{ __html: sanitizedExplanation }}
                      />
                    </div>
                  )}

                  {risk.affectedSections && risk.affectedSections.length > 0 && (
                    <div className="risk-highlights__sections">
                      <h4 className="risk-highlights__sections-title">
                        Related sections:
                      </h4>
                      <ul className="risk-highlights__sections-list">
                        {risk.affectedSections.map((section, idx) => (
                          <li key={idx}>{section}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
