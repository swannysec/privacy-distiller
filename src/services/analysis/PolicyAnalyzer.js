/**
 * @file Policy Analyzer Service
 * @description Main service for analyzing privacy policies
 */

import { LLMProviderFactory } from "../llm/LLMProviderFactory.js";
import { PromptTemplates } from "./PromptTemplates.js";
import { ResponseParser } from "./ResponseParser.js";
import { TextPreprocessor } from "../document/TextPreprocessor.js";
import { generateId } from "../../utils/helpers.js";

export class PolicyAnalyzer {
  /**
   * @param {import('../../types').LLMConfig} config - LLM configuration
   * @param {Object} [provider] - Optional pre-configured LLM provider (for dependency injection)
   */
  constructor(config, provider = null) {
    this.provider = provider || LLMProviderFactory.createProvider(config);
    this.config = config;
  }

  /**
   * Factory method for dependency injection - creates PolicyAnalyzer with external provider
   * @param {Object} provider - Pre-configured LLM provider instance
   * @param {import('../../types').LLMConfig} config - LLM configuration
   * @returns {PolicyAnalyzer} Configured PolicyAnalyzer instance
   */
  static withProvider(provider, config) {
    return new PolicyAnalyzer(config, provider);
  }

  /**
   * Analyzes a privacy policy document
   * @param {string} text - Policy text
   * @param {Function} progressCallback - Progress callback
   * @returns {Promise<import('../../types').AnalysisResult>} Analysis result
   */
  async analyze(text, progressCallback, useParallel = true) {
    // Preprocess text
    const processedText = TextPreprocessor.preprocess(text);
    const truncatedText = TextPreprocessor.truncate(processedText);

    try {
      if (useParallel) {
        return await this._analyzeParallel(truncatedText, processedText, progressCallback);
      } else {
        return await this._analyzeSequential(truncatedText, processedText, progressCallback);
      }
    } catch (error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  /**
   * Parallel analysis with Promise.allSettled for graceful degradation
   * @private
   */
  async _analyzeParallel(truncatedText, processedText, progressCallback) {
    if (progressCallback) {
      progressCallback(40, "Analyzing policy in parallel...");
    }

    // Create all prompts
    const briefPrompt = PromptTemplates.briefSummary(truncatedText);
    const detailedPrompt = PromptTemplates.detailedSummary(truncatedText);
    const fullPrompt = PromptTemplates.fullAnalysis(truncatedText);
    const risksPrompt = PromptTemplates.privacyRisks(truncatedText);
    const termsPrompt = PromptTemplates.keyTerms(truncatedText);
    const scorecardPrompt = PromptTemplates.privacyScorecard(truncatedText);

    // Execute all requests in parallel with graceful degradation
    const results = await Promise.allSettled([
      this.provider.complete(briefPrompt),
      this.provider.complete(detailedPrompt),
      this.provider.complete(fullPrompt),
      this.provider.complete(risksPrompt),
      this.provider.complete(termsPrompt),
      this.provider.complete(scorecardPrompt),
    ]);

    if (progressCallback) {
      progressCallback(90, "Processing results...");
    }

    // Process results with graceful degradation
    const briefSummary = results[0].status === 'fulfilled'
      ? ResponseParser.cleanResponse(results[0].value)
      : "Brief summary unavailable due to an error.";

    const detailedSummary = results[1].status === 'fulfilled'
      ? ResponseParser.cleanResponse(results[1].value)
      : "Detailed summary unavailable due to an error.";

    const fullAnalysis = results[2].status === 'fulfilled'
      ? ResponseParser.cleanResponse(results[2].value)
      : "Full analysis unavailable due to an error.";

    const risks = results[3].status === 'fulfilled'
      ? ResponseParser.parseRisks(results[3].value)
      : [];

    const keyTerms = results[4].status === 'fulfilled'
      ? ResponseParser.parseKeyTerms(results[4].value)
      : [];

    const scorecard = results[5].status === 'fulfilled'
      ? ResponseParser.parseScorecard(results[5].value)
      : null;

    // Track partial failures
    const partialFailures = [];
    const sectionNames = ['brief summary', 'detailed summary', 'full analysis', 'privacy risks', 'key terms', 'privacy scorecard'];
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        partialFailures.push({
          section: sectionNames[index],
          error: result.reason?.message || 'Unknown error',
        });
      }
    });

