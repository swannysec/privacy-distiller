import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportToPDF } from './pdfExport';

// Mock jsPDF as a class constructor
vi.mock('jspdf', () => {
  class MockJsPDF {
    constructor() {
      this.internal = {
        pageSize: {
          getWidth: () => 210,
          getHeight: () => 297,
        },
        getNumberOfPages: () => 1,
      };
    }

    setFontSize = vi.fn();
    setTextColor = vi.fn();
    setFont = vi.fn();
    setDrawColor = vi.fn();
    text = vi.fn();
    line = vi.fn();
    splitTextToSize = vi.fn((text) => [text]);
    getTextWidth = vi.fn(() => 50);
    addPage = vi.fn();
    setPage = vi.fn();
    save = vi.fn();
  }

  return {
    jsPDF: MockJsPDF,
  };
});

describe('pdfExport', () => {
  let mockResult;

  beforeEach(() => {
    vi.clearAllMocks();

    mockResult = {
      documentMetadata: {
        source: 'https://example.com/privacy-policy',
      },
      timestamp: new Date('2024-01-15T10:30:00Z'),
      scorecard: {
        overallScore: 72,
        overallGrade: 'C',
        thirdPartySharing: { score: 6, summary: 'Limited sharing with partners' },
        userRights: { score: 8, summary: 'Good control options' },
        dataCollection: { score: 5, summary: 'Collects significant data' },
        dataRetention: { score: 7, summary: 'Reasonable retention periods' },
        purposeClarity: { score: 8, summary: 'Clear explanations' },
        securityMeasures: { score: 7, summary: 'Standard security measures' },
        policyTransparency: { score: 9, summary: 'Well-written policy' },
        topConcerns: ['Data sharing with third parties', 'Broad data collection'],
        positiveAspects: ['Clear user rights', 'Easy opt-out process'],
      },
      summary: {
        brief: 'This is a brief summary.',
        detailed: 'This is a detailed summary with more information.',
        full: 'This is the full summary with all details about the privacy policy.',
      },
      risks: [
        {
          title: 'Data Sharing',
          description: 'Your data may be shared with advertising partners.',
          severity: 'high',
        },
        {
          title: 'Tracking',
          description: 'Uses cookies for analytics.',
          severity: 'medium',
        },
        {
          title: 'Email Marketing',
          description: 'May send promotional emails.',
          severity: 'low',
        },
      ],
      keyTerms: [
        {
          term: 'Personal Data',
          definition: 'Information that identifies you directly or indirectly.',
        },
        {
          term: 'Data Controller',
          definition: 'The entity that determines how your data is processed.',
        },
      ],
    };
  });

  describe('exportToPDF', () => {
    it('should generate PDF without errors', () => {
      expect(() => exportToPDF(mockResult)).not.toThrow();
    });

    it('should handle result without scorecard', () => {
      const resultWithoutScorecard = { ...mockResult, scorecard: null };
      expect(() => exportToPDF(resultWithoutScorecard)).not.toThrow();
    });

    it('should handle result without risks', () => {
      const resultWithoutRisks = { ...mockResult, risks: [] };
      expect(() => exportToPDF(resultWithoutRisks)).not.toThrow();
    });

    it('should handle result without keyTerms', () => {
      const resultWithoutTerms = { ...mockResult, keyTerms: [] };
      expect(() => exportToPDF(resultWithoutTerms)).not.toThrow();
    });

    it('should handle result with minimal data', () => {
      const minimalResult = {
        documentMetadata: { source: 'test.pdf' },
        timestamp: new Date(),
        summary: { brief: 'Test summary' },
      };
      expect(() => exportToPDF(minimalResult)).not.toThrow();
    });

    it('should handle URL source correctly', () => {
      expect(() => exportToPDF(mockResult)).not.toThrow();
    });

    it('should handle PDF source correctly', () => {
      const pdfResult = {
        ...mockResult,
        documentMetadata: { source: 'document.pdf' },
      };
      expect(() => exportToPDF(pdfResult)).not.toThrow();
    });

    it('should handle missing document metadata gracefully', () => {
      const resultWithoutMeta = { ...mockResult, documentMetadata: null };
      expect(() => exportToPDF(resultWithoutMeta)).not.toThrow();
    });

    it('should handle missing timestamp gracefully', () => {
      const resultWithoutTimestamp = { ...mockResult, timestamp: null };
      expect(() => exportToPDF(resultWithoutTimestamp)).not.toThrow();
    });

    it('should handle result with only brief summary', () => {
      const resultWithBriefOnly = {
        ...mockResult,
        summary: { brief: 'Only brief summary' },
      };
      expect(() => exportToPDF(resultWithBriefOnly)).not.toThrow();
    });

    it('should handle result with critical severity risks', () => {
      const resultWithCritical = {
        ...mockResult,
        risks: [{ title: 'Critical Issue', description: 'Very bad', severity: 'critical' }],
      };
      expect(() => exportToPDF(resultWithCritical)).not.toThrow();
    });

    it('should handle scorecard without top concerns', () => {
      const resultNoTopConcerns = {
        ...mockResult,
        scorecard: { ...mockResult.scorecard, topConcerns: [] },
      };
      expect(() => exportToPDF(resultNoTopConcerns)).not.toThrow();
    });

    it('should handle scorecard without positive aspects', () => {
      const resultNoPositives = {
        ...mockResult,
        scorecard: { ...mockResult.scorecard, positiveAspects: [] },
      };
      expect(() => exportToPDF(resultNoPositives)).not.toThrow();
    });

    it('should handle empty result object', () => {
      const emptyResult = {};
      expect(() => exportToPDF(emptyResult)).not.toThrow();
    });

    it('should handle result with undefined values', () => {
      const undefinedResult = {
        documentMetadata: undefined,
        timestamp: undefined,
        scorecard: undefined,
        summary: undefined,
        risks: undefined,
        keyTerms: undefined,
      };
      expect(() => exportToPDF(undefinedResult)).not.toThrow();
    });
  });
});
