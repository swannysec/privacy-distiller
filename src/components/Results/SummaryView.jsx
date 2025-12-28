import { useState } from 'react';
import { Card } from '../Common';
import { sanitizeHTML } from '../../utils/sanitization';

/**
 * @typedef {'brief' | 'detailed' | 'full'} SummaryLevel
 */

/**
 * SummaryView - Component for displaying layered policy summaries
 * @param {Object} props
 * @param {import('../../types').PolicySummary} props.summary - Summary data
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function SummaryView({ summary, className = '' }) {
  const [level, setLevel] = useState(/** @type {SummaryLevel} */ ('brief'));

  /**
   * Get content for current level
   */
  const getCurrentContent = () => {
    switch (level) {
      case 'brief':
        return summary.brief;
      case 'detailed':
        return summary.detailed;
      case 'full':
        return summary.full;
      default:
        return summary.brief;
    }
  };

  const content = getCurrentContent();
  const sanitizedContent = sanitizeHTML(content);

  return (
    <Card
      className={`summary-view ${className}`}
      title="Policy Summary"
      subtitle="AI-generated summary in plain language"
    >
      {/* Level selector */}
      <div className="summary-view__level-selector" role="group" aria-label="Summary detail level">
        <button
          type="button"
          className={`summary-view__level-button ${level === 'brief' ? 'summary-view__level-button--active' : ''}`}
          onClick={() => setLevel('brief')}
          aria-pressed={level === 'brief'}
        >
          <span className="summary-view__level-icon" aria-hidden="true">📋</span>
          <span className="summary-view__level-label">Brief</span>
          <span className="summary-view__level-description">Quick overview</span>
        </button>

        <button
          type="button"
          className={`summary-view__level-button ${level === 'detailed' ? 'summary-view__level-button--active' : ''}`}
          onClick={() => setLevel('detailed')}
          aria-pressed={level === 'detailed'}
        >
          <span className="summary-view__level-icon" aria-hidden="true">📄</span>
          <span className="summary-view__level-label">Detailed</span>
          <span className="summary-view__level-description">Key points expanded</span>
        </button>

        <button
          type="button"
          className={`summary-view__level-button ${level === 'full' ? 'summary-view__level-button--active' : ''}`}
          onClick={() => setLevel('full')}
          aria-pressed={level === 'full'}
        >
          <span className="summary-view__level-icon" aria-hidden="true">📚</span>
          <span className="summary-view__level-label">Full</span>
          <span className="summary-view__level-description">Complete analysis</span>
        </button>
      </div>

      {/* Content */}
      <div className="summary-view__content">
        <div
          className="summary-view__text"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      </div>

      {/* Reading time estimate */}
      <div className="summary-view__meta">
        <span className="summary-view__meta-item">
          📖 {estimateReadingTime(content)} min read
        </span>
        <span className="summary-view__meta-item">
          {level === 'brief' ? '~200 words' : level === 'detailed' ? '~500 words' : '~1000+ words'}
        </span>
      </div>
    </Card>
  );
}

/**
 * Estimate reading time in minutes
 * @param {string} text
 * @returns {number}
 */
function estimateReadingTime(text) {
  const wordsPerMinute = 200;
  const words = text.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}
