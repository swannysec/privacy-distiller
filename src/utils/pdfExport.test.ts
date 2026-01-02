import { describe, it, expect, vi, beforeEach } from "vitest";
import { exportToPDF } from "./pdfExport";

// Mock jsPDF as a class constructor
vi.mock("jspdf", () => {
  class MockJsPDF {
    constructor() {
      this.internal = {
        pageSize: {
          getWidth: () => 210,
          getHeight: () => 297,
        },
      };
    }

    setFontSize = vi.fn();
    setTextColor = vi.fn();
    setFont = vi.fn();
    setDrawColor = vi.fn();
    text = vi.fn();
    line = vi.fn();
    splitTextToSize = vi.fn((text) => (text ? [text] : []));
    getTextWidth = vi.fn(() => 50);
    getNumberOfPages = vi.fn(() => 1);
    addPage = vi.fn();
    setPage = vi.fn();
    save = vi.fn();
  }

  return {
    jsPDF: MockJsPDF,
  };
});

describe("pdfExport", () => {
  let mockResult;

  beforeEach(() => {
    vi.clearAllMocks();

    mockResult = {
      documentMetadata: {
        source: "https://example.com/privacy-policy",
      },
      timestamp: new Date("2024-01-15T10:30:00Z"),
      scorecard: {
        overallScore: 72,
        overallGrade: "C",
        thirdPartySharing: {
          score: 6,
          summary: "Limited sharing with partners",
        },
        userRights: { score: 8, summary: "Good control options" },
        dataCollection: { score: 5, summary: "Collects significant data" },
        dataRetention: { score: 7, summary: "Reasonable retention periods" },
        purposeClarity: { score: 8, summary: "Clear explanations" },
        securityMeasures: { score: 7, summary: "Standard security measures" },
        policyTransparency: { score: 9, summary: "Well-written policy" },
        topConcerns: [
          "Data sharing with third parties",
          "Broad data collection",
        ],
        positiveAspects: ["Clear user rights", "Easy opt-out process"],
      },
      summary: {
        brief: "This is a brief summary.",
        detailed: "This is a detailed summary with more information.",
        full: "This is the full summary with all details about the privacy policy.",
      },
      risks: [
        {
          title: "Data Sharing",
          description: "Your data may be shared with advertising partners.",
          severity: "high",
        },
        {
          title: "Tracking",
          description: "Uses cookies for analytics.",
          severity: "medium",
        },
        {
          title: "Email Marketing",
          description: "May send promotional emails.",
          severity: "low",
        },
      ],
      keyTerms: [
        {
          term: "Personal Data",
          definition: "Information that identifies you directly or indirectly.",
        },
        {
          term: "Data Controller",
          definition: "The entity that determines how your data is processed.",
        },
      ],
    };
  });

  describe("exportToPDF", () => {
    it("should generate PDF without errors", async () => {
      await expect(exportToPDF(mockResult)).resolves.not.toThrow();
    });

    it("should handle result without scorecard", async () => {
      const resultWithoutScorecard = { ...mockResult, scorecard: null };
      await expect(exportToPDF(resultWithoutScorecard)).resolves.not.toThrow();
    });

    it("should handle result without risks", async () => {
      const resultWithoutRisks = { ...mockResult, risks: [] };
      await expect(exportToPDF(resultWithoutRisks)).resolves.not.toThrow();
    });

    it("should handle result without keyTerms", async () => {
      const resultWithoutTerms = { ...mockResult, keyTerms: [] };
      await expect(exportToPDF(resultWithoutTerms)).resolves.not.toThrow();
    });

    it("should handle result with minimal data", async () => {
      const minimalResult = {
        documentMetadata: { source: "test.pdf" },
        timestamp: new Date(),
        summary: { brief: "Test summary" },
      };
      await expect(exportToPDF(minimalResult)).resolves.not.toThrow();
    });

    it("should handle URL source correctly", async () => {
      await expect(exportToPDF(mockResult)).resolves.not.toThrow();
    });

    it("should handle PDF source correctly", async () => {
      const pdfResult = {
        ...mockResult,
        documentMetadata: { source: "document.pdf" },
      };
      await expect(exportToPDF(pdfResult)).resolves.not.toThrow();
    });

    it("should handle missing document metadata gracefully", async () => {
      const resultWithoutMeta = { ...mockResult, documentMetadata: null };
      await expect(exportToPDF(resultWithoutMeta)).resolves.not.toThrow();
    });

    it("should handle missing timestamp gracefully", async () => {
      const resultWithoutTimestamp = { ...mockResult, timestamp: null };
      await expect(exportToPDF(resultWithoutTimestamp)).resolves.not.toThrow();
    });

    it("should handle result with only brief summary", async () => {
      const resultWithBriefOnly = {
        ...mockResult,
        summary: { brief: "Only brief summary" },
      };
      await expect(exportToPDF(resultWithBriefOnly)).resolves.not.toThrow();
    });

    it("should handle result with only detailed summary", async () => {
      const resultWithDetailedOnly = {
        ...mockResult,
        summary: { detailed: "Only detailed summary" },
      };
      await expect(exportToPDF(resultWithDetailedOnly)).resolves.not.toThrow();
    });

    it("should handle result with no summary", async () => {
      const resultWithNoSummary = {
        ...mockResult,
        summary: {},
      };
      await expect(exportToPDF(resultWithNoSummary)).resolves.not.toThrow();
    });

    it("should handle result with critical severity risks", async () => {
      const resultWithCritical = {
        ...mockResult,
        risks: [
          {
            title: "Critical Issue",
            description: "Very bad",
            severity: "critical",
          },
        ],
      };
      await expect(exportToPDF(resultWithCritical)).resolves.not.toThrow();
    });

    it("should handle scorecard without top concerns", async () => {
      const resultNoTopConcerns = {
        ...mockResult,
        scorecard: { ...mockResult.scorecard, topConcerns: [] },
      };
      await expect(exportToPDF(resultNoTopConcerns)).resolves.not.toThrow();
    });

    it("should handle scorecard without positive aspects", async () => {
      const resultNoPositives = {
        ...mockResult,
        scorecard: { ...mockResult.scorecard, positiveAspects: [] },
      };
      await expect(exportToPDF(resultNoPositives)).resolves.not.toThrow();
    });

    it("should handle empty result object", async () => {
      const emptyResult = {};
      await expect(exportToPDF(emptyResult)).resolves.not.toThrow();
    });

    it("should handle result with undefined values", async () => {
      const undefinedResult = {
        documentMetadata: undefined,
        timestamp: undefined,
        scorecard: undefined,
        summary: undefined,
        risks: undefined,
        keyTerms: undefined,
      };
      await expect(exportToPDF(undefinedResult)).resolves.not.toThrow();
    });

    it("should handle various risk severities correctly", async () => {
      const multiSeverityRisks = {
        ...mockResult,
        risks: [
          { title: "Critical Risk", description: "Test", severity: "critical" },
          { title: "High Risk", description: "Test", severity: "high" },
          { title: "Medium Risk", description: "Test", severity: "medium" },
          { title: "Low Risk", description: "Test", severity: "low" },
          { title: "Unknown Risk", description: "Test", severity: "unknown" },
          { title: "No Severity", description: "Test" },
        ],
      };
      await expect(exportToPDF(multiSeverityRisks)).resolves.not.toThrow();
    });

    it("should handle scorecard without overallScore (calculate from categories)", async () => {
      const scorecardWithoutOverall = {
        ...mockResult,
        scorecard: {
          thirdPartySharing: { score: 8 },
          userRights: { score: 7 },
          dataCollection: { score: 6 },
          dataRetention: { score: 5 },
          purposeClarity: { score: 9 },
          securityMeasures: { score: 7 },
          policyTransparency: { score: 8 },
        },
      };
      await expect(exportToPDF(scorecardWithoutOverall)).resolves.not.toThrow();
    });

    it("should handle scorecard with missing category scores", async () => {
      const partialScorecard = {
        ...mockResult,
        scorecard: {
          thirdPartySharing: { score: 8 },
          userRights: {},
          dataCollection: { summary: "No score" },
        },
      };
      await expect(exportToPDF(partialScorecard)).resolves.not.toThrow();
    });

    it("should handle URL with www prefix", async () => {
      const wwwUrl = {
        ...mockResult,
        documentMetadata: { source: "https://www.google.com/privacy" },
      };
      await expect(exportToPDF(wwwUrl)).resolves.not.toThrow();
    });

    it("should handle invalid URL gracefully", async () => {
      const invalidUrl = {
        ...mockResult,
        documentMetadata: { source: "http://[invalid-url" },
      };
      await expect(exportToPDF(invalidUrl)).resolves.not.toThrow();
    });

    it("should handle markdown in summary", async () => {
      const markdownSummary = {
        ...mockResult,
        summary: {
          full: `## Overview
This is a **bold** statement and *italic* text.

### Key Points
- First bullet point
- Second bullet point
- Third **bold** bullet

1. First numbered item
2. Second numbered item

Regular paragraph with [link](https://example.com) and \`code\`.`,
        },
      };
      await expect(exportToPDF(markdownSummary)).resolves.not.toThrow();
    });

    it("should handle risks without titles", async () => {
      const risksNoTitle = {
        ...mockResult,
        risks: [
          { description: "Risk without title", severity: "high" },
          { title: "", description: "Empty title", severity: "medium" },
        ],
      };
      await expect(exportToPDF(risksNoTitle)).resolves.not.toThrow();
    });

    it("should handle risks without descriptions", async () => {
      const risksNoDesc = {
        ...mockResult,
        risks: [
          { title: "No Description Risk", severity: "high" },
          { title: "Empty Description", description: "", severity: "medium" },
        ],
      };
      await expect(exportToPDF(risksNoDesc)).resolves.not.toThrow();
    });

    it("should handle key terms without definitions", async () => {
      const termsNoDef = {
        ...mockResult,
        keyTerms: [
          { term: "No Definition" },
          { term: "Empty Definition", definition: "" },
          { definition: "No term name" },
        ],
      };
      await expect(exportToPDF(termsNoDef)).resolves.not.toThrow();
    });

    it("should handle very long content that spans multiple pages", async () => {
      const longContent = {
        ...mockResult,
        risks: Array(50)
          .fill(null)
          .map((_, i) => ({
            title: `Risk ${i + 1}`,
            description:
              "This is a long description that will help test page breaks and content overflow handling in the PDF generation process.",
            severity: i % 2 === 0 ? "high" : "low",
          })),
      };
      await expect(exportToPDF(longContent)).resolves.not.toThrow();
    });

    it("should handle Date object timestamp", async () => {
      const dateResult = {
        ...mockResult,
        timestamp: new Date("2024-06-15T14:30:00Z"),
      };
      await expect(exportToPDF(dateResult)).resolves.not.toThrow();
    });

    it("should handle string timestamp", async () => {
      const stringTimestamp = {
        ...mockResult,
        timestamp: "2024-06-15T14:30:00Z",
      };
      await expect(exportToPDF(stringTimestamp)).resolves.not.toThrow();
    });

    it("should handle all grade ranges", async () => {
      const grades = [
        { score: 97, grade: "A+" },
        { score: 95, grade: "A" },
        { score: 91, grade: "A-" },
        { score: 88, grade: "B+" },
        { score: 85, grade: "B" },
        { score: 81, grade: "B-" },
        { score: 78, grade: "C+" },
        { score: 74, grade: "C" },
        { score: 71, grade: "C-" },
        { score: 68, grade: "D+" },
        { score: 64, grade: "D" },
        { score: 61, grade: "D-" },
        { score: 50, grade: "F" },
      ];

      for (const { score } of grades) {
        const gradeResult = {
          ...mockResult,
          scorecard: { overallScore: score },
        };
        await expect(exportToPDF(gradeResult)).resolves.not.toThrow();
      }
    });

    it("should handle multiple pages in footer", async () => {
      // This tests the page numbering logic
      const longResult = {
        ...mockResult,
        risks: Array(30)
          .fill(null)
          .map((_, i) => ({
            title: `Risk ${i}`,
            description: "Long description ".repeat(10),
            severity: "high",
          })),
        keyTerms: Array(20)
          .fill(null)
          .map((_, i) => ({
            term: `Term ${i}`,
            definition: "Long definition ".repeat(10),
          })),
      };
      await expect(exportToPDF(longResult)).resolves.not.toThrow();
    });

    it("should handle empty source string", async () => {
      const emptySource = {
        ...mockResult,
        documentMetadata: { source: "" },
      };
      await expect(exportToPDF(emptySource)).resolves.not.toThrow();
    });

    it("should handle category scores at boundary values", async () => {
      const boundaryScores = {
        ...mockResult,
        scorecard: {
          thirdPartySharing: { score: 10 }, // High score
          userRights: { score: 7 }, // Mid-high
          dataCollection: { score: 4 }, // Mid-low
          dataRetention: { score: 1 }, // Low score
          purposeClarity: { score: 0 }, // Zero
          securityMeasures: { score: 5 }, // Boundary
          policyTransparency: { score: 3 }, // Below mid
        },
      };
      await expect(exportToPDF(boundaryScores)).resolves.not.toThrow();
    });
  });
});
