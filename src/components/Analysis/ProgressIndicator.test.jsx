import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ProgressIndicator } from "./ProgressIndicator";
import { ANALYSIS_STATUS } from "../../utils/constants";

// Mock LoadingSpinner from Common barrel export
vi.mock("../Common", () => ({
  LoadingSpinner: ({ size }) => (
    <div data-testid="loading-spinner" data-size={size}>
      Loading...
    </div>
  ),
}));

describe("ProgressIndicator", () => {
  describe("Idle State", () => {
    it("should render idle state with ready label", () => {
      render(<ProgressIndicator status={ANALYSIS_STATUS.IDLE} />);

      expect(screen.getByText("Ready")).toBeInTheDocument();
    });

    it("should show pause emoji icon for idle state", () => {
      render(<ProgressIndicator status={ANALYSIS_STATUS.IDLE} />);

      expect(screen.getByText("⏸️")).toBeInTheDocument();
    });

    it("should not show progress bar in idle state", () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.IDLE} />,
      );

      expect(
        container.querySelector(".progress-indicator__bar-container"),
      ).not.toBeInTheDocument();
    });

    it("should not show steps in idle state", () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.IDLE} />,
      );

      expect(
        container.querySelector(".progress-indicator__steps"),
      ).not.toBeInTheDocument();
    });

    it("should not show LoadingSpinner in idle state", () => {
      render(<ProgressIndicator status={ANALYSIS_STATUS.IDLE} />);

      expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
    });
  });

  describe("Extracting State", () => {
    it("should render extracting state with label", () => {
      render(<ProgressIndicator status={ANALYSIS_STATUS.EXTRACTING} />);

      expect(screen.getByText("Extracting Text")).toBeInTheDocument();
    });

    it("should show LoadingSpinner for extracting state", () => {
      render(<ProgressIndicator status={ANALYSIS_STATUS.EXTRACTING} />);

      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute("data-size", "small");
    });

    it("should show progress bar for extracting state", () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.EXTRACTING} progress={25} />,
      );

      const progressBar = container.querySelector(".progress-indicator__bar");
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle({ width: "25%" });
    });

    it("should not show steps for extracting state", () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.EXTRACTING} />,
      );

      expect(
        container.querySelector(".progress-indicator__steps"),
      ).not.toBeInTheDocument();
    });

    it("should show currentStep when provided during extracting", () => {
      render(
        <ProgressIndicator
          status={ANALYSIS_STATUS.EXTRACTING}
          currentStep="Fetching document..."
        />,
      );

      expect(screen.getByText("Fetching document...")).toBeInTheDocument();
    });

    it("should show percentage when progress provided", () => {
      render(
        <ProgressIndicator status={ANALYSIS_STATUS.EXTRACTING} progress={42} />,
      );

      expect(screen.getByText("42%")).toBeInTheDocument();
    });
  });

  describe("Analyzing State", () => {
    it("should render analyzing state with label", () => {
      render(<ProgressIndicator status={ANALYSIS_STATUS.ANALYZING} />);

      expect(screen.getByText("Analyzing Policy")).toBeInTheDocument();
    });

    it("should show LoadingSpinner for analyzing state", () => {
      render(<ProgressIndicator status={ANALYSIS_STATUS.ANALYZING} />);

      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute("data-size", "small");
    });

    it("should show progress bar with progress value", () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.ANALYZING} progress={60} />,
      );

      const progressBar = container.querySelector(".progress-indicator__bar");
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle({ width: "60%" });
    });

    it("should show steps during analyzing state", () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.ANALYZING} />,
      );

      expect(
        container.querySelector(".progress-indicator__steps"),
      ).toBeInTheDocument();
    });

    it("should render all 6 step items", () => {
      render(<ProgressIndicator status={ANALYSIS_STATUS.ANALYZING} />);

      expect(screen.getByText("Extract document text")).toBeInTheDocument();
      expect(screen.getByText("Generate brief summary")).toBeInTheDocument();
      expect(screen.getByText("Generate detailed summary")).toBeInTheDocument();
      expect(screen.getByText("Identify privacy risks")).toBeInTheDocument();
      expect(screen.getByText("Extract key terms")).toBeInTheDocument();
      expect(screen.getByText("Finalize analysis")).toBeInTheDocument();
    });

    it("should show currentStep when provided during analyzing", () => {
      render(
        <ProgressIndicator
          status={ANALYSIS_STATUS.ANALYZING}
          currentStep="Generating summary..."
        />,
      );

      expect(screen.getByText("Generating summary...")).toBeInTheDocument();
    });

    it("should show percentage when progress provided", () => {
      render(
        <ProgressIndicator status={ANALYSIS_STATUS.ANALYZING} progress={75} />,
      );

      expect(screen.getByText("75%")).toBeInTheDocument();
    });
  });

  describe("Completed State", () => {
    it("should render completed state with label", () => {
      render(<ProgressIndicator status={ANALYSIS_STATUS.COMPLETED} />);

      expect(screen.getByText("Analysis Complete")).toBeInTheDocument();
    });

    it("should show checkmark emoji icon for completed state", () => {
      render(<ProgressIndicator status={ANALYSIS_STATUS.COMPLETED} />);

      expect(screen.getByText("✅")).toBeInTheDocument();
    });

    it("should not show progress bar for completed state", () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.COMPLETED} />,
      );

      expect(
        container.querySelector(".progress-indicator__bar-container"),
      ).not.toBeInTheDocument();
    });

    it("should not show steps for completed state", () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.COMPLETED} />,
      );

      expect(
        container.querySelector(".progress-indicator__steps"),
      ).not.toBeInTheDocument();
    });

    it("should not show LoadingSpinner in completed state", () => {
      render(<ProgressIndicator status={ANALYSIS_STATUS.COMPLETED} />);

      expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
    });
  });

  describe("Failed State", () => {
    it("should render failed state with label", () => {
      render(<ProgressIndicator status={ANALYSIS_STATUS.FAILED} />);

      expect(screen.getByText("Analysis Failed")).toBeInTheDocument();
    });

    it("should show X emoji icon for failed state", () => {
      render(<ProgressIndicator status={ANALYSIS_STATUS.FAILED} />);

      expect(screen.getByText("❌")).toBeInTheDocument();
    });

    it("should not show progress bar for failed state", () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.FAILED} />,
      );

      expect(
        container.querySelector(".progress-indicator__bar-container"),
      ).not.toBeInTheDocument();
    });

    it("should not show steps for failed state", () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.FAILED} />,
      );

      expect(
        container.querySelector(".progress-indicator__steps"),
      ).not.toBeInTheDocument();
    });

    it("should show error message when provided", () => {
      render(
        <ProgressIndicator
          status={ANALYSIS_STATUS.FAILED}
          error="Network connection failed"
        />,
      );

      const errorElement = screen.getByText("Network connection failed");
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveAttribute("role", "alert");
    });

    it("should not show LoadingSpinner in failed state", () => {
      render(<ProgressIndicator status={ANALYSIS_STATUS.FAILED} />);

      expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it('should have role="status" for screen readers', () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.ANALYZING} />,
      );

      expect(container.querySelector('[role="status"]')).toBeInTheDocument();
    });

    it('should have aria-live="polite" for status updates', () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.ANALYZING} />,
      );

      expect(
        container.querySelector('[aria-live="polite"]'),
      ).toBeInTheDocument();
    });

    it("should have progressbar role when showing progress", () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.ANALYZING} progress={45} />,
      );

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
    });

    it("should have aria-valuenow for progress bar", () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.ANALYZING} progress={60} />,
      );

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveAttribute("aria-valuenow", "60");
    });

    it('should have aria-valuemin="0" for progress bar', () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.ANALYZING} progress={60} />,
      );

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveAttribute("aria-valuemin", "0");
    });

    it('should have aria-valuemax="100" for progress bar', () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.ANALYZING} progress={60} />,
      );

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveAttribute("aria-valuemax", "100");
    });

    it('should have aria-hidden="true" on icon', () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.IDLE} />,
      );

      const icon = container.querySelector(".progress-indicator__icon");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it('should have role="alert" on error message', () => {
      render(
        <ProgressIndicator
          status={ANALYSIS_STATUS.FAILED}
          error="Test error"
        />,
      );

      const errorElement = screen.getByText("Test error");
      expect(errorElement).toHaveAttribute("role", "alert");
    });
  });

  describe("Props", () => {
    it("should accept and use status prop", () => {
      const { rerender } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.IDLE} />,
      );
      expect(screen.getByText("Ready")).toBeInTheDocument();

      rerender(<ProgressIndicator status={ANALYSIS_STATUS.EXTRACTING} />);
      expect(screen.getByText("Extracting Text")).toBeInTheDocument();

      rerender(<ProgressIndicator status={ANALYSIS_STATUS.ANALYZING} />);
      expect(screen.getByText("Analyzing Policy")).toBeInTheDocument();
    });

    it("should accept and use progress prop", () => {
      const { container, rerender } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.ANALYZING} progress={25} />,
      );

      let progressBar = container.querySelector(".progress-indicator__bar");
      expect(progressBar).toHaveStyle({ width: "25%" });

      rerender(
        <ProgressIndicator status={ANALYSIS_STATUS.ANALYZING} progress={75} />,
      );
      progressBar = container.querySelector(".progress-indicator__bar");
      expect(progressBar).toHaveStyle({ width: "75%" });
    });

    it("should accept and use currentStep prop", () => {
      render(
        <ProgressIndicator
          status={ANALYSIS_STATUS.ANALYZING}
          currentStep="Processing data..."
        />,
      );

      expect(screen.getByText("Processing data...")).toBeInTheDocument();
    });

    it("should accept and use error prop", () => {
      render(
        <ProgressIndicator
          status={ANALYSIS_STATUS.FAILED}
          error="Custom error message"
        />,
      );

      expect(screen.getByText("Custom error message")).toBeInTheDocument();
    });

    it("should accept and use className prop", () => {
      const { container } = render(
        <ProgressIndicator
          status={ANALYSIS_STATUS.IDLE}
          className="custom-class"
        />,
      );

      expect(
        container.querySelector(".progress-indicator.custom-class"),
      ).toBeInTheDocument();
    });

    it("should use default progress value of 0", () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.ANALYZING} />,
      );

      const progressBar = container.querySelector(".progress-indicator__bar");
      expect(progressBar).toHaveStyle({ width: "0%" });
    });

    it("should handle undefined props gracefully", () => {
      const { container } = render(<ProgressIndicator />);

      expect(
        container.querySelector(".progress-indicator"),
      ).toBeInTheDocument();
    });
  });

  describe("Progress Bar Display", () => {
    it("should show progress bar during extracting", () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.EXTRACTING} />,
      );

      expect(
        container.querySelector(".progress-indicator__bar-container"),
      ).toBeInTheDocument();
    });

    it("should show progress bar during analyzing", () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.ANALYZING} />,
      );

      expect(
        container.querySelector(".progress-indicator__bar-container"),
      ).toBeInTheDocument();
    });

    it("should not show progress bar when idle", () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.IDLE} />,
      );

      expect(
        container.querySelector(".progress-indicator__bar-container"),
      ).not.toBeInTheDocument();
    });

    it("should not show progress bar when completed", () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.COMPLETED} />,
      );

      expect(
        container.querySelector(".progress-indicator__bar-container"),
      ).not.toBeInTheDocument();
    });

    it("should not show progress bar when failed", () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.FAILED} />,
      );

      expect(
        container.querySelector(".progress-indicator__bar-container"),
      ).not.toBeInTheDocument();
    });

    it("should display rounded progress percentage", () => {
      render(
        <ProgressIndicator
          status={ANALYSIS_STATUS.ANALYZING}
          progress={33.7}
        />,
      );

      expect(screen.getByText("34%")).toBeInTheDocument();
    });

    it("should apply status color to progress bar", () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.ANALYZING} progress={50} />,
      );

      const progressBar = container.querySelector(".progress-indicator__bar");
      expect(progressBar).toHaveStyle({ backgroundColor: "#8b5cf6" });
    });
  });

  describe("Steps Display", () => {
    it("should only show steps during analyzing status", () => {
      const { container, rerender } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.ANALYZING} />,
      );
      expect(
        container.querySelector(".progress-indicator__steps"),
      ).toBeInTheDocument();

      rerender(<ProgressIndicator status={ANALYSIS_STATUS.EXTRACTING} />);
      expect(
        container.querySelector(".progress-indicator__steps"),
      ).not.toBeInTheDocument();

      rerender(<ProgressIndicator status={ANALYSIS_STATUS.IDLE} />);
      expect(
        container.querySelector(".progress-indicator__steps"),
      ).not.toBeInTheDocument();
    });

    it("should show completed checkmark for completed steps", () => {
      render(
        <ProgressIndicator status={ANALYSIS_STATUS.ANALYZING} progress={50} />,
      );

      // StepItem with completed={true} should show checkmark
      expect(screen.getAllByText("✓").length).toBeGreaterThan(0);
    });
  });

  describe("CurrentStep Display", () => {
    it("should show currentStep only during active states", () => {
      const { rerender } = render(
        <ProgressIndicator
          status={ANALYSIS_STATUS.EXTRACTING}
          currentStep="Test step"
        />,
      );
      expect(screen.getByText("Test step")).toBeInTheDocument();

      rerender(
        <ProgressIndicator
          status={ANALYSIS_STATUS.ANALYZING}
          currentStep="Test step"
        />,
      );
      expect(screen.getByText("Test step")).toBeInTheDocument();
    });

    it("should not show currentStep during idle", () => {
      render(
        <ProgressIndicator
          status={ANALYSIS_STATUS.IDLE}
          currentStep="Test step"
        />,
      );
      expect(screen.queryByText("Test step")).not.toBeInTheDocument();
    });

    it("should not show currentStep during completed", () => {
      render(
        <ProgressIndicator
          status={ANALYSIS_STATUS.COMPLETED}
          currentStep="Test step"
        />,
      );
      expect(screen.queryByText("Test step")).not.toBeInTheDocument();
    });

    it("should not show currentStep during failed", () => {
      render(
        <ProgressIndicator
          status={ANALYSIS_STATUS.FAILED}
          currentStep="Test step"
        />,
      );
      expect(screen.queryByText("Test step")).not.toBeInTheDocument();
    });
  });

  describe("Icon Display", () => {
    it("should show emoji icon for idle status", () => {
      render(<ProgressIndicator status={ANALYSIS_STATUS.IDLE} />);
      expect(screen.getByText("⏸️")).toBeInTheDocument();
    });

    it("should show LoadingSpinner for extracting status", () => {
      render(<ProgressIndicator status={ANALYSIS_STATUS.EXTRACTING} />);
      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    });

    it("should show LoadingSpinner for analyzing status", () => {
      render(<ProgressIndicator status={ANALYSIS_STATUS.ANALYZING} />);
      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    });

    it("should show emoji icon for completed status", () => {
      render(<ProgressIndicator status={ANALYSIS_STATUS.COMPLETED} />);
      expect(screen.getByText("✅")).toBeInTheDocument();
    });

    it("should show emoji icon for failed status", () => {
      render(<ProgressIndicator status={ANALYSIS_STATUS.FAILED} />);
      expect(screen.getByText("❌")).toBeInTheDocument();
    });
  });

  describe("Rendering", () => {
    it("should render progress indicator container", () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.IDLE} />,
      );

      expect(
        container.querySelector(".progress-indicator"),
      ).toBeInTheDocument();
    });

    it("should render header section", () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.ANALYZING} />,
      );

      expect(
        container.querySelector(".progress-indicator__header"),
      ).toBeInTheDocument();
    });

    it("should render icon section", () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.ANALYZING} />,
      );

      expect(
        container.querySelector(".progress-indicator__icon"),
      ).toBeInTheDocument();
    });

    it("should render content section", () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.ANALYZING} />,
      );

      expect(
        container.querySelector(".progress-indicator__content"),
      ).toBeInTheDocument();
    });

    it("should render label", () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.ANALYZING} />,
      );

      expect(
        container.querySelector(".progress-indicator__label"),
      ).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle unknown status gracefully", () => {
      const { container } = render(
        <ProgressIndicator status="unknown-status" />,
      );

      expect(
        container.querySelector(".progress-indicator"),
      ).toBeInTheDocument();
    });

    it("should handle null status", () => {
      const { container } = render(<ProgressIndicator status={null} />);

      expect(
        container.querySelector(".progress-indicator"),
      ).toBeInTheDocument();
    });

    it("should handle undefined status", () => {
      const { container } = render(<ProgressIndicator status={undefined} />);

      expect(
        container.querySelector(".progress-indicator"),
      ).toBeInTheDocument();
    });

    it("should handle negative progress", () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.ANALYZING} progress={-10} />,
      );

      const progressBar = container.querySelector(".progress-indicator__bar");
      expect(progressBar).toBeInTheDocument();
    });

    it("should handle progress over 100", () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.ANALYZING} progress={150} />,
      );

      const progressBar = container.querySelector(".progress-indicator__bar");
      expect(progressBar).toBeInTheDocument();
    });

    it("should handle empty string currentStep", () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.ANALYZING} currentStep="" />,
      );

      expect(
        container.querySelector(".progress-indicator__step"),
      ).not.toBeInTheDocument();
    });

    it("should handle empty string error", () => {
      const { container } = render(
        <ProgressIndicator status={ANALYSIS_STATUS.FAILED} error="" />,
      );

      expect(
        container.querySelector(".progress-indicator__error"),
      ).not.toBeInTheDocument();
    });
  });
});
