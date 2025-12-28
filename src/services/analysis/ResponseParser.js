/**
 * @file Response Parser
 * @description Parses LLM responses into structured data
 */

import { generateId } from '../../utils/helpers.js';

export class ResponseParser {
  /**
   * Parses privacy risks from LLM response
   * @param {string} responseText - LLM response
   * @returns {import('../../types').PrivacyRisk[]} Parsed risks
   */
  static parseRisks(responseText) {
    try {
      // Try to extract JSON array from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);

      if (!jsonMatch) {
        return [];
      }

      const risks = JSON.parse(jsonMatch[0]);

      // Validate and transform
      return risks
        .filter(risk => risk.title && risk.description && risk.severity)
        .map(risk => ({
          id: generateId(),
          title: risk.title.trim(),
          description: risk.description.trim(),
          severity: this.normalizeSeverity(risk.severity),
          location: risk.location?.trim() || 'General',
          recommendation: risk.recommendation?.trim() || '',
        }));

    } catch (error) {
      console.error('Failed to parse risks:', error);
      return [];
    }
  }

  /**
   * Parses key terms from LLM response
   * @param {string} responseText - LLM response
   * @returns {import('../../types').KeyTerm[]} Parsed terms
   */
  static parseKeyTerms(responseText) {
    try {
      // Try to extract JSON array from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);

      if (!jsonMatch) {
        return [];
      }

      const terms = JSON.parse(jsonMatch[0]);

      // Validate and transform
      return terms
        .filter(term => term.term && term.definition)
        .map(term => ({
          term: term.term.trim(),
          definition: term.definition.trim(),
          location: term.location?.trim() || 'General',
        }));

    } catch (error) {
      console.error('Failed to parse key terms:', error);
      return [];
    }
  }

  /**
   * Extracts key points from summary text
   * @param {string} summaryText - Summary text
   * @returns {string[]} Key points
   */
  static extractKeyPoints(summaryText) {
    if (!summaryText) return [];

    // Try to extract bullet points
    const bulletPoints = summaryText.match(/^[-•*]\s+(.+)$/gm);
    if (bulletPoints && bulletPoints.length > 0) {
      return bulletPoints.map(point =>
        point.replace(/^[-•*]\s+/, '').trim()
      );
    }

    // Try to extract numbered points
    const numberedPoints = summaryText.match(/^\d+\.\s+(.+)$/gm);
    if (numberedPoints && numberedPoints.length > 0) {
      return numberedPoints.map(point =>
        point.replace(/^\d+\.\s+/, '').trim()
      );
    }

    // Extract sentences as fallback
    const sentences = summaryText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20);

    return sentences.slice(0, 5);
  }

  /**
   * Normalizes severity level
   * @param {string} severity - Raw severity value
   * @returns {import('../../types').RiskLevel} Normalized severity
   */
  static normalizeSeverity(severity) {
    const normalized = severity.toLowerCase().trim();

    const severityMap = {
      'low': 'low',
      'medium': 'medium',
      'moderate': 'medium',
      'high': 'high',
      'critical': 'critical',
      'severe': 'critical',
    };

    return severityMap[normalized] || 'medium';
  }

  /**
   * Cleans LLM response text
   * @param {string} text - Raw response text
   * @returns {string} Cleaned text
   */
  static cleanResponse(text) {
    if (!text) return '';

    return text
      .replace(/^(Here is|Here's|I've analyzed).+?:/i, '')
      .replace(/^(Summary|Analysis|Results?):\s*/i, '')
      .trim();
  }
}
