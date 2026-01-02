import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SummaryView } from "./SummaryView";

// Mock ReactMarkdown
vi.mock("react-markdown", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="markdown">{children}</div>,
}));

interface Summary {
  brief: string;
  detailed: string;
  full: string;
}

describe("SummaryView", () => {
  const mockSummary: Summary = {
    brief:
      "This is a brief summary of the policy. It contains about 200 words.",
    detailed:
      "This is a detailed summary with more information. It contains about 500 words with expanded key points.",
    full: "This is a full comprehensive analysis of the entire policy document. It contains over 1000 words with complete details and thorough explanations.",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render with title and subtitle", () => {
      render(<SummaryView summary={mockSummary} />);

      expect(screen.getByText("Policy Summary")).toBeInTheDocument();
      expect(
        screen.getByText("AI-generated summary in plain language"),
      ).toBeInTheDocument();
    });

    it("should render three level tabs", () => {
      render(<SummaryView summary={mockSummary} />);

      expect(
        screen.getByRole("tab", { name: /Brief/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /Detailed/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Full Analysis/i })).toBeInTheDocument();
    });

    it("should show brief content by default", () => {
      render(<SummaryView summary={mockSummary} />);

      expect(screen.getByText(/This is a brief summary/i)).toBeInTheDocument();
    });

    it("should show reading time estimate", () => {
      render(<SummaryView summary={mockSummary} />);

      expect(screen.getByText(/min read/i)).toBeInTheDocument();
    });

    it("should show word count estimate", () => {
      render(<SummaryView summary={mockSummary} />);

      expect(screen.getByText("~200 words")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(
        <SummaryView summary={mockSummary} className="custom-class" />,
      );

      expect(
        container.querySelector(".summary-view.custom-class"),
      ).toBeInTheDocument();
    });
  });

  describe("Level Switching", () => {
    it("should mark Brief as active by default", () => {
      render(<SummaryView summary={mockSummary} />);

      const briefTab = screen.getByRole("tab", { name: /Brief/i });
      expect(briefTab).toHaveAttribute("aria-selected", "true");
    });

    it("should switch to detailed view when Detailed clicked", () => {
      render(<SummaryView summary={mockSummary} />);

      const detailedTab = screen.getByRole("tab", { name: /Detailed/i });
      fireEvent.click(detailedTab);

      expect(
        screen.getByText(/This is a detailed summary/i),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(/This is a brief summary/i),
      ).not.toBeInTheDocument();
    });

    it("should switch to full view when Full Analysis clicked", () => {
      render(<SummaryView summary={mockSummary} />);

      const fullTab = screen.getByRole("tab", { name: /Full Analysis/i });
      fireEvent.click(fullTab);

      expect(
        screen.getByText(/This is a full comprehensive/i),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(/This is a brief summary/i),
      ).not.toBeInTheDocument();
    });

    it("should update active state when switching levels", () => {
      render(<SummaryView summary={mockSummary} />);

      const detailedTab = screen.getByRole("tab", { name: /Detailed/i });
      fireEvent.click(detailedTab);

      expect(detailedTab).toHaveAttribute("aria-selected", "true");

      const briefTab = screen.getByRole("tab", { name: /Brief/i });
      expect(briefTab).toHaveAttribute("aria-selected", "false");
    });

    it("should update word count when switching levels", () => {
      render(<SummaryView summary={mockSummary} />);

      expect(screen.getByText("~200 words")).toBeInTheDocument();

      const detailedTab = screen.getByRole("tab", { name: /Detailed/i });
      fireEvent.click(detailedTab);

      expect(screen.getByText("~500 words")).toBeInTheDocument();
      expect(screen.queryByText("~200 words")).not.toBeInTheDocument();
    });

    it('should show "~1000+ words" for full level', () => {
      render(<SummaryView summary={mockSummary} />);

      const fullTab = screen.getByRole("tab", { name: /Full Analysis/i });
      fireEvent.click(fullTab);

      expect(screen.getByText("~1000+ words")).toBeInTheDocument();
    });
  });

  describe("Reading Time Estimation", () => {
    it("should calculate reading time for brief summary", () => {
      const briefSummary: Summary = {
        brief: Array(200).fill("word").join(" "), // 200 words
        detailed: "",
        full: "",
      };

      render(<SummaryView summary={briefSummary} />);

      // 200 words / 200 words per minute = 1 minute
      expect(screen.getByText(/1 min read/i)).toBeInTheDocument();
    });

    it("should calculate reading time for detailed summary", () => {
      const detailedSummary: Summary = {
        brief: "",
        detailed: Array(600).fill("word").join(" "), // 600 words
        full: "",
      };

      render(<SummaryView summary={detailedSummary} />);

      const detailedTab = screen.getByRole("tab", { name: /Detailed/i });
      fireEvent.click(detailedTab);

      // 600 words / 200 words per minute = 3 minutes
      expect(screen.getByText(/3 min read/i)).toBeInTheDocument();
    });

    it("should round up reading time", () => {
      const shortSummary: Summary = {
        brief: Array(50).fill("word").join(" "), // 50 words
        detailed: "",
        full: "",
      };

      render(<SummaryView summary={shortSummary} />);

      // 50 words / 200 words per minute = 0.25, should round up to 1
      expect(screen.getByText(/1 min read/i)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it('should have role="tablist" on level selector', () => {
      render(<SummaryView summary={mockSummary} />);

      const tablist = screen.getByRole("tablist", {
        name: /Summary detail level/i,
      });
      expect(tablist).toBeInTheDocument();
    });

    it("should have aria-selected on level tabs", () => {
      render(<SummaryView summary={mockSummary} />);

      const briefTab = screen.getByRole("tab", { name: /Brief/i });
      const detailedTab = screen.getByRole("tab", { name: /Detailed/i });
      const fullTab = screen.getByRole("tab", { name: /Full Analysis/i });

      expect(briefTab).toHaveAttribute("aria-selected", "true");
      expect(detailedTab).toHaveAttribute("aria-selected", "false");
      expect(fullTab).toHaveAttribute("aria-selected", "false");
    });

    it('should have type="button" on level tabs', () => {
      render(<SummaryView summary={mockSummary} />);

      const tabs = screen.getAllByRole("tab");
      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute("type", "button");
      });
    });
  });

  describe("CSS Classes", () => {
    it("should apply active class to selected level tab", () => {
      const { container } = render(<SummaryView summary={mockSummary} />);

      const activeTab = container.querySelector(".summary-tab--active");
      expect(activeTab).toBeInTheDocument();
      expect(activeTab).toHaveTextContent("Brief");
    });

    it("should update active class when switching levels", () => {
      const { container } = render(<SummaryView summary={mockSummary} />);

      const detailedTab = screen.getByRole("tab", { name: /Detailed/i });
      fireEvent.click(detailedTab);

      const activeTab = container.querySelector(".summary-tab--active");
      expect(activeTab).toHaveTextContent("Detailed");
    });

    it("should not apply active class to non-selected tabs", () => {
      const { container } = render(<SummaryView summary={mockSummary} />);

      const tabs = container.querySelectorAll(".summary-tab");
      const activeTabs = container.querySelectorAll(".summary-tab--active");

      expect(tabs.length).toBe(3);
      expect(activeTabs.length).toBe(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty brief summary with default text", () => {
      const emptySummary: Summary = {
        brief: "",
        detailed: "Detailed content",
        full: "Full content",
      };

      render(<SummaryView summary={emptySummary} />);

      // Component provides default text for empty summaries
      expect(screen.getByText(/No brief summary available/i)).toBeInTheDocument();
    });

    it("should handle undefined summary with defaults", () => {
      render(<SummaryView />);

      expect(screen.getByText(/No brief summary available/i)).toBeInTheDocument();
    });

    it("should handle very long content", () => {
      const longSummary: Summary = {
        brief: Array(5000).fill("word").join(" "),
        detailed: Array(10000).fill("word").join(" "),
        full: Array(20000).fill("word").join(" "),
      };

      render(<SummaryView summary={longSummary} />);

      // 5000 words / 200 words per minute = 25 minutes
      expect(screen.getByText(/25 min read/i)).toBeInTheDocument();
    });

    it("should handle rapid level switching", () => {
      render(<SummaryView summary={mockSummary} />);

      const tabs = screen.getAllByRole("tab");

      // Rapidly switch between levels
      for (let i = 0; i < 10; i++) {
        tabs.forEach((tab) => {
          fireEvent.click(tab);
        });
      }

      // Should remain functional
      expect(screen.getByRole("tablist")).toBeInTheDocument();
    });

    it("should handle summary with only whitespace", () => {
      const whitespaceSummary: Summary = {
        brief: "   \n\n   ",
        detailed: "\t\t\t",
        full: "          ",
      };

      render(<SummaryView summary={whitespaceSummary} />);

      // Should calculate reading time as ~0 words, ceil to 1 minute
      expect(screen.getByText(/1 min read/i)).toBeInTheDocument();
    });
  });

  describe("Meta Information", () => {
    it("should render reading time with icon", () => {
      render(<SummaryView summary={mockSummary} />);

      // Icon is within the reading time text
      expect(screen.getByText(/min read/i)).toBeInTheDocument();
      expect(screen.getByText("📖")).toBeInTheDocument();
    });

    it("should have proper structure for meta items", () => {
      const { container } = render(<SummaryView summary={mockSummary} />);

      const metaItems = container.querySelectorAll(".summary-meta__item");
      expect(metaItems.length).toBe(2); // reading time and word count
    });
  });
});
