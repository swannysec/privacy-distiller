/**
 * @file Analysis Orchestration hook
 * @description Orchestrates the full analysis process
 */

import { useCallback } from 'react';
import { useAnalysis } from '../contexts/AnalysisContext.jsx';
import { useDocumentExtractor } from './useDocumentExtractor.js';
import { useLLMProvider } from './useLLMProvider.js';
import { generateId } from '../utils/helpers.js';

/**
 * Hook for orchestrating document analysis
 * @returns {Object} Analysis orchestration utilities
 */
export function useAnalysisOrchestrator() {
  const analysis = useAnalysis();
  const extractor = useDocumentExtractor();
  const llm = useLLMProvider();

  /**
   * Analyzes a document from URL
   * @param {string} url - Document URL
   */
  const analyzeUrl = useCallback(async (url) => {
    try {
      // Set document input
      analysis.setDocumentInput({
        source: 'url',
        url,
      });

      // Start analysis
      analysis.startAnalysis();
      analysis.updateProgress(10, 'Fetching document from URL...');

      // Extract text
      const rawText = await extractor.extractFromUrl(url);

      analysis.updateProgress(30, 'Document text extracted successfully');

      // Update document with extracted text
      analysis.setDocumentInput({
        source: 'url',
        url,
        rawText,
      });

      // Begin LLM analysis
      analysis.setAnalyzing();
      analysis.updateProgress(40, 'Generating privacy policy summary...');

      // Create prompts for different summary types
      const briefPrompt = createBriefSummaryPrompt(rawText);
      const detailedPrompt = createDetailedSummaryPrompt(rawText);
      const risksPrompt = createRisksPrompt(rawText);
      const termsPrompt = createKeyTermsPrompt(rawText);

      // Execute analysis in sequence
      analysis.updateProgress(50, 'Analyzing privacy risks...');
      const [briefSummary, detailedSummary, risksText, termsText] = await Promise.all([
        llm.complete(briefPrompt),
        llm.complete(detailedPrompt),
        llm.complete(risksPrompt),
        llm.complete(termsPrompt),
      ]);

      analysis.updateProgress(90, 'Processing results...');

      // Parse results
      const risks = parseRisks(risksText);
      const keyTerms = parseKeyTerms(termsText);

      const result = {
        id: generateId(),
        document: {
          source: 'url',
          url,
          rawText,
        },
        summaries: [
          {
            type: 'brief',
            content: briefSummary,
            keyPoints: extractKeyPoints(briefSummary),
          },
          {
            type: 'detailed',
            content: detailedSummary,
            keyPoints: extractKeyPoints(detailedSummary),
          },
          {
            type: 'full',
            content: rawText,
            keyPoints: [],
          },
        ],
        risks,
        keyTerms,
        timestamp: new Date(),
        llmConfig: llm.config,
      };

      // Complete analysis
      analysis.completeAnalysis(result);

    } catch (err) {
      analysis.setError(err.message || 'Failed to analyze document');
    }
  }, [analysis, extractor, llm]);

  /**
   * Analyzes a PDF file
   * @param {File} file - PDF file
   */
  const analyzePdf = useCallback(async (file) => {
    try {
      // Set document input
      analysis.setDocumentInput({
        source: 'pdf',
        file,
      });

      // Start analysis
      analysis.startAnalysis();
      analysis.updateProgress(10, 'Reading PDF file...');

      // Extract text
      const rawText = await extractor.extractFromPdf(file);

      analysis.updateProgress(30, 'PDF text extracted successfully');

      // Update document with extracted text
      analysis.setDocumentInput({
        source: 'pdf',
        file,
        rawText,
      });

      // Begin LLM analysis
      analysis.setAnalyzing();
      analysis.updateProgress(40, 'Generating privacy policy summary...');

      // Create prompts
      const briefPrompt = createBriefSummaryPrompt(rawText);
      const detailedPrompt = createDetailedSummaryPrompt(rawText);
      const risksPrompt = createRisksPrompt(rawText);
      const termsPrompt = createKeyTermsPrompt(rawText);

      // Execute analysis
      analysis.updateProgress(50, 'Analyzing privacy risks...');
      const [briefSummary, detailedSummary, risksText, termsText] = await Promise.all([
        llm.complete(briefPrompt),
        llm.complete(detailedPrompt),
        llm.complete(risksPrompt),
        llm.complete(termsPrompt),
      ]);

      analysis.updateProgress(90, 'Processing results...');

      // Parse results
      const risks = parseRisks(risksText);
      const keyTerms = parseKeyTerms(termsText);

      const result = {
        id: generateId(),
        document: {
          source: 'pdf',
          file: { name: file.name, size: file.size, type: file.type },
          rawText,
        },
        summaries: [
          {
            type: 'brief',
            content: briefSummary,
            keyPoints: extractKeyPoints(briefSummary),
          },
          {
            type: 'detailed',
            content: detailedSummary,
            keyPoints: extractKeyPoints(detailedSummary),
          },
          {
            type: 'full',
            content: rawText,
            keyPoints: [],
          },
        ],
        risks,
        keyTerms,
        timestamp: new Date(),
        llmConfig: llm.config,
      };

      // Complete analysis
      analysis.completeAnalysis(result);

    } catch (err) {
      analysis.setError(err.message || 'Failed to analyze PDF');
    }
  }, [analysis, extractor, llm]);

  return {
    analyzeUrl,
    analyzePdf,
    ...analysis,
  };
}

// Helper functions for creating prompts

function createBriefSummaryPrompt(text) {
  return `Analyze this privacy policy and provide a brief summary (3-5 sentences) in plain language that a layperson can understand. Focus on the most important aspects.

Privacy Policy:
${text}

Brief Summary:`;
}

function createDetailedSummaryPrompt(text) {
  return `Analyze this privacy policy and provide a detailed summary in plain language. Break down the key sections and explain what they mean for the user. Make it clear and accessible.

Privacy Policy:
${text}

Detailed Summary:`;
}

function createRisksPrompt(text) {
  return `Analyze this privacy policy and identify privacy risks for users. For each risk, provide:
- Title (brief description)
- Description (what the risk means)
- Severity (low, medium, high, or critical)
- Location (which section)
- Recommendation (what users should know)

Format as JSON array with this structure:
[{"title": "...", "description": "...", "severity": "...", "location": "...", "recommendation": "..."}]

Privacy Policy:
${text}

Privacy Risks (JSON):`;
}

function createKeyTermsPrompt(text) {
  return `Extract key terms and technical jargon from this privacy policy and provide plain language definitions. Format as JSON array:
[{"term": "...", "definition": "...", "location": "..."}]

Privacy Policy:
${text}

Key Terms (JSON):`;
}

// Helper functions for parsing LLM responses

function parseRisks(text) {
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const risks = JSON.parse(jsonMatch[0]);
      return risks.map((risk, index) => ({
        id: generateId(),
        ...risk,
      }));
    }
  } catch {
    // Parsing failed, return empty array
  }
  return [];
}

function parseKeyTerms(text) {
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Parsing failed, return empty array
  }
  return [];
}

function extractKeyPoints(summary) {
  // Extract bullet points or numbered items
  const points = summary.match(/^[-•*]\s+(.+)$/gm) || [];
  return points.map(point => point.replace(/^[-•*]\s+/, '').trim());
}
