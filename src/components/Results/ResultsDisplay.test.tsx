import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResultsDisplay } from "./ResultsDisplay";

// Mock child components
vi.mock("./SummaryView", () => ({
  SummaryView: vi.fn(({ summary }: { summary?: { brief?: string } }) => (
    <div data-testid="summary-view">Summary: {summary?.brief}</div>
  )),
}));

vi.mock("./RiskHighlights", () => ({
  RiskHighlights: vi.fn(({ risks }: { risks?: unknown[] }) => (
    <div data-testid="risk-highlights">Risks: {risks?.length || 0}</div>
  )),
}));

vi.mock("./KeyTermsGlossary", () => ({
  KeyTermsGlossary: vi.fn(({ keyTerms }: { keyTerms?: unknown[] }) => (
    <div data-testid="key-terms-glossary">Terms: {keyTerms?.length || 0}</div>
  )),
}));

vi.mock("./PrivacyScorecard", () => ({
  PrivacyScorecard: vi.fn(({ scorecard }: { scorecard?: unknown }) => (
    <div data-testid="privacy-scorecard">Scorecard</div>
  )),
}));

vi.mock("../Common", () => ({
  Button: ({ children, variant, size, onClick }: { children: React.ReactNode; variant?: string; size?: string; onClick?: () => void }) => (
    <button onClick={onClick} data-variant={variant} data-size={size}>
      {children}
    </button>
  ),
}));

vi.mock("../../utils/formatting", () => ({
  formatDate: vi.fn((date: string) => "Jan 1, 2025"),
}));

vi.mock("../../utils/sanitization", () => ({
  sanitizeText: vi.fn((text: string) => text),
}));

interface Risk {
  title: string;
  severity: string;
  description: string;
  explanation: string;
}

interface KeyTerm {
  term: string;
  definition: string;
  category: string;
}

interface AnalysisResult {
  id: string;
  timestamp: string;
  documentMetadata: {
    source: string;
    title: string;
    extractedAt: string;
  };
  summary: {
    brief: string;
    detailed: string;
    full: string;
  };
  risks: Risk[];
  keyTerms: KeyTerm[];
  scorecard?: { overallScore: number };
}

