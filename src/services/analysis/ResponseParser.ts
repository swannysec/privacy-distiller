/**
 * @file Response Parser
 * @description Parses LLM responses into structured data
 */

import { generateId } from '../../utils/helpers.js';
import type { PrivacyRisk, KeyTerm, RiskLevel } from '../../types';

interface ScorecardCategory {
  score: number;
  weight: number;
  summary: string;
}

interface Scorecard {
  thirdPartySharing: ScorecardCategory;
  userRights: ScorecardCategory;
  dataCollection: ScorecardCategory;
  dataRetention: ScorecardCategory;
  purposeClarity: ScorecardCategory;
  securityMeasures: ScorecardCategory;
  policyTransparency: ScorecardCategory;
  topConcerns: string[];
  positiveAspects: string[];
  overallScore?: number;
  overallGrade?: string;
}

export class ResponseParser {
  /**
   * Parses privacy risks from LLM response
   * @param responseText - LLM response
   * @returns Parsed risks
   */
  static parseRisks(responseText: string): PrivacyRisk[] {
    try {
      // Try to extract JSON array from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);

      if (!jsonMatch) {
        return [];
      }

      const risks = JSON.parse(jsonMatch[0]);

      // Validate and transform
      return risks
        .filter((risk: any) => risk.title && risk.description && risk.severity)
        .map((risk: any) => ({
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
   * @param responseText - LLM response
   * @returns Parsed terms
   */
  static parseKeyTerms(responseText: string): KeyTerm[] {
    try {
      // Try to extract JSON array from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);

      if (!jsonMatch) {
        return [];
      }

      const terms = JSON.parse(jsonMatch[0]);

      // Validate and transform
      return terms
        .filter((term: any) => term.term && term.definition)
        .map((term: any) => ({
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
   * Parse privacy scorecard JSON from LLM response
   * @param responseText - Raw LLM response
   * @returns Parsed scorecard or null
   */
  static parseScorecard(responseText: string): Scorecard | null {
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedText = responseText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      
      // Try to extract JSON object from response
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        console.error('No JSON object found in scorecard response');
        return null;
      }

      const scorecard: Scorecard = JSON.parse(jsonMatch[0]);

      // New 7-category system with weights (total = 100%)
      const categories: Array<{ key: keyof Omit<Scorecard, 'topConcerns' | 'positiveAspects' | 'overallScore' | 'overallGrade'>; weight: number }> = [
        { key: 'thirdPartySharing', weight: 20 },
        { key: 'userRights', weight: 18 },
        { key: 'dataCollection', weight: 18 },
        { key: 'dataRetention', weight: 14 },
        { key: 'purposeClarity', weight: 12 },
        { key: 'securityMeasures', weight: 10 },
        { key: 'policyTransparency', weight: 8 },
      ];
      
      // Validate and normalize each category
      for (const { key, weight } of categories) {
        if (!scorecard[key]) {
          scorecard[key] = { score: 5, weight, summary: 'Unable to assess' };
        }
        // Ensure score is within 1-10 bounds
        scorecard[key].score = Math.max(1, Math.min(10, Number(scorecard[key].score) || 5));
        // Ensure weight is set correctly
        scorecard[key].weight = weight;
      }

      // Calculate weighted overall score (0-100)
      let totalWeightedScore = 0;
      for (const { key } of categories) {
        const catData = scorecard[key];
        // Each category contributes: (score/10) * weight
        // e.g., score of 8 with weight 20 = 0.8 * 20 = 16 points
        totalWeightedScore += (catData.score / 10) * catData.weight;
      }
      
      // Round to nearest integer for overall score (0-100)
      scorecard.overallScore = Math.round(totalWeightedScore);

      // Convert overall score to traditional letter grade
      scorecard.overallGrade = ResponseParser.scoreToGrade(scorecard.overallScore);

      // Ensure arrays exist
      scorecard.topConcerns = scorecard.topConcerns || [];
      scorecard.positiveAspects = scorecard.positiveAspects || [];

      return scorecard;

    } catch (error) {
      console.error('Failed to parse scorecard:', error);
      return null;
    }
  }

  /**
   * Convert numerical score (0-100) to traditional letter grade
   * @param score - Score from 0-100
   * @returns Letter grade
   */
  static scoreToGrade(score: number): string {
    if (score >= 97) return 'A+';
    if (score >= 93) return 'A';
    if (score >= 90) return 'A-';
    if (score >= 87) return 'B+';
    if (score >= 83) return 'B';
    if (score >= 80) return 'B-';
    if (score >= 77) return 'C+';
    if (score >= 73) return 'C';
    if (score >= 70) return 'C-';
    if (score >= 67) return 'D+';
    if (score >= 63) return 'D';
    if (score >= 60) return 'D-';
    return 'F';
  }

  /**
   * Extracts key points from summary text
   * @param summaryText - Summary text
   * @returns Key points
   */
  static extractKeyPoints(summaryText: string): string[] {
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
   * @param severity - Raw severity value
   * @returns Normalized severity
   */
  static normalizeSeverity(severity: string): RiskLevel {
    const normalized = severity.toLowerCase().trim();

    const severityMap: Record<string, RiskLevel> = {
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
   * @param text - Raw response text
   * @returns Cleaned text
   */
  static cleanResponse(text: string): string {
    if (!text) return '';

    return text
      .replace(/^(Here is|Here's|I've analyzed).+?:/i, '')
      .replace(/^(Summary|Analysis|Results?):\s*/i, '')
      .trim();
  }
}
