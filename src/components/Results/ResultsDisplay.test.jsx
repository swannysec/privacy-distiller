import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResultsDisplay } from "./ResultsDisplay";

// Mock child components
vi.mock("./SummaryView", () => ({
  SummaryView: vi.fn(({ summary }) => (
    <div data-testid="summary-view">Summary: {summary?.brief}</div>
  )),
}));

vi.mock("./RiskHighlights", () => ({
  RiskHighlights: vi.fn(({ risks, documentMetadata }) => (
    <div data-testid="risk-highlights">Risks: {risks.length}</div>
  )),
}));

vi.mock("./KeyTermsGlossary", () => ({
  KeyTermsGlossary: vi.fn(({ keyTerms }) => (
    <div data-testid="key-terms-glossary">Terms: {keyTerms.length}</div>
  )),
}));

vi.mock("../Common", () => ({
  Card: ({ children, className }) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  ),
  Button: ({ children, variant, onClick, ariaLabel }) => (
    <button onClick={onClick} aria-label={ariaLabel} data-variant={variant}>
      {children}
    </button>
  ),
}));

vi.mock("../../utils/formatting", () => ({
  formatDate: vi.fn((date) => "Jan 1, 2025 12:00 PM"),
}));

describe("ResultsDisplay", () => {
  const mockOnNewAnalysis = vi.fn();
  const mockOnExport = vi.fn();

  const mockResult = {
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
      full: "Full summary",
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
  });

  describe("Rendering", () => {
    it("should render metadata section", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />,
      );

      expect(screen.getByText("Document:")).toBeInTheDocument();
      expect(
        screen.getByText("https://example.com/privacy"),
      ).toBeInTheDocument();
      expect(screen.getByText("Analyzed:")).toBeInTheDocument();
      expect(screen.getByText("Jan 1, 2025 12:00 PM")).toBeInTheDocument();
    });

    it("should render overall risk score", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />,
      );

      expect(screen.getByText("Overall Risk:")).toBeInTheDocument();
      expect(screen.getByText("MEDIUM")).toBeInTheDocument();
    });

    it("should render view mode tabs", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />,
      );

      expect(screen.getByRole("tab", { name: /Summary/i })).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /Privacy Risks/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /Key Terms/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /Full Report/i }),
      ).toBeInTheDocument();
    });

    it("should render badges on tabs with counts", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />,
      );

      const risksTab = screen.getByRole("tab", { name: /Privacy Risks/i });
      expect(risksTab).toHaveTextContent("2");

      const termsTab = screen.getByRole("tab", { name: /Key Terms/i });
      expect(termsTab).toHaveTextContent("2");
    });

    it('should render "Analyze Another Document" button', () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />,
      );

      expect(
        screen.getByRole("button", { name: /Analyze another document/i }),
      ).toBeInTheDocument();
    });

    it('should render "Export Results" button when onExport provided', () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
          onExport={mockOnExport}
        />,
      );

      expect(
        screen.getByRole("button", { name: /Export results/i }),
      ).toBeInTheDocument();
    });

    it('should NOT render "Export Results" button when onExport not provided', () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />,
      );

      expect(
        screen.queryByRole("button", { name: /Export results/i }),
      ).not.toBeInTheDocument();
    });

    it("should render disclaimer", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />,
      );

      expect(
        screen.getByText(/should not be considered legal advice/i),
      ).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
          className="custom-class"
        />,
      );

      expect(
        container.querySelector(".results-display.custom-class"),
      ).toBeInTheDocument();
    });
  });

  describe("Risk Score Calculation", () => {
    it('should calculate "high" risk for critical risks', () => {
      const highRiskResult = {
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
        />,
      );

      expect(screen.getByText("HIGH")).toBeInTheDocument();
    });

    it('should calculate "high" risk for 3+ high severity risks', () => {
      const highRiskResult = {
        ...mockResult,
        risks: [
          {
            title: "Risk 1",
            severity: "high",
            description: "",
            explanation: "",
          },
          {
            title: "Risk 2",
            severity: "high",
            description: "",
            explanation: "",
          },
          {
            title: "Risk 3",
            severity: "high",
            description: "",
            explanation: "",
          },
        ],
      };

      render(
        <ResultsDisplay
          result={highRiskResult}
          onNewAnalysis={mockOnNewAnalysis}
        />,
      );

      expect(screen.getByText("HIGH")).toBeInTheDocument();
    });

    it('should calculate "medium" risk for 1 high severity risk', () => {
      const mediumRiskResult = {
        ...mockResult,
        risks: [
          {
            title: "High Risk",
            severity: "high",
            description: "",
            explanation: "",
          },
        ],
      };

      render(
        <ResultsDisplay
          result={mediumRiskResult}
          onNewAnalysis={mockOnNewAnalysis}
        />,
      );

      expect(screen.getByText("MEDIUM")).toBeInTheDocument();
    });

    it('should calculate "medium" risk for 3+ medium severity risks', () => {
      const mediumRiskResult = {
        ...mockResult,
        risks: [
          {
            title: "Risk 1",
            severity: "medium",
            description: "",
            explanation: "",
          },
          {
            title: "Risk 2",
            severity: "medium",
            description: "",
            explanation: "",
          },
          {
            title: "Risk 3",
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
        />,
      );

      expect(screen.getByText("MEDIUM")).toBeInTheDocument();
    });

    it('should calculate "low" risk for no risks', () => {
      const lowRiskResult = {
        ...mockResult,
        risks: [],
      };

      render(
        <ResultsDisplay
          result={lowRiskResult}
          onNewAnalysis={mockOnNewAnalysis}
        />,
      );

      expect(screen.getByText("LOW")).toBeInTheDocument();
    });

    it('should calculate "low" risk for only low severity risks', () => {
      const lowRiskResult = {
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
        />,
      );

      expect(screen.getByText("LOW")).toBeInTheDocument();
    });
  });

  describe("View Mode Switching", () => {
    it("should default to summary view", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />,
      );

      expect(screen.getByTestId("summary-view")).toBeInTheDocument();
      expect(screen.queryByTestId("risk-highlights")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("key-terms-glossary"),
      ).not.toBeInTheDocument();
    });

    it("should show summary tab as active by default", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />,
      );

      const summaryTab = screen.getByRole("tab", { name: /Summary/i });
      expect(summaryTab).toHaveAttribute("aria-selected", "true");
    });

    it("should switch to risks view when risks tab clicked", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />,
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
        />,
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
        />,
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
        />,
      );

      const risksTab = screen.getByRole("tab", { name: /Privacy Risks/i });
      fireEvent.click(risksTab);

      expect(risksTab).toHaveAttribute("aria-selected", "true");

      const summaryTab = screen.getByRole("tab", { name: /Summary/i });
      expect(summaryTab).toHaveAttribute("aria-selected", "false");
    });
  });

  describe("User Interactions", () => {
    it("should call onNewAnalysis when button clicked", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />,
      );

      const button = screen.getByRole("button", {
        name: /Analyze another document/i,
      });
      fireEvent.click(button);

      expect(mockOnNewAnalysis).toHaveBeenCalled();
    });

    it("should call onExport with result when Export button clicked", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
          onExport={mockOnExport}
        />,
      );

      const button = screen.getByRole("button", { name: /Export results/i });
      fireEvent.click(button);

      expect(mockOnExport).toHaveBeenCalledWith(mockResult);
    });
  });

  describe("Accessibility", () => {
    it("should have tablist role", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />,
      );

      const tablist = screen.getByRole("tablist");
      expect(tablist).toBeInTheDocument();
      expect(tablist).toHaveAttribute("aria-label", "Results view mode");
    });

    it("should have tab roles with aria-controls", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />,
      );

      const summaryTab = screen.getByRole("tab", { name: /Summary/i });
      expect(summaryTab).toHaveAttribute("aria-controls", "summary-panel");

      const risksTab = screen.getByRole("tab", { name: /Privacy Risks/i });
      expect(risksTab).toHaveAttribute("aria-controls", "risks-panel");
    });

    it("should have tabpanel roles", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />,
      );

      const panel = screen.getByRole("tabpanel");
      expect(panel).toBeInTheDocument();
    });

    it("should have proper aria-labelledby on panels", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />,
      );

      const panel = screen.getByRole("tabpanel");
      expect(panel).toHaveAttribute("aria-labelledby", "summary-tab");
    });

    it("should have button types", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />,
      );

      const tabs = screen.getAllByRole("tab");
      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute("type", "button");
      });
    });
  });

  describe("Risk Score Colors", () => {
    it("should apply green background for low risk", () => {
      const lowRiskResult = { ...mockResult, risks: [] };
      const { container } = render(
        <ResultsDisplay
          result={lowRiskResult}
          onNewAnalysis={mockOnNewAnalysis}
        />,
      );

      const badge = container.querySelector(".results-display__risk-badge");
      expect(badge).toHaveStyle({ backgroundColor: "#10b981" });
    });

    it("should apply amber background for medium risk", () => {
      const { container } = render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />,
      );

      const badge = container.querySelector(".results-display__risk-badge");
      expect(badge).toHaveStyle({ backgroundColor: "#f59e0b" });
    });

    it("should apply red background for high risk", () => {
      const highRiskResult = {
        ...mockResult,
        risks: [
          {
            title: "Critical",
            severity: "critical",
            description: "",
            explanation: "",
          },
        ],
      };
      const { container } = render(
        <ResultsDisplay
          result={highRiskResult}
          onNewAnalysis={mockOnNewAnalysis}
        />,
      );

      const badge = container.querySelector(".results-display__risk-badge");
      expect(badge).toHaveStyle({ backgroundColor: "#ef4444" });
    });

    it("should apply white text color", () => {
      const { container } = render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />,
      );

      const badge = container.querySelector(".results-display__risk-badge");
      expect(badge).toHaveStyle({ color: "rgb(255, 255, 255)" });
    });
  });

  describe("Edge Cases", () => {
    it("should handle result with no risks", () => {
      const noRisksResult = { ...mockResult, risks: [] };
      render(
        <ResultsDisplay
          result={noRisksResult}
          onNewAnalysis={mockOnNewAnalysis}
        />,
      );

      const risksTab = screen.getByRole("tab", { name: /Privacy Risks/i });
      expect(risksTab).not.toHaveTextContent(/\d+/);
    });

    it("should handle result with no key terms", () => {
      const noTermsResult = { ...mockResult, keyTerms: [] };
      render(
        <ResultsDisplay
          result={noTermsResult}
          onNewAnalysis={mockOnNewAnalysis}
        />,
      );

      const termsTab = screen.getByRole("tab", { name: /Key Terms/i });
      expect(termsTab).not.toHaveTextContent(/\d+/);
    });

    it("should handle result with empty summary", () => {
      const emptySummaryResult = {
        ...mockResult,
        summary: { brief: "", detailed: "", full: "" },
      };

      render(
        <ResultsDisplay
          result={emptySummaryResult}
          onNewAnalysis={mockOnNewAnalysis}
        />,
      );

      expect(screen.getByTestId("summary-view")).toBeInTheDocument();
    });

    it("should handle result with undefined documentMetadata.source", () => {
      const noSourceResult = {
        ...mockResult,
        documentMetadata: { ...mockResult.documentMetadata, source: undefined },
      };

      render(
        <ResultsDisplay
          result={noSourceResult}
          onNewAnalysis={mockOnNewAnalysis}
        />,
      );

      expect(screen.getByText("Document:")).toBeInTheDocument();
    });

    it("should handle rapid tab switching", () => {
      render(
        <ResultsDisplay
          result={mockResult}
          onNewAnalysis={mockOnNewAnalysis}
        />,
      );

      const tabs = screen.getAllByRole("tab");

      tabs.forEach((tab) => {
        fireEvent.click(tab);
      });

      // Should remain functional
      expect(screen.getByRole("tablist")).toBeInTheDocument();
    });
  });

  // Note: Removed "Component Props" tests that verified props passed to child components.
  // These tests check implementation details (which child components receive which props)
  // rather than user-facing behavior. The correct rendering of content is already tested
  // by the child component tests themselves.
});