describe("ResultsDisplay", () => {
  const mockOnNewAnalysis: Mock = vi.fn();
  const mockOnExport: Mock = vi.fn();

  const mockResult: AnalysisResult = {
    id: "result-1",
    timestamp: "2025-01-01T12:00:00Z",
    documentMetadata: {
      source: "https://example.com/privacy",
      title: "Privacy Policy",
      extractedAt: "2025-01-01T12:00:00Z",
    },
    summary: {
      brief: "Brief summary",
      detailed: "Detailed summary",
      full: "Full summary with more words to count properly for display",
    },
    risks: [
      {
        title: "Risk 1",
        severity: "high",
        description: "Desc 1",
        explanation: "Exp 1",
      },
      {
        title: "Risk 2",
        severity: "medium",
        description: "Desc 2",
        explanation: "Exp 2",
      },
    ],
    keyTerms: [
      { term: "PII", definition: "Personal Information", category: "Privacy" },
      { term: "Cookie", definition: "Web tracking", category: "Tracking" },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  describe("Rendering", () => {
    it("should render results header with document title", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      // Should extract company name from URL and create title
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        /Privacy Policy Analysis/i
      );
    });

    it("should render source in metadata", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      expect(screen.getByText(/example.com/)).toBeInTheDocument();
    });

    it("should render analyzed date", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      expect(screen.getByText(/Analyzed Jan 1, 2025/)).toBeInTheDocument();
    });

    it("should render word count estimate", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      expect(screen.getByText(/~\d+ words/)).toBeInTheDocument();
    });

    it("should render view mode tabs", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      expect(screen.getByRole("tab", { name: /Summary/i })).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /Privacy Risks/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /Key Terms/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /Full Report/i })
      ).toBeInTheDocument();
    });

    it("should render badges on tabs with counts", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      const risksTab = screen.getByRole("tab", { name: /Privacy Risks/i });
      expect(risksTab).toHaveTextContent("2");

      const termsTab = screen.getByRole("tab", { name: /Key Terms/i });
      expect(termsTab).toHaveTextContent("2");
    });

    it("should render New Analysis button", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      expect(
        screen.getByRole("button", { name: /New Analysis/i })
      ).toBeInTheDocument();
    });

    it("should render Export button when onExport provided", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
          onExport={mockOnExport}
        />
      );

      expect(
        screen.getByRole("button", { name: /Export/i })
      ).toBeInTheDocument();
    });

    it("should NOT render Export button when onExport not provided", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      // Only the Copy button should have "Export" text
      const buttons = screen.getAllByRole("button");
      const exportButton = buttons.find(
        (btn) => btn.textContent === "💾 Export"
      );
      expect(exportButton).toBeUndefined();
    });

    it("should render Copy button", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      expect(screen.getByRole("button", { name: /Copy/i })).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
          className="custom-class"
        />
      );

      expect(
        container.querySelector(".results-display.custom-class")
      ).toBeInTheDocument();
    });

    it("should render PrivacyScorecard when scorecard present", () => {
      const resultWithScorecard: AnalysisResult = {
        ...mockResult,
        scorecard: { overallScore: 75 },
      };

      render(
        <ResultsDisplay
          result={resultWithScorecard}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      expect(screen.getByTestId("privacy-scorecard")).toBeInTheDocument();
    });

    it("should NOT render PrivacyScorecard when scorecard absent", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      expect(
        screen.queryByTestId("privacy-scorecard")
      ).not.toBeInTheDocument();
    });
  });

  describe("Empty/Missing Result Handling", () => {
    it("should render fallback message when result is null", () => {
      render(
        <ResultsDisplay result={null} onNewAnalysis={mockOnNewAnalysis} />
      );

      expect(
        screen.getByText(/No analysis results available/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Start New Analysis/i })
      ).toBeInTheDocument();
    });

    it("should render fallback message when result is undefined", () => {
      render(
        <ResultsDisplay result={undefined} onNewAnalysis={mockOnNewAnalysis} />
      );

      expect(
        screen.getByText(/No analysis results available/i)
      ).toBeInTheDocument();
    });

    it("should render fallback when documentMetadata is missing", () => {
      const incompleteResult = { id: "1", summary: {} } as unknown as AnalysisResult;

      render(
        <ResultsDisplay
          result={incompleteResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      expect(
        screen.getByText(/No analysis results available/i)
      ).toBeInTheDocument();
    });

    it("should call onNewAnalysis when Start New Analysis clicked in fallback", () => {
      render(
        <ResultsDisplay result={null} onNewAnalysis={mockOnNewAnalysis} />
      );

      const button = screen.getByRole("button", { name: /Start New Analysis/i });
      fireEvent.click(button);

      expect(mockOnNewAnalysis).toHaveBeenCalled();
    });
  });

  describe("View Mode Switching", () => {
    it("should default to summary view", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      expect(screen.getByTestId("summary-view")).toBeInTheDocument();
      expect(screen.queryByTestId("risk-highlights")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("key-terms-glossary")
      ).not.toBeInTheDocument();
    });

    it("should show summary tab as active by default", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      const summaryTab = screen.getByRole("tab", { name: /Summary/i });
      expect(summaryTab).toHaveAttribute("aria-selected", "true");
    });

    it("should switch to risks view when risks tab clicked", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      const risksTab = screen.getByRole("tab", { name: /Privacy Risks/i });
      fireEvent.click(risksTab);

      expect(screen.getByTestId("risk-highlights")).toBeInTheDocument();
      expect(screen.queryByTestId("summary-view")).not.toBeInTheDocument();
    });

    it("should switch to terms view when terms tab clicked", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      const termsTab = screen.getByRole("tab", { name: /Key Terms/i });
      fireEvent.click(termsTab);

      expect(screen.getByTestId("key-terms-glossary")).toBeInTheDocument();
      expect(screen.queryByTestId("summary-view")).not.toBeInTheDocument();
    });

    it("should switch to all view when full report tab clicked", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      const allTab = screen.getByRole("tab", { name: /Full Report/i });
      fireEvent.click(allTab);

      expect(screen.getByTestId("summary-view")).toBeInTheDocument();
      expect(screen.getByTestId("risk-highlights")).toBeInTheDocument();
      expect(screen.getByTestId("key-terms-glossary")).toBeInTheDocument();
    });

    it("should update aria-selected when switching tabs", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      const risksTab = screen.getByRole("tab", { name: /Privacy Risks/i });
      fireEvent.click(risksTab);

      expect(risksTab).toHaveAttribute("aria-selected", "true");

      const summaryTab = screen.getByRole("tab", { name: /Summary/i });
      expect(summaryTab).toHaveAttribute("aria-selected", "false");
    });
  });

  describe("User Interactions", () => {
    it("should call onNewAnalysis when New Analysis button clicked", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      const button = screen.getByRole("button", { name: /New Analysis/i });
      fireEvent.click(button);

      expect(mockOnNewAnalysis).toHaveBeenCalled();
    });

    it("should call onExport with result when Export button clicked", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
          onExport={mockOnExport}
        />
      );

      const button = screen.getByRole("button", { name: /Export/i });
      fireEvent.click(button);

      expect(mockOnExport).toHaveBeenCalledWith(mockResult);
    });

    it("should copy results to clipboard when Copy button clicked", async () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      const button = screen.getByRole("button", { name: /Copy/i });
      fireEvent.click(button);

      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have tablist role", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      const tablist = screen.getByRole("tablist");
      expect(tablist).toBeInTheDocument();
      expect(tablist).toHaveAttribute("aria-label", "Results view mode");
    });

    it("should have tab roles", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      const tabs = screen.getAllByRole("tab");
      expect(tabs.length).toBe(4);
    });

    it("should have button types on tabs", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      const tabs = screen.getAllByRole("tab");
      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute("type", "button");
      });
    });

    it("should have aria-hidden on decorative icons", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      const hiddenElements = document.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenElements.length).toBeGreaterThan(0);
    });
  });

  describe("Risk Level Calculation", () => {
    it("should show risk indicator on risks tab when risks present", () => {
      const { container } = render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      // Should have risk indicator styling on tab
      const risksTab = screen.getByRole("tab", { name: /Privacy Risks/i });
      expect(risksTab.className).toContain("tab--risk");
    });

    it("should not show risk indicator when no risks", () => {
      const noRisksResult: AnalysisResult = { ...mockResult, risks: [] };

      render(
        <ResultsDisplay
          result={noRisksResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      const risksTab = screen.getByRole("tab", { name: /Privacy Risks/i });
      expect(risksTab.className).not.toContain("tab--risk-high");
      expect(risksTab.className).not.toContain("tab--risk-medium");
    });

    it("should apply high risk class for high severity risks", () => {
      const highRiskResult: AnalysisResult = {
        ...mockResult,
        risks: [
          {
            title: "Critical Risk",
            severity: "critical",
            description: "",
            explanation: "",
          },
        ],
      };

      render(
        <ResultsDisplay
          result={highRiskResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      const risksTab = screen.getByRole("tab", { name: /Privacy Risks/i });
      expect(risksTab.className).toContain("tab--risk-high");
    });

    it("should apply medium risk class for medium severity risks only", () => {
      const mediumRiskResult: AnalysisResult = {
        ...mockResult,
        risks: [
          {
            title: "Medium Risk",
            severity: "medium",
            description: "",
            explanation: "",
          },
        ],
      };

      render(
        <ResultsDisplay
          result={mediumRiskResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      const risksTab = screen.getByRole("tab", { name: /Privacy Risks/i });
      expect(risksTab.className).toContain("tab--risk-medium");
    });

    it("should apply low risk class for low severity risks only", () => {
      const lowRiskResult: AnalysisResult = {
        ...mockResult,
        risks: [
          {
            title: "Low Risk",
            severity: "low",
            description: "",
            explanation: "",
          },
        ],
      };

      render(
        <ResultsDisplay
          result={lowRiskResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      const risksTab = screen.getByRole("tab", { name: /Privacy Risks/i });
      expect(risksTab.className).toContain("tab--risk-low");
    });
  });

  describe("Document Title Generation", () => {
    it("should extract company name from URL domain", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Example Privacy Policy Analysis"
      );
    });

    it("should handle PDF filename source", () => {
      const pdfResult: AnalysisResult = {
        ...mockResult,
        documentMetadata: {
          ...mockResult.documentMetadata,
          source: "privacy-policy.pdf",
        },
      };

      render(
        <ResultsDisplay result={pdfResult} onNewAnalysis={mockOnNewAnalysis} />
      );

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "privacy-policy Analysis"
      );
    });

    it("should handle www prefix in URL", () => {
      const wwwResult: AnalysisResult = {
        ...mockResult,
        documentMetadata: {
          ...mockResult.documentMetadata,
          source: "https://www.google.com/privacy",
        },
      };

      render(
        <ResultsDisplay result={wwwResult} onNewAnalysis={mockOnNewAnalysis} />
      );

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Google Privacy Policy Analysis"
      );
    });

    it("should handle invalid URL gracefully", () => {
      const invalidResult: AnalysisResult = {
        ...mockResult,
        documentMetadata: {
          ...mockResult.documentMetadata,
          source: "not-a-valid-url",
        },
      };

      render(
        <ResultsDisplay
          result={invalidResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      // Should fallback to treating it as filename
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "not-a-valid-url Analysis"
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle result with no risks", () => {
      const noRisksResult: AnalysisResult = { ...mockResult, risks: [] };
      render(
        <ResultsDisplay
          result={noRisksResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      const risksTab = screen.getByRole("tab", { name: /Privacy Risks/i });
      // Should not have count badge when no risks
      expect(risksTab.querySelector(".tab__count")).toBeNull();
    });

    it("should handle result with no key terms", () => {
      const noTermsResult: AnalysisResult = { ...mockResult, keyTerms: [] };
      render(
        <ResultsDisplay
          result={noTermsResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      const termsTab = screen.getByRole("tab", { name: /Key Terms/i });
      // Should not have count badge when no terms
      expect(termsTab.querySelector(".tab__count")).toBeNull();
    });

    it("should handle result with empty summary", () => {
      const emptySummaryResult: AnalysisResult = {
        ...mockResult,
        summary: { brief: "", detailed: "", full: "" },
      };

      render(
        <ResultsDisplay
          result={emptySummaryResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      expect(screen.getByTestId("summary-view")).toBeInTheDocument();
    });

    it("should handle result with undefined risks", () => {
      const undefinedRisksResult = { ...mockResult, risks: undefined } as unknown as AnalysisResult;

      render(
        <ResultsDisplay
          result={undefinedRisksResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      expect(
        screen.getByRole("tab", { name: /Privacy Risks/i })
      ).toBeInTheDocument();
    });

    it("should handle result with undefined keyTerms", () => {
      const undefinedTermsResult = { ...mockResult, keyTerms: undefined } as unknown as AnalysisResult;

      render(
        <ResultsDisplay
          result={undefinedTermsResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      expect(
        screen.getByRole("tab", { name: /Key Terms/i })
      ).toBeInTheDocument();
    });

    it("should handle rapid tab switching", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      const tabs = screen.getAllByRole("tab");

      tabs.forEach((tab) => {
        fireEvent.click(tab);
      });

      // Should remain functional
      expect(screen.getByRole("tablist")).toBeInTheDocument();
    });

    it("should handle empty source string", () => {
      const emptySourceResult: AnalysisResult = {
        ...mockResult,
        documentMetadata: {
          ...mockResult.documentMetadata,
          source: "",
        },
      };

      render(
        <ResultsDisplay
          result={emptySourceResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      // Should still render without crashing
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    });
  });

  describe("CSS Classes", () => {
    it("should have results-display root class", () => {
      const { container } = render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      expect(container.querySelector(".results-display")).toBeInTheDocument();
    });

    it("should have results-header class", () => {
      const { container } = render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      expect(container.querySelector(".results-header")).toBeInTheDocument();
    });

    it("should have results-tabs class", () => {
      const { container } = render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      expect(container.querySelector(".results-tabs")).toBeInTheDocument();
    });

    it("should apply tab--active class to selected tab", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      const summaryTab = screen.getByRole("tab", { name: /Summary/i });
      expect(summaryTab.className).toContain("tab--active");
    });

    it("should have results-display__content class", () => {
      const { container } = render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />
      );

      expect(
        container.querySelector(".results-display__content")
      ).toBeInTheDocument();
    });
  });
});
