import { useState, useMemo } from 'react';
import { Card } from '../Common';
import { sanitizeHTML } from '../../utils/sanitization';

/**
 * KeyTermsGlossary - Component for displaying and searching key terms
 * @param {Object} props
 * @param {import('../../types').KeyTerm[]} props.keyTerms - Array of key terms
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function KeyTermsGlossary({ keyTerms, className = '' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTerms, setExpandedTerms] = useState(/** @type {Set<number>} */ (new Set()));

  /**
   * Filter and sort terms
   */
  const filteredTerms = useMemo(() => {
    let filtered = keyTerms;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = keyTerms.filter(term =>
        term.term.toLowerCase().includes(query) ||
        term.definition.toLowerCase().includes(query)
      );
    }

    // Sort alphabetically by term
    return filtered.sort((a, b) => a.term.localeCompare(b.term));
  }, [keyTerms, searchQuery]);

  /**
   * Group terms by first letter
   */
  const groupedTerms = useMemo(() => {
    return filteredTerms.reduce((acc, term, index) => {
      const firstLetter = term.term[0].toUpperCase();
      if (!acc[firstLetter]) {
        acc[firstLetter] = [];
      }
      acc[firstLetter].push({ ...term, originalIndex: index });
      return acc;
    }, {});
  }, [filteredTerms]);

  /**
   * Toggle term expansion
   * @param {number} index
   */
  const toggleTerm = (index) => {
    setExpandedTerms(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  /**
   * Expand all terms
   */
  const expandAll = () => {
    setExpandedTerms(new Set(filteredTerms.map((_, idx) => idx)));
  };

  /**
   * Collapse all terms
   */
  const collapseAll = () => {
    setExpandedTerms(new Set());
  };

  if (keyTerms.length === 0) {
    return (
      <Card className={`key-terms-glossary ${className}`} title="Key Terms">
        <div className="key-terms-glossary__empty">
          <span className="key-terms-glossary__empty-icon" aria-hidden="true">📖</span>
          <p className="key-terms-glossary__empty-text">
            No key terms were extracted from this policy.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`key-terms-glossary ${className}`}
      title="Key Terms Glossary"
      subtitle={`${keyTerms.length} important ${keyTerms.length === 1 ? 'term' : 'terms'} explained`}
    >
      {/* Search and controls */}
      <div className="key-terms-glossary__controls">
        <div className="key-terms-glossary__search">
          <input
            type="search"
            placeholder="Search terms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="key-terms-glossary__search-input"
            aria-label="Search key terms"
          />
          <span className="key-terms-glossary__search-icon" aria-hidden="true">
            🔍
          </span>
        </div>

        <div className="key-terms-glossary__actions">
          <button
            type="button"
            className="key-terms-glossary__action-button"
            onClick={expandAll}
            disabled={expandedTerms.size === filteredTerms.length}
          >
            Expand All
          </button>
          <button
            type="button"
            className="key-terms-glossary__action-button"
            onClick={collapseAll}
            disabled={expandedTerms.size === 0}
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Results count */}
      {searchQuery && (
        <p className="key-terms-glossary__results-count">
          {filteredTerms.length === 0 ? (
            'No terms match your search'
          ) : (
            `Showing ${filteredTerms.length} of ${keyTerms.length} terms`
          )}
        </p>
      )}

      {/* Glossary */}
      {filteredTerms.length > 0 && (
        <div className="key-terms-glossary__content">
          {Object.entries(groupedTerms).sort().map(([letter, terms]) => (
            <div key={letter} className="key-terms-glossary__section">
              <h3 className="key-terms-glossary__section-letter" id={`letter-${letter}`}>
                {letter}
              </h3>

              <div className="key-terms-glossary__terms" role="list">
                {terms.map((term) => {
                  const isExpanded = expandedTerms.has(term.originalIndex);
                  const sanitizedDefinition = sanitizeHTML(term.definition);

                  return (
                    <div
                      key={term.originalIndex}
                      className="key-terms-glossary__term"
                      role="listitem"
                    >
                      <button
                        type="button"
                        className="key-terms-glossary__term-header"
                        onClick={() => toggleTerm(term.originalIndex)}
                        aria-expanded={isExpanded}
                      >
                        <span className="key-terms-glossary__term-name">
                          {term.term}
                        </span>

                        {term.category && (
                          <span className="key-terms-glossary__term-category">
                            {term.category}
                          </span>
                        )}

                        <span
                          className={`key-terms-glossary__expand-icon ${isExpanded ? 'key-terms-glossary__expand-icon--expanded' : ''}`}
                          aria-hidden="true"
                        >
                          ▼
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="key-terms-glossary__term-definition">
                          <div
                            dangerouslySetInnerHTML={{ __html: sanitizedDefinition }}
                          />

                          {term.examples && term.examples.length > 0 && (
                            <div className="key-terms-glossary__examples">
                              <h4 className="key-terms-glossary__examples-title">
                                Examples:
                              </h4>
                              <ul className="key-terms-glossary__examples-list">
                                {term.examples.map((example, idx) => (
                                  <li key={idx}>{example}</li>
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
            </div>
          ))}
        </div>
      )}

      {/* Alphabet navigation */}
      <div className="key-terms-glossary__alphabet-nav" role="navigation" aria-label="Jump to letter">
        {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map(letter => {
          const hasTerms = groupedTerms[letter];
          return (
            <a
              key={letter}
              href={`#letter-${letter}`}
              className={`key-terms-glossary__alphabet-link ${hasTerms ? '' : 'key-terms-glossary__alphabet-link--disabled'}`}
              aria-disabled={!hasTerms}
              onClick={(e) => {
                if (!hasTerms) {
                  e.preventDefault();
                }
              }}
            >
              {letter}
            </a>
          );
        })}
      </div>
    </Card>
  );
}
