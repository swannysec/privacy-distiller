import { useMemo } from 'react';

/**
 * KeyTermsGlossary - Component for displaying key terms in a grid
 * Matches mockup design with simple card layout
 * @param {Object} props
 * @param {import('../../types').KeyTerm[]} props.keyTerms - Array of key terms
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function KeyTermsGlossary({ keyTerms = [], className = '' }) {
  // Ensure keyTerms is always an array
  const safeKeyTerms = Array.isArray(keyTerms) ? keyTerms : [];

  /**
   * Sort terms alphabetically
   */
  const sortedTerms = useMemo(() => {
    return [...safeKeyTerms].sort((a, b) =>
      (a.term || '').localeCompare(b.term || '')
    );
  }, [safeKeyTerms]);

  if (safeKeyTerms.length === 0) {
    return (
      <div className={`card key-terms ${className}`}>
        <div className="card__header">
          <h2 className="card__title">
            <span aria-hidden="true">📚</span> Key Terms Explained
          </h2>
        </div>
        <div className="key-terms__empty">
          <span className="key-terms__empty-icon" aria-hidden="true">📖</span>
          <p className="key-terms__empty-text">
            No key terms were extracted from this policy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card key-terms ${className}`}>
      <div className="card__header">
        <h2 className="card__title">
          <span aria-hidden="true">📚</span> Key Terms Explained
        </h2>
        <p className="card__subtitle">Important terms from the policy in plain language</p>
      </div>

      <div className="terms-grid">
        {sortedTerms.map((term, index) => (
          <div key={index} className="term-item">
            <h3 className="term-item__word">{term.term}</h3>
            <p className="term-item__definition">{term.definition}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
