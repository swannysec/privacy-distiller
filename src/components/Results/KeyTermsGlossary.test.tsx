import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { KeyTermsGlossary } from "./KeyTermsGlossary";

interface KeyTerm {
  term: string;
  definition: string;
}

describe("KeyTermsGlossary", () => {
  const mockKeyTerms: KeyTerm[] = [
    {
      term: "PII",
      definition:
        "Personally Identifiable Information that can be used to identify an individual",
    },
    {
      term: "Cookie",
      definition: "A small piece of data stored on your browser",
    },
    {
      term: "Anonymization",
      definition: "The process of removing personally identifiable information",
    },
    {
      term: "GDPR",
      definition: "General Data Protection Regulation - EU privacy law",
    },
  ];

  beforeEach(() => {
    // Clear any mocks if needed
  });

  describe("Rendering with Terms", () => {
    it("should render title", () => {
      render(<KeyTermsGlossary keyTerms={mockKeyTerms} />);

      expect(screen.getByText("Key Terms Explained")).toBeInTheDocument();
    });

    it("should render subtitle when terms exist", () => {
      render(<KeyTermsGlossary keyTerms={mockKeyTerms} />);

      expect(
        screen.getByText("Important terms from the policy in plain language"),
      ).toBeInTheDocument();
    });

    it("should render all terms", () => {
      render(<KeyTermsGlossary keyTerms={mockKeyTerms} />);

      expect(screen.getByText("PII")).toBeInTheDocument();
      expect(screen.getByText("Cookie")).toBeInTheDocument();
      expect(screen.getByText("Anonymization")).toBeInTheDocument();
      expect(screen.getByText("GDPR")).toBeInTheDocument();
    });

    it("should render all definitions", () => {
      render(<KeyTermsGlossary keyTerms={mockKeyTerms} />);

      expect(
        screen.getByText(
          "Personally Identifiable Information that can be used to identify an individual",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText("A small piece of data stored on your browser"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "The process of removing personally identifiable information",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText("General Data Protection Regulation - EU privacy law"),
      ).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(
        <KeyTermsGlossary keyTerms={mockKeyTerms} className="custom-class" />,
      );

      expect(container.querySelector(".custom-class")).toBeInTheDocument();
    });

    it("should render terms in a grid", () => {
      const { container } = render(
        <KeyTermsGlossary keyTerms={mockKeyTerms} />,
      );

      const grid = container.querySelector(".terms-grid");
      expect(grid).toBeInTheDocument();

      const termItems = container.querySelectorAll(".term-item");
      expect(termItems.length).toBe(4);
    });

    it("should render term with correct structure", () => {
      const { container } = render(
        <KeyTermsGlossary keyTerms={mockKeyTerms} />,
      );

      const termItem = container.querySelector(".term-item");
      expect(termItem).toBeInTheDocument();

      const termWord = termItem!.querySelector(".term-item__word");
      expect(termWord).toBeInTheDocument();

      const termDefinition = termItem!.querySelector(".term-item__definition");
      expect(termDefinition).toBeInTheDocument();
    });

    it("should render card with correct classes", () => {
      const { container } = render(
        <KeyTermsGlossary keyTerms={mockKeyTerms} />,
      );

      const card = container.querySelector(".card.key-terms");
      expect(card).toBeInTheDocument();
    });

    it("should render card header", () => {
      const { container } = render(
        <KeyTermsGlossary keyTerms={mockKeyTerms} />,
      );

      const header = container.querySelector(".card__header");
      expect(header).toBeInTheDocument();
    });

    it("should render card title with icon", () => {
      render(<KeyTermsGlossary keyTerms={mockKeyTerms} />);

      expect(screen.getByText("📚")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should render empty state when no terms", () => {
      render(<KeyTermsGlossary keyTerms={[]} />);

      expect(
        screen.getByText(/No key terms were extracted from this policy/i),
      ).toBeInTheDocument();
    });

    it("should render title in empty state", () => {
      render(<KeyTermsGlossary keyTerms={[]} />);

      expect(screen.getByText("Key Terms Explained")).toBeInTheDocument();
    });

    it("should render book icon in empty state", () => {
      render(<KeyTermsGlossary keyTerms={[]} />);

      expect(screen.getByText("📖")).toBeInTheDocument();
    });

    it("should not render subtitle in empty state", () => {
      render(<KeyTermsGlossary keyTerms={[]} />);

      expect(
        screen.queryByText("Important terms from the policy in plain language"),
      ).not.toBeInTheDocument();
    });

    it("should not render terms grid in empty state", () => {
      const { container } = render(<KeyTermsGlossary keyTerms={[]} />);

      expect(container.querySelector(".terms-grid")).not.toBeInTheDocument();
    });

    it("should render empty state with correct classes", () => {
      const { container } = render(<KeyTermsGlossary keyTerms={[]} />);

      const emptyState = container.querySelector(".key-terms__empty");
      expect(emptyState).toBeInTheDocument();

      const emptyIcon = container.querySelector(".key-terms__empty-icon");
      expect(emptyIcon).toBeInTheDocument();

      const emptyText = container.querySelector(".key-terms__empty-text");
      expect(emptyText).toBeInTheDocument();
    });

    it("should handle undefined keyTerms", () => {
      render(<KeyTermsGlossary />);

      expect(
        screen.getByText(/No key terms were extracted from this policy/i),
      ).toBeInTheDocument();
    });

    it("should handle null keyTerms", () => {
      render(<KeyTermsGlossary keyTerms={null as unknown as KeyTerm[]} />);

      expect(
        screen.getByText(/No key terms were extracted from this policy/i),
      ).toBeInTheDocument();
    });
  });

  describe("Alphabetical Sorting", () => {
    it("should sort terms alphabetically", () => {
      const unsortedTerms: KeyTerm[] = [
        { term: "Zebra", definition: "Last animal" },
        { term: "Apple", definition: "First fruit" },
        { term: "Banana", definition: "Second fruit" },
        { term: "Mango", definition: "Third fruit" },
      ];

      const { container } = render(
        <KeyTermsGlossary keyTerms={unsortedTerms} />,
      );

      const termWords = container.querySelectorAll(".term-item__word");
      expect(termWords[0]).toHaveTextContent("Apple");
      expect(termWords[1]).toHaveTextContent("Banana");
      expect(termWords[2]).toHaveTextContent("Mango");
      expect(termWords[3]).toHaveTextContent("Zebra");
    });

    it("should handle case-insensitive sorting", () => {
      const mixedCaseTerms: KeyTerm[] = [
        { term: "zebra", definition: "lowercase z" },
        { term: "Apple", definition: "capital A" },
        { term: "banana", definition: "lowercase b" },
      ];

      const { container } = render(
        <KeyTermsGlossary keyTerms={mixedCaseTerms} />,
      );

      const termWords = container.querySelectorAll(".term-item__word");
      expect(termWords[0]).toHaveTextContent("Apple");
      expect(termWords[1]).toHaveTextContent("banana");
      expect(termWords[2]).toHaveTextContent("zebra");
    });

    it("should handle terms with missing term property", () => {
      const termsWithMissing = [
        { term: "Zebra", definition: "Has term" },
        { term: "", definition: "Empty term" },
        { definition: "No term property" } as KeyTerm,
        { term: "Apple", definition: "Has term" },
      ];

      const { container } = render(
        <KeyTermsGlossary keyTerms={termsWithMissing} />,
      );

      // Should not crash and should render terms that have valid term values
      const termWords = container.querySelectorAll(".term-item__word");
      expect(termWords.length).toBe(4);
    });

    it("should maintain original order for identical terms", () => {
      const duplicateTerms: KeyTerm[] = [
        { term: "Same", definition: "First definition" },
        { term: "Same", definition: "Second definition" },
        { term: "Same", definition: "Third definition" },
      ];

      const { container } = render(
        <KeyTermsGlossary keyTerms={duplicateTerms} />,
      );

      const termDefinitions = container.querySelectorAll(
        ".term-item__definition",
      );
      expect(termDefinitions[0]).toHaveTextContent("First definition");
      expect(termDefinitions[1]).toHaveTextContent("Second definition");
      expect(termDefinitions[2]).toHaveTextContent("Third definition");
    });
  });

  describe("Accessibility", () => {
    it("should have aria-hidden on decorative icons", () => {
      const { container } = render(
        <KeyTermsGlossary keyTerms={mockKeyTerms} />,
      );

      // Title icon
      const titleIcon = container.querySelector(
        '.card__title span[aria-hidden="true"]',
      );
      expect(titleIcon).toBeInTheDocument();
      expect(titleIcon).toHaveTextContent("📚");
    });

    it("should have aria-hidden on empty state icon", () => {
      const { container } = render(<KeyTermsGlossary keyTerms={[]} />);

      const emptyIcon = container.querySelector(
        '.key-terms__empty-icon[aria-hidden="true"]',
      );
      expect(emptyIcon).toBeInTheDocument();
      expect(emptyIcon).toHaveTextContent("📖");
    });

    it("should use semantic HTML headings", () => {
      render(<KeyTermsGlossary keyTerms={mockKeyTerms} />);

      // Main title should be h2
      const mainTitle = screen.getByRole("heading", {
        level: 2,
        name: /Key Terms Explained/,
      });
      expect(mainTitle).toBeInTheDocument();
    });

    it("should use h3 for term names", () => {
      render(<KeyTermsGlossary keyTerms={mockKeyTerms} />);

      const termHeadings = screen.getAllByRole("heading", { level: 3 });
      expect(termHeadings.length).toBe(4);
      expect(termHeadings[0]).toHaveTextContent("Anonymization");
      expect(termHeadings[1]).toHaveTextContent("Cookie");
      expect(termHeadings[2]).toHaveTextContent("GDPR");
      expect(termHeadings[3]).toHaveTextContent("PII");
    });
  });

  describe("Edge Cases", () => {
    it("should handle single term", () => {
      render(<KeyTermsGlossary keyTerms={[mockKeyTerms[0]]} />);

      expect(screen.getByText("PII")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Personally Identifiable Information that can be used to identify an individual",
        ),
      ).toBeInTheDocument();
    });

    it("should handle very long term names", () => {
      const longTerms: KeyTerm[] = [
        {
          term: "Very Long Term Name That Should Still Display Correctly",
          definition: "Definition",
        },
      ];

      render(<KeyTermsGlossary keyTerms={longTerms} />);

      expect(
        screen.getByText(
          "Very Long Term Name That Should Still Display Correctly",
        ),
      ).toBeInTheDocument();
    });

    it("should handle very long definitions", () => {
      const longDefTerms: KeyTerm[] = [
        {
          term: "Term",
          definition:
            "This is a very long definition that goes on and on and contains lots of information about the term and should still be displayed correctly without breaking the layout or causing any rendering issues in the component.",
        },
      ];

      render(<KeyTermsGlossary keyTerms={longDefTerms} />);

      expect(
        screen.getByText(/This is a very long definition that goes on and on/),
      ).toBeInTheDocument();
    });

    it("should handle terms with special characters", () => {
      const specialTerms: KeyTerm[] = [
        {
          term: "Term & Special <Characters>",
          definition: "Definition with \"quotes\" and 'apostrophes'",
        },
      ];

      render(<KeyTermsGlossary keyTerms={specialTerms} />);

      expect(
        screen.getByText("Term & Special <Characters>"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Definition with \"quotes\" and 'apostrophes'"),
      ).toBeInTheDocument();
    });

    it("should handle empty term string", () => {
      const emptyStringTerms: KeyTerm[] = [
        { term: "", definition: "Definition with empty term" },
        { term: "Valid", definition: "Valid definition" },
      ];

      const { container } = render(
        <KeyTermsGlossary keyTerms={emptyStringTerms} />,
      );

      const termItems = container.querySelectorAll(".term-item");
      expect(termItems.length).toBe(2);
    });

    it("should handle empty definition string", () => {
      const emptyDefTerms: KeyTerm[] = [
        { term: "Term", definition: "" },
        { term: "Valid", definition: "Valid definition" },
      ];

      const { container } = render(
        <KeyTermsGlossary keyTerms={emptyDefTerms} />,
      );

      const termItems = container.querySelectorAll(".term-item");
      expect(termItems.length).toBe(2);
    });

    it("should handle non-array keyTerms gracefully", () => {
      render(
        <KeyTermsGlossary keyTerms={"not an array" as unknown as KeyTerm[]} />,
      );

      expect(
        screen.getByText(/No key terms were extracted from this policy/i),
      ).toBeInTheDocument();
    });
  });

  describe("Component Structure", () => {
    it("should render with default className when none provided", () => {
      const { container } = render(
        <KeyTermsGlossary keyTerms={mockKeyTerms} />,
      );

      const card = container.querySelector(".card.key-terms");
      expect(card).toBeInTheDocument();
      // Should have class attribute but empty className prop
      expect(card?.className).toContain("card");
      expect(card?.className).toContain("key-terms");
    });

    it("should combine custom className with default classes", () => {
      const { container } = render(
        <KeyTermsGlossary
          keyTerms={mockKeyTerms}
          className="my-custom-class"
        />,
      );

      const card = container.querySelector(".card.key-terms.my-custom-class");
      expect(card).toBeInTheDocument();
    });

    it("should render correct number of term items", () => {
      const { container } = render(
        <KeyTermsGlossary keyTerms={mockKeyTerms} />,
      );

      const termItems = container.querySelectorAll(".term-item");
      expect(termItems.length).toBe(mockKeyTerms.length);
    });

    it("should use consistent key for term items", () => {
      const { rerender, container } = render(
        <KeyTermsGlossary keyTerms={mockKeyTerms} />,
      );

      const firstRenderItems = container.querySelectorAll(".term-item");

      // Re-render with same data
      rerender(<KeyTermsGlossary keyTerms={mockKeyTerms} />);

      const secondRenderItems = container.querySelectorAll(".term-item");

      expect(firstRenderItems.length).toBe(secondRenderItems.length);
    });
  });
});
