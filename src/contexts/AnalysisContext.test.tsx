import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from "@testing-library/react";
import { AnalysisProvider, useAnalysis } from "./AnalysisContext";
import { ANALYSIS_STATUS } from "../utils/constants";

// Mock storage utilities
vi.mock("../utils/storage", () => ({
  saveAnalysisToHistory: vi.fn(),
}));

// Test component to access context
function TestComponent() {
  const {
    status,
    result,
    error,
    progress,
    currentStep,
    document,
    isIdle,
    isExtracting,
    isAnalyzing,
    isCompleted,
    isError,
    hasResult,
    setDocumentInput,
    startAnalysis,
    updateProgress,
    setAnalyzing,
    completeAnalysis,
    setError,
    resetAnalysis,
    clearResults,
  } = useAnalysis();

  return (
    <div>
      <div data-testid="status">{status}</div>
      <div data-testid="document">
        {document ? JSON.stringify(document) : "none"}
      </div>
      <div data-testid="progress">{progress}</div>
      <div data-testid="current-step">{currentStep || "none"}</div>
      <div data-testid="has-result">{hasResult ? "true" : "false"}</div>
      <div data-testid="error">{error || "none"}</div>
      <div data-testid="is-idle">{isIdle ? "true" : "false"}</div>
      <div data-testid="is-extracting">{isExtracting ? "true" : "false"}</div>
      <div data-testid="is-analyzing">{isAnalyzing ? "true" : "false"}</div>
      <div data-testid="is-completed">{isCompleted ? "true" : "false"}</div>
      <div data-testid="is-error">{isError ? "true" : "false"}</div>

      <button
        onClick={() =>
          setDocumentInput({ text: "Test privacy policy", source: "url" })
        }
      >
        Set Document
      </button>
      <button onClick={startAnalysis}>Start Analysis</button>
      <button onClick={() => updateProgress(50, "Processing...")}>
        Update Progress
      </button>
      <button onClick={setAnalyzing}>Set Analyzing</button>
      <button
        onClick={() => completeAnalysis({ summary: { brief: "Test summary" } })}
      >
        Complete Analysis
      </button>
      <button onClick={() => setError("Test error")}>Set Error</button>
      <button onClick={resetAnalysis}>Reset</button>
      <button onClick={clearResults}>Clear Results</button>
    </div>
  );
}

