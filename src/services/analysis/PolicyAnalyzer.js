/**
 * @file Policy Analyzer Service
 * @description Main service for analyzing privacy policies
 */

import { LLMProviderFactory } from '../llm/LLMProviderFactory.js';
import { PromptTemplates } from './PromptTemplates.js';
import { ResponseParser } from './ResponseParser.js';
import { TextPreprocessor } from '../document/TextPreprocessor.js';
import { generateId } from '../../utils/helpers.js';

export class PolicyAnalyzer {
  /**
   * @param {import('../../types').LLMConfig} config - LLM configuration
   */
  constructor(config) {
    this.provider = LLMProviderFactory.createProvider(config);
    this.config = config;
  }

  /**
   * Analyzes a privacy policy document
   * @param {string} text - Policy text
   * @param {Function} progressCallback - Progress callback
   * @returns {Promise<import('../../types').AnalysisResult>} Analysis result
   */
  async analyze(text, progressCallback) {
    // Preprocess text
    const processedText = TextPreprocessor.preprocess(text);
    const truncatedText = TextPreprocessor.truncate(processedText);

    try {
      // Generate brief summary
      if (progressCallback) {
        progressCallback(40, 'Generating brief summary...');
      }
      const briefPrompt = PromptTemplates.briefSummary(truncatedText);
      const briefResponse = await this.provider.complete(briefPrompt);
      const briefSummary = ResponseParser.cleanResponse(briefResponse);

      // Generate detailed summary
      if (progressCallback) {
        progressCallback(55, 'Generating detailed summary...');
      }
      const detailedPrompt = PromptTemplates.detailedSummary(truncatedText);
      const detailedResponse = await this.provider.complete(detailedPrompt);
      const detailedSummary = ResponseParser.cleanResponse(detailedResponse);

      // Identify privacy risks
      if (progressCallback) {
        progressCallback(70, 'Identifying privacy risks...');
      }
      const risksPrompt = PromptTemplates.privacyRisks(truncatedText);
      const risksResponse = await this.provider.complete(risksPrompt);
      const risks = ResponseParser.parseRisks(risksResponse);

      // Extract key terms
      if (progressCallback) {
        progressCallback(85, 'Extracting key terms...');
      }
      const termsPrompt = PromptTemplates.keyTerms(truncatedText);
      const termsResponse = await this.provider.complete(termsPrompt);
      const keyTerms = ResponseParser.parseKeyTerms(termsResponse);

      // Build result
      const result = {
        id: generateId(),
        summaries: [
          {
            type: 'brief',
            content: briefSummary,
            keyPoints: ResponseParser.extractKeyPoints(briefSummary),
          },
          {
            type: 'detailed',
            content: detailedSummary,
            keyPoints: ResponseParser.extractKeyPoints(detailedSummary),
          },
          {
            type: 'full',
            content: processedText,
            keyPoints: [],
          },
        ],
        risks,
        keyTerms,
        timestamp: new Date(),
        llmConfig: this.config,
      };

      return result;

    } catch (error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyzes specific aspects of a policy
   * @param {string} text - Policy text
   * @param {string[]} aspects - Aspects to analyze (e.g., ['data_collection', 'data_sharing'])
   * @returns {Promise<Object>} Aspect-specific analysis
   */
  async analyzeAspects(text, aspects) {
    const processedText = TextPreprocessor.preprocess(text);
    const truncatedText = TextPreprocessor.truncate(processedText);
    const results = {};

    for (const aspect of aspects) {
      let prompt;

      switch (aspect) {
        case 'data_collection':
          prompt = PromptTemplates.dataCollection(truncatedText);
          break;
        case 'data_sharing':
          prompt = PromptTemplates.dataSharing(truncatedText);
          break;
        case 'user_rights':
          prompt = PromptTemplates.userRights(truncatedText);
          break;
        default:
          continue;
      }

      const response = await this.provider.complete(prompt);
      results[aspect] = ResponseParser.cleanResponse(response);
    }

    return results;
  }
}