    // Build result
    return {
      id: generateId(),
      summaries: [
        {
          type: "brief",
          content: briefSummary,
          keyPoints: ResponseParser.extractKeyPoints(briefSummary),
        },
        {
          type: "detailed",
          content: detailedSummary,
          keyPoints: ResponseParser.extractKeyPoints(detailedSummary),
        },
        {
          type: "full",
          content: fullAnalysis,
          keyPoints: ResponseParser.extractKeyPoints(fullAnalysis),
        },
      ],
      risks,
      keyTerms,
      scorecard,
      timestamp: new Date(),
      llmConfig: this.config,
      partialFailures,
      hasPartialFailures: partialFailures.length > 0,
    };
  }

  /**
   * Sequential analysis with progress callbacks (original implementation)
   * @private
   */
  async _analyzeSequential(truncatedText, processedText, progressCallback) {
    // Generate brief summary
    if (progressCallback) {
      progressCallback(35, "Generating brief summary...");
    }
    const briefPrompt = PromptTemplates.briefSummary(truncatedText);
    const briefResponse = await this.provider.complete(briefPrompt);
    const briefSummary = ResponseParser.cleanResponse(briefResponse);

    // Generate detailed summary
    if (progressCallback) {
      progressCallback(45, "Generating detailed summary...");
    }
    const detailedPrompt = PromptTemplates.detailedSummary(truncatedText);
    const detailedResponse = await this.provider.complete(detailedPrompt);
    const detailedSummary = ResponseParser.cleanResponse(detailedResponse);

    // Generate full analysis
    if (progressCallback) {
      progressCallback(55, "Generating comprehensive analysis...");
    }
    const fullPrompt = PromptTemplates.fullAnalysis(truncatedText);
    const fullResponse = await this.provider.complete(fullPrompt);
    const fullAnalysis = ResponseParser.cleanResponse(fullResponse);

    // Identify privacy risks
    if (progressCallback) {
      progressCallback(68, "Identifying privacy risks...");
    }
    const risksPrompt = PromptTemplates.privacyRisks(truncatedText);
    const risksResponse = await this.provider.complete(risksPrompt);
    const risks = ResponseParser.parseRisks(risksResponse);

    // Extract key terms
    if (progressCallback) {
      progressCallback(78, "Extracting key terms...");
    }
    const termsPrompt = PromptTemplates.keyTerms(truncatedText);
    const termsResponse = await this.provider.complete(termsPrompt);
    const keyTerms = ResponseParser.parseKeyTerms(termsResponse);

    // Generate privacy scorecard
    if (progressCallback) {
      progressCallback(88, "Calculating privacy scorecard...");
    }
    const scorecardPrompt = PromptTemplates.privacyScorecard(truncatedText);
    const scorecardResponse = await this.provider.complete(scorecardPrompt);
    const scorecard = ResponseParser.parseScorecard(scorecardResponse);

    // Build result
    return {
      id: generateId(),
      summaries: [
        {
          type: "brief",
          content: briefSummary,
          keyPoints: ResponseParser.extractKeyPoints(briefSummary),
        },
        {
          type: "detailed",
          content: detailedSummary,
          keyPoints: ResponseParser.extractKeyPoints(detailedSummary),
        },
        {
          type: "full",
          content: fullAnalysis,
          keyPoints: ResponseParser.extractKeyPoints(fullAnalysis),
        },
      ],
      risks,
      keyTerms,
      scorecard,
      timestamp: new Date(),
      llmConfig: this.config,
    };
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
        case "data_collection":
          prompt = PromptTemplates.dataCollection(truncatedText);
          break;
        case "data_sharing":
          prompt = PromptTemplates.dataSharing(truncatedText);
          break;
        case "user_rights":
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