describe("AnalysisContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("AnalysisProvider", () => {
    it("should render children", () => {
      render(
        <AnalysisProvider>
          <div data-testid="child">Test Child</div>
        </AnalysisProvider>,
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("should provide initial idle state", () => {
      render(
        <AnalysisProvider>
          <TestComponent />
        </AnalysisProvider>,
      );

      expect(screen.getByTestId("status")).toHaveTextContent(
        ANALYSIS_STATUS.IDLE,
      );
      expect(screen.getByTestId("document")).toHaveTextContent("none");
      expect(screen.getByTestId("progress")).toHaveTextContent("0");
      expect(screen.getByTestId("has-result")).toHaveTextContent("false");
      expect(screen.getByTestId("error")).toHaveTextContent("none");
      expect(screen.getByTestId("is-idle")).toHaveTextContent("true");
    });
  });

  describe("useAnalysis hook", () => {
    it("should throw error when used outside provider", () => {
      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow("useAnalysis must be used within AnalysisProvider");

      consoleSpy.mockRestore();
    });

    it("should provide analysis state", () => {
      render(
        <AnalysisProvider>
          <TestComponent />
        </AnalysisProvider>,
      );

      expect(screen.getByTestId("status")).toBeInTheDocument();
      expect(screen.getByTestId("document")).toBeInTheDocument();
      expect(screen.getByTestId("progress")).toBeInTheDocument();
    });

    it("should set document input", async () => {
      render(
        <AnalysisProvider>
          <TestComponent />
        </AnalysisProvider>,
      );

      const setDocumentButton = screen.getByText("Set Document");

      await act(async () => {
        fireEvent.click(setDocumentButton);
      });

      await waitFor(() => {
        const documentText = screen.getByTestId("document").textContent;
        expect(documentText).toContain("Test privacy policy");
        expect(documentText).toContain("url");
      });
    });

    it("should start analysis", async () => {
      render(
        <AnalysisProvider>
          <TestComponent />
        </AnalysisProvider>,
      );

      const startButton = screen.getByText("Start Analysis");

      await act(async () => {
        fireEvent.click(startButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent(
          ANALYSIS_STATUS.EXTRACTING,
        );
        expect(screen.getByTestId("is-extracting")).toHaveTextContent("true");
      });
    });

    it("should update progress", async () => {
      render(
        <AnalysisProvider>
          <TestComponent />
        </AnalysisProvider>,
      );

      const updateButton = screen.getByText("Update Progress");

      await act(async () => {
        fireEvent.click(updateButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId("progress")).toHaveTextContent("50");
        expect(screen.getByTestId("current-step")).toHaveTextContent(
          "Processing...",
        );
      });
    });

    it("should set analyzing state", async () => {
      render(
        <AnalysisProvider>
          <TestComponent />
        </AnalysisProvider>,
      );

      const analyzingButton = screen.getByText("Set Analyzing");

      await act(async () => {
        fireEvent.click(analyzingButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent(
          ANALYSIS_STATUS.ANALYZING,
        );
        expect(screen.getByTestId("is-analyzing")).toHaveTextContent("true");
        expect(screen.getByTestId("progress")).toHaveTextContent("25");
      });
    });

    it("should complete analysis with result", async () => {
      render(
        <AnalysisProvider>
          <TestComponent />
        </AnalysisProvider>,
      );

      const completeButton = screen.getByText("Complete Analysis");

      await act(async () => {
        fireEvent.click(completeButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent(
          ANALYSIS_STATUS.COMPLETED,
        );
        expect(screen.getByTestId("is-completed")).toHaveTextContent("true");
        expect(screen.getByTestId("has-result")).toHaveTextContent("true");
        expect(screen.getByTestId("progress")).toHaveTextContent("100");
      });
    });

    it("should handle errors", async () => {
      render(
        <AnalysisProvider>
          <TestComponent />
        </AnalysisProvider>,
      );

      const errorButton = screen.getByText("Set Error");

      await act(async () => {
        fireEvent.click(errorButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent("Test error");
        expect(screen.getByTestId("status")).toHaveTextContent(
          ANALYSIS_STATUS.ERROR,
        );
        expect(screen.getByTestId("is-error")).toHaveTextContent("true");
      });
    });

    it("should reset all analysis data", async () => {
      render(
        <AnalysisProvider>
          <TestComponent />
        </AnalysisProvider>,
      );

      // Set document and error first
      await act(async () => {
        fireEvent.click(screen.getByText("Set Document"));
      });

      await act(async () => {
        fireEvent.click(screen.getByText("Set Error"));
      });

      // Now reset
      await act(async () => {
        fireEvent.click(screen.getByText("Reset"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent(
          ANALYSIS_STATUS.IDLE,
        );
        expect(screen.getByTestId("document")).toHaveTextContent("none");
        expect(screen.getByTestId("error")).toHaveTextContent("none");
        expect(screen.getByTestId("has-result")).toHaveTextContent("false");
        expect(screen.getByTestId("is-idle")).toHaveTextContent("true");
      });
    });

    it("should clear results but keep document", async () => {
      render(
        <AnalysisProvider>
          <TestComponent />
        </AnalysisProvider>,
      );

      // Set document and complete analysis
      await act(async () => {
        fireEvent.click(screen.getByText("Set Document"));
      });

      await act(async () => {
        fireEvent.click(screen.getByText("Complete Analysis"));
      });

      // Now clear results
      await act(async () => {
        fireEvent.click(screen.getByText("Clear Results"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent(
          ANALYSIS_STATUS.IDLE,
        );
        expect(screen.getByTestId("has-result")).toHaveTextContent("false");
        // Document should still be there
        const documentText = screen.getByTestId("document").textContent;
        expect(documentText).toContain("Test privacy policy");
      });
    });
  });

  describe("analysis workflow", () => {
    it("should support complete analysis workflow", async () => {
      render(
        <AnalysisProvider>
          <TestComponent />
        </AnalysisProvider>,
      );

      // Step 1: Set document
      await act(async () => {
        fireEvent.click(screen.getByText("Set Document"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("document").textContent).toContain(
          "Test privacy policy",
        );
        expect(screen.getByTestId("status")).toHaveTextContent(
          ANALYSIS_STATUS.IDLE,
        );
      });

      // Step 2: Start analysis (extracting)
      await act(async () => {
        fireEvent.click(screen.getByText("Start Analysis"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent(
          ANALYSIS_STATUS.EXTRACTING,
        );
        expect(screen.getByTestId("is-extracting")).toHaveTextContent("true");
      });

      // Step 3: Move to analyzing
      await act(async () => {
        fireEvent.click(screen.getByText("Set Analyzing"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent(
          ANALYSIS_STATUS.ANALYZING,
        );
        expect(screen.getByTestId("is-analyzing")).toHaveTextContent("true");
      });

      // Step 4: Complete analysis
      await act(async () => {
        fireEvent.click(screen.getByText("Complete Analysis"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent(
          ANALYSIS_STATUS.COMPLETED,
        );
        expect(screen.getByTestId("is-completed")).toHaveTextContent("true");
        expect(screen.getByTestId("has-result")).toHaveTextContent("true");
      });
    });

    it("should handle error during analysis workflow", async () => {
      render(
        <AnalysisProvider>
          <TestComponent />
        </AnalysisProvider>,
      );

      // Start analysis
      await act(async () => {
        fireEvent.click(screen.getByText("Start Analysis"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-extracting")).toHaveTextContent("true");
      });

      // Encounter error
      await act(async () => {
        fireEvent.click(screen.getByText("Set Error"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent(
          ANALYSIS_STATUS.ERROR,
        );
        expect(screen.getByTestId("is-error")).toHaveTextContent("true");
        expect(screen.getByTestId("error")).toHaveTextContent("Test error");
      });
    });

    it("should allow reanalysis after completion", async () => {
      render(
        <AnalysisProvider>
          <TestComponent />
        </AnalysisProvider>,
      );

      // Complete first analysis
      await act(async () => {
        fireEvent.click(screen.getByText("Complete Analysis"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-completed")).toHaveTextContent("true");
      });

      // Clear results and start new analysis
      await act(async () => {
        fireEvent.click(screen.getByText("Clear Results"));
      });

      await act(async () => {
        fireEvent.click(screen.getByText("Start Analysis"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent(
          ANALYSIS_STATUS.EXTRACTING,
        );
        expect(screen.getByTestId("is-extracting")).toHaveTextContent("true");
      });
    });
  });

  describe("computed properties", () => {
    it("should correctly compute isIdle", () => {
      render(
        <AnalysisProvider>
          <TestComponent />
        </AnalysisProvider>,
      );

      expect(screen.getByTestId("is-idle")).toHaveTextContent("true");
    });

    it("should correctly compute isExtracting", async () => {
      render(
        <AnalysisProvider>
          <TestComponent />
        </AnalysisProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByText("Start Analysis"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-extracting")).toHaveTextContent("true");
      });
    });

    it("should correctly compute isAnalyzing", async () => {
      render(
        <AnalysisProvider>
          <TestComponent />
        </AnalysisProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByText("Set Analyzing"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-analyzing")).toHaveTextContent("true");
      });
    });

    it("should correctly compute isCompleted", async () => {
      render(
        <AnalysisProvider>
          <TestComponent />
        </AnalysisProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByText("Complete Analysis"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-completed")).toHaveTextContent("true");
      });
    });

    it("should correctly compute isError", async () => {
      render(
        <AnalysisProvider>
          <TestComponent />
        </AnalysisProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByText("Set Error"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-error")).toHaveTextContent("true");
      });
    });

    it("should correctly compute hasResult", async () => {
      render(
        <AnalysisProvider>
          <TestComponent />
        </AnalysisProvider>,
      );

      expect(screen.getByTestId("has-result")).toHaveTextContent("false");

      await act(async () => {
        fireEvent.click(screen.getByText("Complete Analysis"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("has-result")).toHaveTextContent("true");
      });
    });
  });
});
