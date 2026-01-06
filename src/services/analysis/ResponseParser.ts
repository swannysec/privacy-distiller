/**
 * @file Response Parser
 * @description Parses LLM responses into structured data
 */

import { generateId } from "../../utils/helpers.js";
import type {
  PrivacyRisk,
  KeyTerm,
  RiskLevel,
  PrivacyScorecard,
  ScorecardCategory,
  PrivacyRightsInfo,
  PrivacyLink,
  PrivacyContact,
  PrivacyProcedure,
} from "../../types";

export class ResponseParser {
  /**
   * Robustly extracts a JSON object from LLM response text.
   * Handles cases where LLM includes extra text before/after JSON.
   * Tries multiple extraction strategies until one succeeds.
   * @param text - Raw response text (already cleaned of markdown code blocks)
   * @returns Parsed JSON object or null if extraction fails
   */
  private static extractJsonObject<T>(text: string): T | null {
    // Strategy 1: Try parsing the entire text as JSON (ideal case)
    try {
      return JSON.parse(text) as T;
    } catch {
      // Continue to other strategies
    }

    // Strategy 2: Find all potential JSON object boundaries and try each
    // This handles cases like: "Here's the analysis: {...} Note: ..."
    const openBraces: number[] = [];
    for (let i = 0; i < text.length; i++) {
      if (text[i] === "{") {
        openBraces.push(i);
      }
    }

    // Try each opening brace position, starting from the first
    for (const startPos of openBraces) {
      let depth = 0;
      let inString = false;
      let escapeNext = false;

      for (let i = startPos; i < text.length; i++) {
        const char = text[i];

        if (escapeNext) {
          escapeNext = false;
          continue;
        }

        if (char === "\\") {
          escapeNext = true;
          continue;
        }

        // Note: escapeNext is always false here due to the continue above
        if (char === '"') {
          inString = !inString;
          continue;
        }

        if (!inString) {
          if (char === "{") depth++;
          if (char === "}") depth--;

          if (depth === 0) {
            // Found a complete JSON object candidate
            const candidate = text.slice(startPos, i + 1);
            try {
              return JSON.parse(candidate) as T;
            } catch {
              // This candidate wasn't valid JSON, try next opening brace
              break;
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Robustly extracts a JSON array from LLM response text.
   * Handles cases where LLM includes extra text before/after JSON.
   * @param text - Raw response text
   * @returns Parsed JSON array or null if extraction fails
   */
  private static extractJsonArray<T>(text: string): T[] | null {
    // Strategy 1: Try parsing the entire text as JSON (ideal case)
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed as T[];
    } catch {
      // Continue to other strategies
    }

    // Strategy 2: Find all potential JSON array boundaries and try each
    const openBrackets: number[] = [];
    for (let i = 0; i < text.length; i++) {
      if (text[i] === "[") {
        openBrackets.push(i);
      }
    }

    // Try each opening bracket position
    for (const startPos of openBrackets) {
      let depth = 0;
      let inString = false;
      let escapeNext = false;

      for (let i = startPos; i < text.length; i++) {
        const char = text[i];

        if (escapeNext) {
          escapeNext = false;
          continue;
        }

        if (char === "\\") {
          escapeNext = true;
          continue;
        }

        // Note: escapeNext is always false here due to the continue above
        if (char === '"') {
          inString = !inString;
          continue;
        }

        if (!inString) {
          if (char === "[") depth++;
          if (char === "]") depth--;

          if (depth === 0) {
            // Found a complete JSON array candidate
            const candidate = text.slice(startPos, i + 1);
            try {
              const parsed = JSON.parse(candidate);
              if (Array.isArray(parsed)) return parsed as T[];
            } catch {
              // This candidate wasn't valid JSON, try next opening bracket
              break;
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Cleans response text by removing markdown code blocks
   * @param text - Raw response text
   * @returns Cleaned text
   */
  private static cleanMarkdownCodeBlocks(text: string): string {
    return text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();
  }

  /**
   * Maximum number of items allowed in parsed arrays to prevent memory exhaustion
   */
  private static readonly MAX_ARRAY_ITEMS = 100;

  /**
   * Maximum string length for individual fields to prevent excessive memory use
   */
  private static readonly MAX_FIELD_LENGTH = 10000;

  /**
   * Parses privacy risks from LLM response
   * @param responseText - LLM response
   * @returns Parsed risks
   */
  static parseRisks(responseText: string): PrivacyRisk[] {
    try {
      // Clean markdown and robustly extract JSON array from response
      const cleanedText = this.cleanMarkdownCodeBlocks(responseText);
      const risks = this.extractJsonArray<any>(cleanedText);

      if (!risks) {
        return [];
      }

      // Validate and transform (with array length limit)
      return risks
        .slice(0, this.MAX_ARRAY_ITEMS)
        .filter((risk: any) => risk.title && risk.description && risk.severity)
        .map((risk: any) => ({
          id: generateId(),
          title: String(risk.title).trim().slice(0, this.MAX_FIELD_LENGTH),
          description: String(risk.description)
            .trim()
            .slice(0, this.MAX_FIELD_LENGTH),
          severity: this.normalizeSeverity(risk.severity),
          location: (risk.location?.trim() || "General").slice(
            0,
            this.MAX_FIELD_LENGTH,
          ),
          recommendation: (risk.recommendation?.trim() || "").slice(
            0,
            this.MAX_FIELD_LENGTH,
          ),
        }));
    } catch (error) {
      console.error("Failed to parse risks:", error);
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
      // Clean markdown and robustly extract JSON array from response
      const cleanedText = this.cleanMarkdownCodeBlocks(responseText);
      const terms = this.extractJsonArray<any>(cleanedText);

      if (!terms) {
        return [];
      }

      // Validate and transform (with array length limit)
      return terms
        .slice(0, this.MAX_ARRAY_ITEMS)
        .filter((term: any) => term.term && term.definition)
        .map((term: any) => ({
          term: String(term.term).trim().slice(0, this.MAX_FIELD_LENGTH),
          definition: String(term.definition)
            .trim()
            .slice(0, this.MAX_FIELD_LENGTH),
          location: (term.location?.trim() || "General").slice(
            0,
            this.MAX_FIELD_LENGTH,
          ),
        }));
    } catch (error) {
      console.error("Failed to parse key terms:", error);
      return [];
    }
  }

  /**
   * Parse privacy scorecard JSON from LLM response
   * @param responseText - Raw LLM response
   * @returns Parsed scorecard or null
   */
  static parseScorecard(responseText: string): PrivacyScorecard | null {
    try {
      // Clean the response - remove markdown code blocks if present
      const cleanedText = this.cleanMarkdownCodeBlocks(responseText);

      // Robustly extract JSON object from response
      const scorecard = this.extractJsonObject<PrivacyScorecard>(cleanedText);

      if (!scorecard) {
        console.error("No valid JSON object found in scorecard response");
        return null;
      }

      // New 7-category system with weights (total = 100%)
      const categories: Array<{
        key: keyof Omit<
          PrivacyScorecard,
          "topConcerns" | "positiveAspects" | "overallScore" | "overallGrade"
        >;
        weight: number;
      }> = [
        { key: "thirdPartySharing", weight: 20 },
        { key: "userRights", weight: 18 },
        { key: "dataCollection", weight: 18 },
        { key: "dataRetention", weight: 14 },
        { key: "purposeClarity", weight: 12 },
        { key: "securityMeasures", weight: 10 },
        { key: "policyTransparency", weight: 8 },
      ];

      // Validate and normalize each category
      for (const { key, weight } of categories) {
        if (!scorecard[key]) {
          scorecard[key] = { score: 5, weight, summary: "Unable to assess" };
        }
        // Ensure score is within 1-10 bounds
        scorecard[key].score = Math.max(
          1,
          Math.min(10, Number(scorecard[key].score) || 5),
        );
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
      scorecard.overallGrade = ResponseParser.scoreToGrade(
        scorecard.overallScore,
      );

      // Ensure arrays exist
      scorecard.topConcerns = scorecard.topConcerns || [];
      scorecard.positiveAspects = scorecard.positiveAspects || [];

      return scorecard;
    } catch (error) {
      console.error("Failed to parse scorecard:", error);
      return null;
    }
  }

  /**
   * Length limits for privacy rights fields to prevent DoS
   */
  private static readonly PRIVACY_RIGHTS_LIMITS = {
    MAX_URL_LENGTH: 2000,
    MAX_LABEL_LENGTH: 200,
    MAX_VALUE_LENGTH: 500,
    MAX_STEP_LENGTH: 1000,
    MAX_TIMEFRAME_LENGTH: 200,
    MAX_ITEMS_PER_ARRAY: 20,
  } as const;

  /**
   * Valid purposes for privacy links
   */
  private static readonly VALID_LINK_PURPOSES = [
    "settings",
    "data-request",
    "opt-out",
    "deletion",
    "general",
    "other",
  ] as const;

  /**
   * Valid contact types
   */
  private static readonly VALID_CONTACT_TYPES = [
    "email",
    "address",
    "phone",
    "form",
    "dpo",
  ] as const;

  /**
   * Valid rights for procedures
   */
  private static readonly VALID_RIGHTS = [
    "access",
    "deletion",
    "portability",
    "opt-out",
    "correction",
    "objection",
    "other",
  ] as const;

  /**
   * Parse privacy rights info from LLM response
   * @param responseText - Raw LLM response
   * @returns Parsed privacy rights info or null if parsing fails
   */
  static parsePrivacyRights(responseText: string): PrivacyRightsInfo | null {
    try {
      // Clean the response - remove markdown code blocks if present
      const cleanedText = this.cleanMarkdownCodeBlocks(responseText);

      // Robustly extract JSON object from response
      const parsed = this.extractJsonObject<any>(cleanedText);

      if (!parsed) {
        console.error("No valid JSON object found in privacy rights response");
        return null;
      }

      // Validate and normalize links (with length limits)
      const links: PrivacyLink[] = [];
      if (Array.isArray(parsed.links)) {
        for (const link of parsed.links.slice(
          0,
          this.PRIVACY_RIGHTS_LIMITS.MAX_ITEMS_PER_ARRAY,
        )) {
          if (link && typeof link.url === "string" && link.url.trim()) {
            // Only allow http/https URLs within length limit
            const url = link.url
              .trim()
              .slice(0, this.PRIVACY_RIGHTS_LIMITS.MAX_URL_LENGTH);
            if (url.startsWith("http://") || url.startsWith("https://")) {
              links.push({
                label: String(link.label || "Privacy Link")
                  .trim()
                  .slice(0, this.PRIVACY_RIGHTS_LIMITS.MAX_LABEL_LENGTH),
                url: url,
                purpose: this.VALID_LINK_PURPOSES.includes(link.purpose)
                  ? link.purpose
                  : "other",
              });
            }
          }
        }
      }

      // Validate and normalize contacts (with length limits)
      const contacts: PrivacyContact[] = [];
      if (Array.isArray(parsed.contacts)) {
        for (const contact of parsed.contacts.slice(
          0,
          this.PRIVACY_RIGHTS_LIMITS.MAX_ITEMS_PER_ARRAY,
        )) {
          if (
            contact &&
            typeof contact.value === "string" &&
            contact.value.trim()
          ) {
            contacts.push({
              type: this.VALID_CONTACT_TYPES.includes(contact.type)
                ? contact.type
                : "email",
              value: String(contact.value)
                .trim()
                .slice(0, this.PRIVACY_RIGHTS_LIMITS.MAX_VALUE_LENGTH),
              purpose: String(contact.purpose || "Privacy inquiries")
                .trim()
                .slice(0, this.PRIVACY_RIGHTS_LIMITS.MAX_LABEL_LENGTH),
            });
          }
        }
      }

      // Validate and normalize procedures (with length limits)
      const procedures: PrivacyProcedure[] = [];
      if (Array.isArray(parsed.procedures)) {
        for (const proc of parsed.procedures.slice(
          0,
          this.PRIVACY_RIGHTS_LIMITS.MAX_ITEMS_PER_ARRAY,
        )) {
          if (proc && Array.isArray(proc.steps) && proc.steps.length > 0) {
            const steps = proc.steps
              .slice(0, this.PRIVACY_RIGHTS_LIMITS.MAX_ITEMS_PER_ARRAY)
              .filter((s: unknown) => typeof s === "string" && s.trim())
              .map((s: string) =>
                s.trim().slice(0, this.PRIVACY_RIGHTS_LIMITS.MAX_STEP_LENGTH),
              );

            if (steps.length > 0) {
              const procedure: PrivacyProcedure = {
                right: this.VALID_RIGHTS.includes(proc.right)
                  ? proc.right
                  : "other",
                title: String(proc.title || "Privacy Procedure")
                  .trim()
                  .slice(0, this.PRIVACY_RIGHTS_LIMITS.MAX_LABEL_LENGTH),
                steps: steps,
              };

              // Add requirements if present (with limits)
              if (
                Array.isArray(proc.requirements) &&
                proc.requirements.length > 0
              ) {
                procedure.requirements = proc.requirements
                  .slice(0, this.PRIVACY_RIGHTS_LIMITS.MAX_ITEMS_PER_ARRAY)
                  .filter((r: unknown) => typeof r === "string" && r.trim())
                  .map((r: string) =>
                    r
                      .trim()
                      .slice(0, this.PRIVACY_RIGHTS_LIMITS.MAX_STEP_LENGTH),
                  );
              }

              procedures.push(procedure);
            }
          }
        }
      }

      // Validate and normalize timeframes (with length limits)
      const timeframes: string[] = [];
      if (Array.isArray(parsed.timeframes)) {
        for (const tf of parsed.timeframes.slice(
          0,
          this.PRIVACY_RIGHTS_LIMITS.MAX_ITEMS_PER_ARRAY,
        )) {
          if (typeof tf === "string" && tf.trim()) {
            timeframes.push(
              tf
                .trim()
                .slice(0, this.PRIVACY_RIGHTS_LIMITS.MAX_TIMEFRAME_LENGTH),
            );
          }
        }
      }

      // Determine if we have actionable info
      const hasActionableInfo =
        links.length > 0 || contacts.length > 0 || procedures.length > 0;

      return {
        links,
        contacts,
        procedures,
        timeframes,
        hasActionableInfo,
      };
    } catch (error) {
      console.error("Failed to parse privacy rights:", error);
      return null;
    }
  }

  /**
   * Convert numerical score (0-100) to traditional letter grade
   * @param score - Score from 0-100
   * @returns Letter grade
   */
  static scoreToGrade(score: number): string {
    if (score >= 97) return "A+";
    if (score >= 93) return "A";
    if (score >= 90) return "A-";
    if (score >= 87) return "B+";
    if (score >= 83) return "B";
    if (score >= 80) return "B-";
    if (score >= 77) return "C+";
    if (score >= 73) return "C";
    if (score >= 70) return "C-";
    if (score >= 67) return "D+";
    if (score >= 63) return "D";
    if (score >= 60) return "D-";
    return "F";
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
      return bulletPoints.map((point) => point.replace(/^[-•*]\s+/, "").trim());
    }

    // Try to extract numbered points
    const numberedPoints = summaryText.match(/^\d+\.\s+(.+)$/gm);
    if (numberedPoints && numberedPoints.length > 0) {
      return numberedPoints.map((point) =>
        point.replace(/^\d+\.\s+/, "").trim(),
      );
    }

    // Extract sentences as fallback
    const sentences = summaryText
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20);

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
      low: "low",
      medium: "medium",
      moderate: "medium",
      high: "high",
      critical: "critical",
      severe: "critical",
    };

    return severityMap[normalized] || "medium";
  }

  /**
   * Cleans LLM response text
   * @param text - Raw response text
   * @returns Cleaned text
   */
  static cleanResponse(text: string): string {
    if (!text) return "";

    return text
      .replace(/^(Here is|Here's|I've analyzed).+?:/i, "")
      .replace(/^(Summary|Analysis|Results?):\s*/i, "")
      .trim();
  }
}
