import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * @typedef {'brief' | 'detailed' | 'full'} SummaryLevel
 */

/**
 * SummaryView - Component for displaying layered policy summaries
 * Uses simple underlined tabs matching the mockup design
 * @param {Object} props
 * @param {import('../../types').PolicySummary} props.summary - Summary data
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function SummaryView({ summary = {}, className = '' }) {
  const [level, setLevel] = useState(/** @type {SummaryLevel} */ ('brief'));

  // Ensure summary has safe defaults
  const safeSummary = {
    brief: summary?.brief || 'No brief summary available.',
    detailed: summary?.detailed || 'No detailed summary available.',
    full: summary?.full || 'No full summary available.',
  };

  /**
   * Get content for current level
   */
  const getCurrentContent = () => {
    switch (level) {
      case 'brief':
        return safeSummary.brief;
      case 'detailed':
        return safeSummary.detailed;
      case 'full':
        return safeSummary.full;
      default:
        return safeSummary.brief;
    }
  };

  const content = getCurrentContent();

  /**
   * Estimate reading time in minutes
   */
  const readingTime = Math.max(1, Math.ceil(content.split(/\s+/).length / 200));
  const wordEstimate = level === 'brief' ? '~200 words' : level === 'detailed' ? '~500 words' : '~1000+ words';

  return (
    <div className={`card summary-view ${className}`}>
      <div className="card__header">
        <h2 className="card__title">Policy Summary</h2>
        <p className="card__subtitle">AI-generated summary in plain language</p>
      </div>

      {/* Summary level tabs - simple underlined style */}
      <div className="summary-tabs" role="tablist" aria-label="Summary detail level">
        <button
          type="button"
          role="tab"
          aria-selected={level === 'brief'}
          className={`summary-tab ${level === 'brief' ? 'summary-tab--active' : ''}`}
          onClick={() => setLevel('brief')}
        >
          Brief
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={level === 'detailed'}
          className={`summary-tab ${level === 'detailed' ? 'summary-tab--active' : ''}`}
          onClick={() => setLevel('detailed')}
        >
          Detailed
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={level === 'full'}
          className={`summary-tab ${level === 'full' ? 'summary-tab--active' : ''}`}
          onClick={() => setLevel('full')}
        >
          Full Analysis
        </button>
      </div>

      {/* Content */}
      <div className="summary-content">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>

      {/* Reading time estimate */}
      <div className="summary-meta">
        <span className="summary-meta__item">
          <span aria-hidden="true">📖</span> {readingTime} min read
        </span>
        <span className="summary-meta__item">{wordEstimate}</span>
      </div>
    </div>
  );
}
