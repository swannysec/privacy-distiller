import { useState, useMemo } from "react";
import { SummaryView } from "./SummaryView";
import { RiskHighlights } from "./RiskHighlights";
import { KeyTermsGlossary } from "./KeyTermsGlossary";
import { PrivacyScorecard } from "./PrivacyScorecard";
import { Button } from "../Common";
import { formatDate } from "../../utils/formatting";

/**
 * Calculate overall risk level from risks array
 * @param {Array} risks - Array of risk objects with severity
 * @returns {{level: string, counts: Object}} Risk level and severity counts
 */
function calculateRiskLevel(risks) {
  if (!risks || risks.length === 0) {
    return {
      level: "none",
      counts: { critical: 0, high: 0, medium: 0, low: 0 },
    };
  }

  const counts = { critical: 0, high: 0, medium: 0, low: 0 };

  risks.forEach((risk) => {
    const severity = (risk.severity || "low").toLowerCase();
    if (severity === "critical" || severity === "high") {
      counts.high++;
    } else if (severity === "medium") {
      counts.medium++;
    } else {
      counts.low++;
    }
  });

  // Determine overall level based on highest severity present
  if (counts.high > 0) {
    return { level: "high", counts };
  } else if (counts.medium > 0) {
    return { level: "medium", counts };
  } else if (counts.low > 0) {
    return { level: "low", counts };
  }

  return { level: "none", counts };
}

/**
 * @typedef {'summary' | 'risks' | 'terms' | 'all'} ViewMode
 */

/**
 * ResultsDisplay - Main component for displaying analysis results
 * Matches the mockup design with proper header, metadata, and action buttons
 * @param {Object} props
 * @param {import('../../types').AnalysisResult} props.result - Analysis result data
 * @param {Function} props.onNewAnalysis - Callback to start new analysis
 * @param {Function} props.onExport - Optional callback to export results
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function ResultsDisplay({
  result,
  onNewAnalysis,
  onExport,
  className = "",
}) {
  const [viewMode, setViewMode] = useState(/** @type {ViewMode} */ ("summary"));

  // Guard against missing or incomplete result data
  if (!result || !result.documentMetadata) {
    return (
      <div className={`results-display ${className}`}>
        <div className="card">
          <p>No analysis results available. Please try analyzing a document.</p>
          <Button onClick={onNewAnalysis} variant="primary">
            Start New Analysis
          </Button>
        </div>
      </div>
    );
  }

  /**
   * Estimate word count from summary
   */
  const wordCount = useMemo(() => {
    const text =
      result.summary?.full ||
      result.summary?.detailed ||
      result.summary?.brief ||
      "";
    return `~${Math.round(text.split(/\s+/).length / 100) * 100 || 500} words`;
  }, [result.summary]);

  /**
   * Get document title from source
   */
  const documentTitle = useMemo(() => {
    const source = result.documentMetadata.source || "";
    // Extract domain or filename
    if (source.startsWith("http")) {
      try {
        const url = new URL(source);
        const host = url.hostname.replace("www.", "");
        const company = host.split(".")[0];
        return `${company.charAt(0).toUpperCase() + company.slice(1)} Privacy Policy Analysis`;
      } catch {
        return "Privacy Policy Analysis";
      }
    }
    return source.replace(".pdf", "") + " Analysis";
  }, [result.documentMetadata.source]);

  /**
   * Format source for display
   */
  const sourceDisplay = useMemo(() => {
    const source = result.documentMetadata.source || "";
    if (source.startsWith("http")) {
      try {
        const url = new URL(source);
        return url.hostname + url.pathname;
      } catch {
        return source;
      }
    }
    return source;
  }, [result.documentMetadata.source]);

  /**
   * Calculate risk level for tab highlighting
   */
  const riskLevel = useMemo(() => {
    return calculateRiskLevel(result.risks);
  }, [result.risks]);

  /**
   * Copy results to clipboard
   */
  const handleCopy = async () => {
    const text = `
${documentTitle}

Summary:
${result.summary?.brief || "No summary available"}

Privacy Risks:
${result.risks?.map((r) => `- [${r.severity.toUpperCase()}] ${r.title}: ${r.description}`).join("\n") || "No risks identified"}

Key Terms:
${result.keyTerms?.map((t) => `- ${t.term}: ${t.definition}`).join("\n") || "No terms extracted"}
    `.trim();

    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className={`results-display ${className}`}>
      {/* Results Header */}
      <div className="results-header">
        <div className="results-header__info">
          <h1 className="results-header__title">{documentTitle}</h1>
          <div className="results-meta">
            <span className="results-meta__item">
              <span aria-hidden="true">📄</span> {sourceDisplay}
            </span>
            <span className="results-meta__item">
              <span aria-hidden="true">🕐</span> Analyzed{" "}
              {formatDate(result.timestamp)}
            </span>
            <span className="results-meta__item">
              <span aria-hidden="true">📊</span> {wordCount}
            </span>
          </div>
        </div>

        <div className="results-actions">
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            <span aria-hidden="true">📋</span> Copy
          </Button>
          {onExport && (
            <Button variant="ghost" size="sm" onClick={() => onExport(result)}>
              <span aria-hidden="true">💾</span> Export
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={onNewAnalysis}>
            <span aria-hidden="true">🔄</span> New Analysis
          </Button>
        </div>
      </div>

      {/* Privacy Scorecard - prominently displayed */}
      {result.scorecard && <PrivacyScorecard scorecard={result.scorecard} />}

      {/* View Mode Tabs - only shown when not in "all" mode */}
      <div
        className="results-tabs tabs"
        role="tablist"
        aria-label="Results view mode"
      >
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === "summary"}
          className={`tab ${viewMode === "summary" ? "tab--active" : ""}`}
          onClick={() => setViewMode("summary")}
        >
          Summary
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === "risks"}
          className={`tab ${viewMode === "risks" ? "tab--active" : ""} ${riskLevel.level !== "none" ? `tab--risk-${riskLevel.level}` : ""}`}
          onClick={() => setViewMode("risks")}
        >
          {riskLevel.level !== "none" && (
            <span
              className={`tab__risk-indicator tab__risk-indicator--${riskLevel.level}`}
              aria-hidden="true"
            />
          )}
          Privacy Risks
          {result.risks?.length > 0 && (
            <span
              className={`tab__count ${riskLevel.level !== "none" ? `tab__count--${riskLevel.level}` : ""}`}
            >
              {result.risks.length}
            </span>
          )}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === "terms"}
          className={`tab ${viewMode === "terms" ? "tab--active" : ""}`}
          onClick={() => setViewMode("terms")}
        >
          Key Terms
          {result.keyTerms?.length > 0 && (
            <span className="tab__count">{result.keyTerms.length}</span>
          )}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === "all"}
          className={`tab ${viewMode === "all" ? "tab--active" : ""}`}
          onClick={() => setViewMode("all")}
        >
          Full Report
        </button>
      </div>

      {/* Content panels */}
      <div className="results-display__content">
        {(viewMode === "summary" || viewMode === "all") && (
          <SummaryView summary={result.summary} />
        )}

        {(viewMode === "risks" || viewMode === "all") && (
          <RiskHighlights risks={result.risks} />
        )}

        {(viewMode === "terms" || viewMode === "all") && (
          <KeyTermsGlossary keyTerms={result.keyTerms} />
        )}
      </div>
    </div>
  );
}
