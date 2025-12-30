import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RiskHighlights } from "./RiskHighlights";

vi.mock("react-markdown", () => ({
  default: ({ children }) => <div data-testid="markdown">{children}</div>,
}));

describe("RiskHighlights", () => {
  const mockRisks = [
    {
      title: "Data Collection",
      severity: "high",
      description: "Collects extensive personal data",
      explanation: "This may include sensitive information",
      affectedSections: ["Section 1", "Section 2"],
    },
    {
      title: "Third Party Sharing",
      severity: "medium",
      description: "Shares data with third parties",
      explanation: "Your data may be sold to advertisers",
      affectedSections: ["Section 3"],
    },
    {
      title: "Data Retention",
      severity: "low",
      description: "Retains data indefinitely",
      explanation: "No clear deletion policy",
      affectedSections: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering with Risks", () => {
    it("should render title", () => {
      render(<RiskHighlights risks={mockRisks} />);

      expect(
        screen.getByText("Privacy Risks Identified"),
      ).toBeInTheDocument();
    });

    it("should render subtitle", () => {
      render(<RiskHighlights risks={mockRisks} />);

      expect(
        screen.getByText("Potential concerns ranked by severity"),
      ).toBeInTheDocument();
    });

    it("should render all risk titles", () => {
      render(<RiskHighlights risks={mockRisks} />);

      expect(screen.getByText("Data Collection")).toBeInTheDocument();
      expect(screen.getByText("Third Party Sharing")).toBeInTheDocument();
      expect(screen.getByText("Data Retention")).toBeInTheDocument();
    });

    it("should render all risk descriptions", () => {
      render(<RiskHighlights risks={mockRisks} />);

      expect(
        screen.getByText("Collects extensive personal data"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Shares data with third parties"),
      ).toBeInTheDocument();
      expect(screen.getByText("Retains data indefinitely")).toBeInTheDocument();
    });

    it("should render severity badges with correct labels", () => {
      render(<RiskHighlights risks={mockRisks} />);

      expect(screen.getByText("Higher Risk")).toBeInTheDocument();
      expect(screen.getByText("Medium Risk")).toBeInTheDocument();
      expect(screen.getByText("Low Risk")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(
        <RiskHighlights risks={mockRisks} className="custom-class" />,
      );

      expect(
        container.querySelector(".risk-highlights.custom-class"),
      ).toBeInTheDocument();
    });

    it("should render Learn more buttons for risks with explanations", () => {
      render(<RiskHighlights risks={mockRisks} />);

      const learnMoreButtons = screen.getAllByRole("button", {
        name: /Learn more/i,
      });
      expect(learnMoreButtons).toHaveLength(3);
    });
  });

  describe("Empty State", () => {
    it("should render empty state when no risks", () => {
      render(<RiskHighlights risks={[]} />);

      expect(
        screen.getByText(/No significant privacy risks were identified/i),
      ).toBeInTheDocument();
    });

    it("should render checkmark icon in empty state", () => {
      render(<RiskHighlights risks={[]} />);

      expect(screen.getByText("✅")).toBeInTheDocument();
    });

    it("should render disclaimer in empty state", () => {
      render(<RiskHighlights risks={[]} />);

      expect(
        screen.getByText(/This doesn't guarantee the policy is perfect/i),
      ).toBeInTheDocument();
    });

    it("should render empty state subtext", () => {
      render(<RiskHighlights risks={[]} />);

      expect(
        screen.getByText(/no major concerns were detected/i),
      ).toBeInTheDocument();
    });

    it("should show title even in empty state", () => {
      render(<RiskHighlights risks={[]} />);

      expect(
        screen.getByText("Privacy Risks Identified"),
      ).toBeInTheDocument();
    });

    it("should not render Learn more buttons in empty state", () => {
      render(<RiskHighlights risks={[]} />);

      expect(
        screen.queryByRole("button", { name: /Learn more/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Risk Expansion", () => {
    it("should not show explanation details by default", () => {
      render(<RiskHighlights risks={mockRisks} />);

      expect(screen.queryByText("Why this matters:")).not.toBeInTheDocument();
      expect(
        screen.queryByText("This may include sensitive information"),
      ).not.toBeInTheDocument();
    });

    it("should expand risk when Learn more is clicked", () => {
      render(<RiskHighlights risks={mockRisks} />);

      const learnMoreButtons = screen.getAllByRole("button", {
        name: /Learn more/i,
      });
      fireEvent.click(learnMoreButtons[0]);

      expect(screen.getByText("Why this matters:")).toBeInTheDocument();
      expect(
        screen.getByText("This may include sensitive information"),
      ).toBeInTheDocument();
    });

    it("should show affected sections when expanded", () => {
      render(<RiskHighlights risks={mockRisks} />);

      const learnMoreButtons = screen.getAllByRole("button", {
        name: /Learn more/i,
      });
      fireEvent.click(learnMoreButtons[0]);

      expect(screen.getByText("Related sections:")).toBeInTheDocument();
      expect(screen.getByText("Section 1")).toBeInTheDocument();
      expect(screen.getByText("Section 2")).toBeInTheDocument();
    });

    it("should not show affected sections if empty", () => {
      render(<RiskHighlights risks={mockRisks} />);

      // Click on Data Retention (which has empty affectedSections)
      const learnMoreButtons = screen.getAllByRole("button", {
        name: /Learn more/i,
      });
      fireEvent.click(learnMoreButtons[2]);

      expect(screen.queryByText("Related sections:")).not.toBeInTheDocument();
    });

    it("should collapse risk when Show less is clicked", () => {
      render(<RiskHighlights risks={mockRisks} />);

      const learnMoreButtons = screen.getAllByRole("button", {
        name: /Learn more/i,
      });
      fireEvent.click(learnMoreButtons[0]);

      expect(screen.getByText("Why this matters:")).toBeInTheDocument();

      const showLessButton = screen.getByRole("button", {
        name: /Show less/i,
      });
      fireEvent.click(showLessButton);

      expect(screen.queryByText("Why this matters:")).not.toBeInTheDocument();
    });

    it("should update aria-expanded attribute", () => {
      render(<RiskHighlights risks={mockRisks} />);

      const learnMoreButtons = screen.getAllByRole("button", {
        name: /Learn more/i,
      });

      expect(learnMoreButtons[0]).toHaveAttribute("aria-expanded", "false");

      fireEvent.click(learnMoreButtons[0]);

      const showLessButton = screen.getByRole("button", {
        name: /Show less/i,
      });
      expect(showLessButton).toHaveAttribute("aria-expanded", "true");
    });

    it("should allow multiple risks to be expanded simultaneously", () => {
      render(<RiskHighlights risks={mockRisks} />);

      const learnMoreButtons = screen.getAllByRole("button", {
        name: /Learn more/i,
      });
      fireEvent.click(learnMoreButtons[0]);
      fireEvent.click(learnMoreButtons[1]);

      // Both explanations should be visible
      expect(
        screen.getByText("This may include sensitive information"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Your data may be sold to advertisers"),
      ).toBeInTheDocument();
    });

    it("should change button text from Learn more to Show less when expanded", () => {
      render(<RiskHighlights risks={mockRisks} />);

      const learnMoreButton = screen.getAllByRole("button", {
        name: /Learn more/i,
      })[0];

      expect(learnMoreButton).toHaveTextContent("Learn more →");

      fireEvent.click(learnMoreButton);

      const showLessButton = screen.getByRole("button", {
        name: /Show less/i,
      });
      expect(showLessButton).toHaveTextContent("Show less →");
    });
  });

  describe("Risk Sorting", () => {
    it("should sort risks by severity (higher risks first, then medium, then low)", () => {
      const unsortedRisks = [
        {
          title: "Low Severity Item",
          severity: "low",
          description: "Low severity",
          explanation: "Low explanation",
        },
        {
          title: "Medium Severity Item",
          severity: "medium",
          description: "Medium severity",
          explanation: "Medium explanation",
        },
        {
          title: "High Severity Item",
          severity: "high",
          description: "High severity",
          explanation: "High explanation",
        },
      ];

      const { container } = render(<RiskHighlights risks={unsortedRisks} />);

      // Query specifically for risk item titles using their class
      const riskTitles = container.querySelectorAll(".risk-item__title");

      // High/Critical risks should come first, then medium, then low
      expect(riskTitles[0]).toHaveTextContent("High Severity Item");
      expect(riskTitles[1]).toHaveTextContent("Medium Severity Item");
      expect(riskTitles[2]).toHaveTextContent("Low Severity Item");
    });
  });

  describe("Severity Styling", () => {
    it("should apply severity class to risk items", () => {
      const { container } = render(<RiskHighlights risks={mockRisks} />);

      expect(
        container.querySelector(".risk-item--high"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".risk-item--medium"),
      ).toBeInTheDocument();
      expect(container.querySelector(".risk-item--low")).toBeInTheDocument();
    });

    it("should apply correct severity class to severity badges", () => {
      const { container } = render(<RiskHighlights risks={mockRisks} />);

      expect(
        container.querySelector(".risk-item__severity--high"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".risk-item__severity--medium"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".risk-item__severity--low"),
      ).toBeInTheDocument();
    });

    it("should apply CSS custom property for risk color", () => {
      const { container } = render(<RiskHighlights risks={[mockRisks[0]]} />);

      const riskItem = container.querySelector(".risk-item");
      expect(riskItem).toHaveStyle({ "--risk-color": "var(--risk-high)" });
    });
  });

  describe("ReactMarkdown Integration", () => {
    it("should render explanation through ReactMarkdown", () => {
      render(<RiskHighlights risks={mockRisks} />);

      const learnMoreButtons = screen.getAllByRole("button", {
        name: /Learn more/i,
      });
      fireEvent.click(learnMoreButtons[0]);

      const markdown = screen.getByTestId("markdown");
      expect(markdown).toBeInTheDocument();
      expect(markdown).toHaveTextContent(
        "This may include sensitive information",
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined risks prop", () => {
      render(<RiskHighlights />);

      expect(
        screen.getByText(/No significant privacy risks were identified/i),
      ).toBeInTheDocument();
    });

    it("should handle null risks prop", () => {
      render(<RiskHighlights risks={null} />);

      expect(
        screen.getByText(/No significant privacy risks were identified/i),
      ).toBeInTheDocument();
    });

    it("should handle risks without explanation", () => {
      const riskWithoutExplanation = [
        {
          title: "Simple Risk",
          severity: "low",
          description: "Just a description",
        },
      ];

      render(<RiskHighlights risks={riskWithoutExplanation} />);

      expect(screen.getByText("Simple Risk")).toBeInTheDocument();
      expect(screen.getByText("Just a description")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Learn more/i }),
      ).not.toBeInTheDocument();
    });

    it("should handle unknown severity by defaulting to medium config", () => {
      const unknownSeverityRisk = [
        {
          title: "Unknown Severity",
          severity: "unknown",
          description: "Unknown severity level",
          explanation: "Test",
        },
      ];

      const { container } = render(
        <RiskHighlights risks={unknownSeverityRisk} />,
      );

      // Should default to medium severity styling
      expect(
        container.querySelector(".risk-item--unknown"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".risk-item__severity--unknown"),
      ).toBeInTheDocument();
    });

    it("should handle risk with empty string explanation", () => {
      const riskWithEmptyExplanation = [
        {
          title: "Empty Explanation",
          severity: "low",
          description: "Has empty explanation",
          explanation: "",
        },
      ];

      render(<RiskHighlights risks={riskWithEmptyExplanation} />);

      expect(
        screen.queryByRole("button", { name: /Learn more/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should use semantic heading levels", () => {
      render(<RiskHighlights risks={mockRisks} />);

      const mainTitle = screen.getByRole("heading", { level: 2 });
      expect(mainTitle).toHaveTextContent("Privacy Risks Identified");

      const riskTitles = screen.getAllByRole("heading", { level: 3 });
      expect(riskTitles).toHaveLength(3);
    });

    it("should use aria-hidden for decorative icons", () => {
      const { container } = render(<RiskHighlights risks={mockRisks} />);

      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it("should have proper button type attribute", () => {
      render(<RiskHighlights risks={mockRisks} />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("type", "button");
      });
    });

    it("should maintain aria-expanded state correctly", () => {
      render(<RiskHighlights risks={mockRisks} />);

      const buttons = screen.getAllByRole("button", { name: /Learn more/i });

      // All should start collapsed
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("aria-expanded", "false");
      });

      // Expand first risk
      fireEvent.click(buttons[0]);
      const showLessButton = screen.getByRole("button", {
        name: /Show less/i,
      });
      expect(showLessButton).toHaveAttribute("aria-expanded", "true");

      // Other risks should still be collapsed
      const remainingLearnMore = screen.getAllByRole("button", {
        name: /Learn more/i,
      });
      remainingLearnMore.forEach((button) => {
        expect(button).toHaveAttribute("aria-expanded", "false");
      });
    });
  });

  describe("CSS Class Structure", () => {
    it("should use card class", () => {
      const { container } = render(<RiskHighlights risks={mockRisks} />);

      expect(container.querySelector(".card")).toBeInTheDocument();
    });

    it("should use risk-highlights class", () => {
      const { container } = render(<RiskHighlights risks={mockRisks} />);

      expect(
        container.querySelector(".risk-highlights"),
      ).toBeInTheDocument();
    });

    it("should use card__header class", () => {
      const { container } = render(<RiskHighlights risks={mockRisks} />);

      expect(container.querySelector(".card__header")).toBeInTheDocument();
    });

    it("should use card__title class", () => {
      const { container } = render(<RiskHighlights risks={mockRisks} />);

      expect(container.querySelector(".card__title")).toBeInTheDocument();
    });

    it("should use card__subtitle class", () => {
      const { container } = render(<RiskHighlights risks={mockRisks} />);

      expect(container.querySelector(".card__subtitle")).toBeInTheDocument();
    });

    it("should use risk-list class", () => {
      const { container } = render(<RiskHighlights risks={mockRisks} />);

      expect(container.querySelector(".risk-list")).toBeInTheDocument();
    });

    it("should use risk-item classes", () => {
      const { container } = render(<RiskHighlights risks={mockRisks} />);

      expect(container.querySelector(".risk-item")).toBeInTheDocument();
      expect(
        container.querySelector(".risk-item__header"),
      ).toBeInTheDocument();
      expect(container.querySelector(".risk-item__title")).toBeInTheDocument();
      expect(
        container.querySelector(".risk-item__severity"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".risk-item__description"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".risk-item__expand"),
      ).toBeInTheDocument();
    });

    it("should use empty state classes", () => {
      const { container } = render(<RiskHighlights risks={[]} />);

      expect(
        container.querySelector(".risk-highlights__empty"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".risk-highlights__empty-icon"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".risk-highlights__empty-text"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".risk-highlights__empty-subtext"),
      ).toBeInTheDocument();
    });
  });
});
