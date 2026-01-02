import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import type { PrivacyRisk } from '../../types';

/** Custom sanitization schema - blocks javascript: links */
const sanitizeSchema = {
  ...defaultSchema,
  protocols: {
    ...defaultSchema.protocols,
    href: ['http', 'https', 'mailto'],
  },
};

interface SeverityConfig {
  color: string;
  bgColor: string;
  label: string;
}

/**
 * Severity configuration with colors matching mockup
 */
const SEVERITY_CONFIG: Record<string, SeverityConfig> = {
  critical: {
    color: 'var(--risk-high)',
    bgColor: 'var(--risk-high-bg)',
    label: 'Critical'
  },
  high: {
    color: 'var(--risk-high)',
    bgColor: 'var(--risk-high-bg)',
    label: 'Higher Risk'
  },
  medium: {
    color: 'var(--risk-medium)',
    bgColor: 'var(--risk-medium-bg)',
    label: 'Medium Risk'
  },
  low: {
    color: 'var(--risk-low)',
    bgColor: 'var(--risk-low-bg)',
    label: 'Low Risk'
  }
};

interface RiskHighlightsProps {
  risks?: PrivacyRisk[];
  className?: string;
}

/**
 * RiskHighlights - Component for displaying privacy risks with severity levels
 * Matches mockup design with colored left borders and expandable details
 */
export function RiskHighlights({ risks = [], className = '' }: RiskHighlightsProps) {
  const [expandedRisks, setExpandedRisks] = useState<Set<number>>(new Set());

  // Ensure risks is always an array
  const safeRisks = Array.isArray(risks) ? risks : [];

  /**
   * Sort risks by severity
   */
  const sortedRisks = useMemo(() => {
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...safeRisks].sort((a, b) =>
      (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3)
    );
  }, [safeRisks]);

  /**
   * Toggle risk expansion
   */
  const toggleRisk = (index: number) => {
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

  if (safeRisks.length === 0) {
    return (
      <div className={`card risk-highlights ${className}`}>
        <div className="card__header">
          <h2 className="card__title">
            <span aria-hidden="true">🚨</span> Privacy Risks Identified
          </h2>
        </div>
        <div className="risk-highlights__empty">
          <span className="risk-highlights__empty-icon" aria-hidden="true">✅</span>
          <p className="risk-highlights__empty-text">
            No significant privacy risks were identified in this policy.
          </p>
          <p className="risk-highlights__empty-subtext">
            This doesn't guarantee the policy is perfect, but no major concerns were detected.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card risk-highlights ${className}`}>
      <div className="card__header">
        <h2 className="card__title">
          <span aria-hidden="true">🚨</span> Privacy Risks Identified
        </h2>
        <p className="card__subtitle">Potential concerns ranked by severity</p>
      </div>

      <div className="risk-list">
        {sortedRisks.map((risk, index) => {
          const config = SEVERITY_CONFIG[risk.severity] || SEVERITY_CONFIG.medium;
          const isExpanded = expandedRisks.has(index);

          return (
            <div
              key={index}
              className={`risk-item risk-item--${risk.severity}`}
              style={{ '--risk-color': config.color } as React.CSSProperties}
            >
              <div className="risk-item__header">
                <h3 className="risk-item__title">{risk.title}</h3>
                <span
                  className={`risk-item__severity risk-item__severity--${risk.severity}`}
                  style={{
                    backgroundColor: config.bgColor,
                    color: config.color
                  }}
                >
                  {config.label}
                </span>
              </div>

              <p className="risk-item__description">
                {risk.description}
              </p>

              {risk.recommendation && (
                <button
                  type="button"
                  className="risk-item__expand"
                  onClick={() => toggleRisk(index)}
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? 'Show less' : 'Learn more'} →
                </button>
              )}

              {isExpanded && risk.recommendation && (
                <div className="risk-item__details">
                  <h4 className="risk-item__details-title">Why this matters:</h4>
                  <div className="risk-item__details-content">
                    <ReactMarkdown rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}>{risk.recommendation}</ReactMarkdown>
                  </div>

                  {risk.location && (
                    <div className="risk-item__sections">
                      <h4 className="risk-item__sections-title">Related sections:</h4>
                      <ul className="risk-item__sections-list">
                        <li>{risk.location}</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
