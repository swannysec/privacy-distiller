import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

/** Average reading speed in words per minute */
const WORDS_PER_MINUTE = 200;

/** Custom sanitization schema - blocks javascript: links and other dangerous patterns */
const sanitizeSchema = {
  ...defaultSchema,
  protocols: {
    ...defaultSchema.protocols,
    href: ['http', 'https', 'mailto'], // Block javascript: protocol
  },
};

type SummaryLevel = 'brief' | 'detailed' | 'full';

interface PolicySummary {
  brief: string;
  detailed: string;
  full: string;
}

interface SummaryViewProps {
  summary?: PolicySummary;
  className?: string;
}

/**
 * SummaryView - Component for displaying layered policy summaries
 * Uses simple underlined tabs matching the mockup design
 */
export function SummaryView({ summary = { brief: '', detailed: '', full: '' }, className = '' }: SummaryViewProps) {
  const [level, setLevel] = useState<SummaryLevel>('brief');

  // Ensure summary has safe defaults
  const safeSummary = {
    brief: summary?.brief || 'No brief summary available.',
    detailed: summary?.detailed || 'No detailed summary available.',
    full: summary?.full || 'No full summary available.',
  };

  /**
   * Get content for current level
   */
  const getCurrentContent = (): string => {
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
  const readingTime = Math.max(1, Math.ceil(content.split(/\s+/).length / WORDS_PER_MINUTE));
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

      {/* Content - sanitized to prevent XSS from LLM output */}
      <div className="summary-content">
        <ReactMarkdown rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}>
          {content}
        </ReactMarkdown>
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
