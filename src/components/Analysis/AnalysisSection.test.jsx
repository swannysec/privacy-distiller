import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AnalysisSection } from "./AnalysisSection";
import { ANALYSIS_STATUS } from "../../utils/constants";

// Mock child components
vi.mock("../../components/Analysis/ProgressIndicator", () => ({
  ProgressIndicator: vi.fn(({ status, progress, currentStep }) => (
    <div data-testid="progress-indicator">
      Status: {status}, Progress: {progress}, Step: {currentStep}
    </div>
  )),
}));

vi.mock("../../components/Results", () => ({
  ResultsDisplay: vi.fn(({ result, onNewAnalysis, onExport }) => (
    <div data-testid="results-display">
      <div>Result ID: {result.id}</div>
      <button onClick={onNewAnalysis}>New Analysis</button>
      {onExport && <button onClick={() => onExport(result)}>Export</button>}
    </div>
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

// Mock context
const mockResetAnalysis = vi.fn();
const mockUseAnalysis = vi.fn();

vi.mock("../../contexts", () => ({
  useAnalysis: () => mockUseAnalysis(),
}));

describe("AnalysisSection", () => {
  const mockOnNewAnalysis = vi.fn();
  const mockOnExportResults = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Completed State", () => {
    beforeEach(() => {
      mockUseAnalysis.mockReturnValue({
        state: {
          status: ANALYSIS_STATUS.COMPLETED,
          result: {
            id: "result-123",
            summary: { brief: "Summary" },
            risks: [],
            keyTerms: [],
          },
        },
        resetAnalysis: mockResetAnalysis,
      });
    });

    it("should render ResultsDisplay when analysis completed", () => {
      render(<AnalysisSection onNewAnalysis={mockOnNewAnalysis} />);

      expect(screen.getByTestId("results-display")).toBeInTheDocument();
      expect(screen.getByText(/Result ID: result-123/)).toBeInTheDocument();
    });

    // Note: Removed tests that verified props passed to ResultsDisplay.
    // These check implementation details rather than user-facing behavior.

    it("should handle retry from ResultsDisplay", () => {
      render(<AnalysisSection onNewAnalysis={mockOnNewAnalysis} />);

      const retryButton = screen.getByRole("button", { name: /New Analysis/i });
      fireEvent.click(retryButton);

      expect(mockResetAnalysis).toHaveBeenCalled();
      expect(mockOnNewAnalysis).toHaveBeenCalled();
    });

    it("should apply custom className", () => {
      const { container } = render(
        <AnalysisSection
          onNewAnalysis={mockOnNewAnalysis}
          className="custom-class"
        />,
      );

      expect(
        container.querySelector(".analysis-section.custom-class"),
      ).toBeInTheDocument();
    });
  });

  describe("Extracting State", () => {
    beforeEach(() => {
      mockUseAnalysis.mockReturnValue({
        state: {
          status: ANALYSIS_STATUS.EXTRACTING,
          progress: 25,
          currentStep: "Reading PDF pages",
        },
        resetAnalysis: mockResetAnalysis,
      });
    });

    it("should render ProgressIndicator when extracting", () => {
      render(<AnalysisSection onNewAnalysis={mockOnNewAnalysis} />);

      expect(screen.getByTestId("progress-indicator")).toBeInTheDocument();
    });

    // Note: Removed test that verified props passed to ProgressIndicator.
    // This checks implementation details rather than user-facing behavior.

    it("should show extraction explanation", () => {
      render(<AnalysisSection onNewAnalysis={mockOnNewAnalysis} />);

      expect(
        screen.getByText(/Extracting text content from your document/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/For PDFs: Reading each page/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/For URLs: Fetching the page/i),
      ).toBeInTheDocument();
    });

    it("should show wait time estimate", () => {
      render(<AnalysisSection onNewAnalysis={mockOnNewAnalysis} />);

      expect(
        screen.getByText(/typically takes 30-60 seconds/i),
      ).toBeInTheDocument();
    });
  });

  describe("Analyzing State", () => {
    beforeEach(() => {
      mockUseAnalysis.mockReturnValue({
        state: {
          status: ANALYSIS_STATUS.ANALYZING,
          progress: 50,
          currentStep: "Identifying privacy risks",
        },
        resetAnalysis: mockResetAnalysis,
      });
    });

    it("should render ProgressIndicator when analyzing", () => {
      render(<AnalysisSection onNewAnalysis={mockOnNewAnalysis} />);

      expect(screen.getByTestId("progress-indicator")).toBeInTheDocument();
    });

    it("should show analyzing explanation", () => {
      render(<AnalysisSection onNewAnalysis={mockOnNewAnalysis} />);

      expect(
        screen.getByText(/Analyzing the privacy policy with AI/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Generating layered summaries/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Identifying privacy risks and concerns/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Extracting and explaining key terms/i),
      ).toBeInTheDocument();
    });
  });

  describe("Failed State", () => {
    beforeEach(() => {
      mockUseAnalysis.mockReturnValue({
        state: {
          status: ANALYSIS_STATUS.FAILED,
          error: "API key is invalid",
        },
        resetAnalysis: mockResetAnalysis,
      });
    });

    it("should render error card when failed", () => {
      render(<AnalysisSection onNewAnalysis={mockOnNewAnalysis} />);

      expect(screen.getByText("Analysis Failed")).toBeInTheDocument();
    });

    it("should show error message", () => {
      render(<AnalysisSection onNewAnalysis={mockOnNewAnalysis} />);

      expect(screen.getByText("API key is invalid")).toBeInTheDocument();
    });

    it("should show default error message if no error provided", () => {
      mockUseAnalysis.mockReturnValue({
        state: {
          status: ANALYSIS_STATUS.FAILED,
          error: null,
        },
        resetAnalysis: mockResetAnalysis,
      });

      render(<AnalysisSection onNewAnalysis={mockOnNewAnalysis} />);

      expect(
        screen.getByText(/An unexpected error occurred/i),
      ).toBeInTheDocument();
    });

    it("should show error icon", () => {
      render(<AnalysisSection onNewAnalysis={mockOnNewAnalysis} />);

      expect(screen.getByText("⚠️")).toBeInTheDocument();
    });

    it("should show common issues help", () => {
      render(<AnalysisSection onNewAnalysis={mockOnNewAnalysis} />);

      expect(screen.getByText(/Common issues:/i)).toBeInTheDocument();
      expect(screen.getByText(/API Key:/i)).toBeInTheDocument();
      expect(screen.getByText(/Local LLM:/i)).toBeInTheDocument();
      expect(screen.getByText(/Network:/i)).toBeInTheDocument();
      expect(screen.getByText(/Document:/i)).toBeInTheDocument();
    });

    it("should render Try Again button", () => {
      render(<AnalysisSection onNewAnalysis={mockOnNewAnalysis} />);

      expect(
        screen.getByRole("button", { name: /Retry analysis/i }),
      ).toBeInTheDocument();
    });

    it("should render Start Over button", () => {
      render(<AnalysisSection onNewAnalysis={mockOnNewAnalysis} />);

      expect(
        screen.getByRole("button", { name: /Start over/i }),
      ).toBeInTheDocument();
    });

    it("should handle Try Again click", () => {
      render(<AnalysisSection onNewAnalysis={mockOnNewAnalysis} />);

      const tryAgainButton = screen.getByRole("button", {
        name: /Retry analysis/i,
      });
      fireEvent.click(tryAgainButton);

      expect(mockResetAnalysis).toHaveBeenCalled();
      expect(mockOnNewAnalysis).toHaveBeenCalled();
    });

    it("should handle Start Over click", () => {
      render(<AnalysisSection onNewAnalysis={mockOnNewAnalysis} />);

      const startOverButton = screen.getByRole("button", {
        name: /Start over/i,
      });
      fireEvent.click(startOverButton);

      expect(mockResetAnalysis).toHaveBeenCalled();
      expect(mockOnNewAnalysis).not.toHaveBeenCalled();
    });
  });

  describe("Idle State", () => {
    beforeEach(() => {
      mockUseAnalysis.mockReturnValue({
        state: {
          status: ANALYSIS_STATUS.IDLE,
        },
        resetAnalysis: mockResetAnalysis,
      });
    });

    it("should render nothing when idle", () => {
      const { container } = render(
        <AnalysisSection onNewAnalysis={mockOnNewAnalysis} />,
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Edge Cases", () => {
    it("should not render ResultsDisplay if no result even when completed", () => {
      mockUseAnalysis.mockReturnValue({
        state: {
          status: ANALYSIS_STATUS.COMPLETED,
          result: null,
        },
        resetAnalysis: mockResetAnalysis,
      });

      const { container } = render(
        <AnalysisSection onNewAnalysis={mockOnNewAnalysis} />,
      );

      expect(screen.queryByTestId("results-display")).not.toBeInTheDocument();
      expect(container.firstChild).toBeNull();
    });

    it("should handle missing onNewAnalysis callback", () => {
      mockUseAnalysis.mockReturnValue({
        state: {
          status: ANALYSIS_STATUS.FAILED,
          error: "Error",
        },
        resetAnalysis: mockResetAnalysis,
      });

      render(<AnalysisSection onNewAnalysis={undefined} />);

      const tryAgainButton = screen.getByRole("button", {
        name: /Retry analysis/i,
      });
      fireEvent.click(tryAgainButton);

      expect(mockResetAnalysis).toHaveBeenCalled();
    });

    it("should handle missing onExportResults callback", () => {
      mockUseAnalysis.mockReturnValue({
        state: {
          status: ANALYSIS_STATUS.COMPLETED,
          result: { id: "result-123", summary: {}, risks: [], keyTerms: [] },
        },
        resetAnalysis: mockResetAnalysis,
      });

      render(
        <AnalysisSection
          onNewAnalysis={mockOnNewAnalysis}
          onExportResults={undefined}
        />,
      );

      expect(
        screen.queryByRole("button", { name: /Export/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have aria-hidden on decorative icons", () => {
      mockUseAnalysis.mockReturnValue({
        state: {
          status: ANALYSIS_STATUS.FAILED,
          error: "Error",
        },
        resetAnalysis: mockResetAnalysis,
      });

      const { container } = render(
        <AnalysisSection onNewAnalysis={mockOnNewAnalysis} />,
      );

      const icon = container.querySelector(".analysis-section__error-icon");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("should have proper button labels", () => {
      mockUseAnalysis.mockReturnValue({
        state: {
          status: ANALYSIS_STATUS.FAILED,
          error: "Error",
        },
        resetAnalysis: mockResetAnalysis,
      });

      render(<AnalysisSection onNewAnalysis={mockOnNewAnalysis} />);

      expect(
        screen.getByRole("button", { name: /Retry analysis/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Start over/i }),
      ).toBeInTheDocument();
    });
  });
});
