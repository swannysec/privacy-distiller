import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AnalysisSection } from "./AnalysisSection";
import { ANALYSIS_STATUS } from "../../utils/constants";

// Mock child components
vi.mock("../../components/Analysis/ProgressIndicator", () => ({
  ProgressIndicator: vi.fn(({ status, progress, currentStep }: { status: string; progress: number; currentStep: string }) => (
    <div data-testid="progress-indicator">
      Status: {status}, Progress: {progress}, Step: {currentStep}
    </div>
  )),
}));

vi.mock("../../components/Results", () => ({
  ResultsDisplay: vi.fn(({ result, onNewAnalysis, onExport }: { result: { id: string }; onNewAnalysis: () => void; onExport?: (result: { id: string }) => void }) => (
    <div data-testid="results-display">
      <div>Result ID: {result.id}</div>
      <button onClick={onNewAnalysis}>New Analysis</button>
      {onExport && <button onClick={() => onExport(result)}>Export</button>}
    </div>
  )),
}));

vi.mock("../Common", () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  ),
  Button: ({ children, variant, onClick, ariaLabel }: { children: React.ReactNode; variant?: string; onClick?: () => void; ariaLabel?: string }) => (
    <button onClick={onClick} aria-label={ariaLabel} data-variant={variant}>
      {children}
    </button>
  ),
}));

// Mock context
const mockResetAnalysis = vi.fn();
const mockUseAnalysis: Mock = vi.fn();

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
        status: ANALYSIS_STATUS.COMPLETED,
        result: {
          id: "result-123",
          summary: { brief: "Summary" },
          risks: [],
          keyTerms: [],
        },
        error: null,
        progress: 100,
        currentStep: "Analysis complete",
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
        status: ANALYSIS_STATUS.EXTRACTING,
        result: null,
        error: null,
        progress: 25,
        currentStep: "Reading PDF pages",
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
        status: ANALYSIS_STATUS.ANALYZING,
        result: null,
        error: null,
        progress: 50,
        currentStep: "Identifying privacy risks",
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
    // Note: Error state is now rendered in App.jsx inline near the input for better visibility.
    // AnalysisSection returns null when failed, as error handling was moved.
    beforeEach(() => {
      mockUseAnalysis.mockReturnValue({
        status: ANALYSIS_STATUS.FAILED,
        result: null,
        error: "API key is invalid",
        progress: 0,
        currentStep: null,
        resetAnalysis: mockResetAnalysis,
      });
    });

    it("should return null when failed (error shown elsewhere)", () => {
      const { container } = render(
        <AnalysisSection onNewAnalysis={mockOnNewAnalysis} />,
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Idle State", () => {
    beforeEach(() => {
      mockUseAnalysis.mockReturnValue({
        status: ANALYSIS_STATUS.IDLE,
        result: null,
        error: null,
        progress: 0,
        currentStep: null,
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
        status: ANALYSIS_STATUS.COMPLETED,
        result: null,
        error: null,
        progress: 100,
        currentStep: null,
        resetAnalysis: mockResetAnalysis,
      });

      const { container } = render(
        <AnalysisSection onNewAnalysis={mockOnNewAnalysis} />,
      );

      expect(screen.queryByTestId("results-display")).not.toBeInTheDocument();
      expect(container.firstChild).toBeNull();
    });

    it("should handle missing onNewAnalysis callback in completed state", () => {
      mockUseAnalysis.mockReturnValue({
        status: ANALYSIS_STATUS.COMPLETED,
        result: { id: "result-123", summary: {}, risks: [], keyTerms: [] },
        error: null,
        progress: 100,
        currentStep: null,
        resetAnalysis: mockResetAnalysis,
      });

      render(<AnalysisSection onNewAnalysis={undefined} />);

      const newAnalysisButton = screen.getByRole("button", {
        name: /New Analysis/i,
      });
      fireEvent.click(newAnalysisButton);

      expect(mockResetAnalysis).toHaveBeenCalled();
    });

    it("should handle missing onExportResults callback", () => {
      mockUseAnalysis.mockReturnValue({
        status: ANALYSIS_STATUS.COMPLETED,
        result: { id: "result-123", summary: {}, risks: [], keyTerms: [] },
        error: null,
        progress: 100,
        currentStep: null,
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
    it("should have proper heading hierarchy in progress state", () => {
      mockUseAnalysis.mockReturnValue({
        status: ANALYSIS_STATUS.EXTRACTING,
        result: null,
        error: null,
        progress: 25,
        currentStep: "Reading PDF pages",
        resetAnalysis: mockResetAnalysis,
      });

      render(<AnalysisSection onNewAnalysis={mockOnNewAnalysis} />);

      expect(
        screen.getByRole("heading", { name: /What's happening\?/i }),
      ).toBeInTheDocument();
    });

    it("should have proper button labels in completed state", () => {
      mockUseAnalysis.mockReturnValue({
        status: ANALYSIS_STATUS.COMPLETED,
        result: { id: "result-123", summary: {}, risks: [], keyTerms: [] },
        error: null,
        progress: 100,
        currentStep: null,
        resetAnalysis: mockResetAnalysis,
      });

      render(
        <AnalysisSection
          onNewAnalysis={mockOnNewAnalysis}
          onExportResults={mockOnExportResults}
        />,
      );

      expect(
        screen.getByRole("button", { name: /New Analysis/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Export/i }),
      ).toBeInTheDocument();
    });
  });
});
