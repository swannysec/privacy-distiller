/**
 * @file Prompt Templates
 * @description Templates for LLM prompts
 */

export class PromptTemplates {
  /**
   * Creates a brief summary prompt
   * @param {string} text - Policy text
   * @returns {string} Prompt
   */
  static briefSummary(text) {
    return `You are analyzing a privacy policy or terms of service document. Provide a brief summary (3-5 sentences) in plain language that a layperson can understand. Focus on the most important aspects that users should know.

Privacy Policy Text:
${text}

Brief Summary (3-5 sentences in plain language):`;
  }

  /**
   * Creates a detailed summary prompt
   * @param {string} text - Policy text
   * @returns {string} Prompt
   */
  static detailedSummary(text) {
    return `You are analyzing a privacy policy or terms of service document. Provide a detailed summary in plain language that breaks down the key sections and explains what they mean for users. Make it clear, accessible, and organized.

Privacy Policy Text:
${text}

Detailed Summary (in plain language, organized by topic):`;
  }

  /**
   * Creates a privacy risks prompt
   * @param {string} text - Policy text
   * @returns {string} Prompt
   */
  static privacyRisks(text) {
    return `You are analyzing a privacy policy to identify privacy risks for users. For each significant risk you find, provide:

1. title: A brief title for the risk
2. description: What the risk means for users in plain language
3. severity: Rate as "low", "medium", "high", or "critical"
4. location: Which section or paragraph this appears in
5. recommendation: What users should know or consider

Return ONLY a JSON array with this exact structure, no additional text:
[
  {
    "title": "Risk title",
    "description": "What this means for users",
    "severity": "low|medium|high|critical",
    "location": "Section name or description",
    "recommendation": "What users should know"
  }
]

Privacy Policy Text:
${text}

Privacy Risks JSON:`;
  }

  /**
   * Creates a key terms prompt
   * @param {string} text - Policy text
   * @returns {string} Prompt
   */
  static keyTerms(text) {
    return `You are analyzing a privacy policy to extract key terms and technical jargon. For each important term, provide a plain language definition that helps users understand what it means.

Return ONLY a JSON array with this exact structure, no additional text:
[
  {
    "term": "The term or phrase",
    "definition": "Plain language explanation",
    "location": "Where it appears in the document"
  }
]

Privacy Policy Text:
${text}

Key Terms JSON:`;
  }

  /**
   * Creates a data collection prompt
   * @param {string} text - Policy text
   * @returns {string} Prompt
   */
  static dataCollection(text) {
    return `You are analyzing a privacy policy to identify what data is collected. List the types of personal data mentioned in the policy.

Privacy Policy Text:
${text}

Data Collection Summary:`;
  }

  /**
   * Creates a data sharing prompt
   * @param {string} text - Policy text
   * @returns {string} Prompt
   */
  static dataSharing(text) {
    return `You are analyzing a privacy policy to identify who data is shared with (third parties, partners, etc.). Explain the data sharing practices in plain language.

Privacy Policy Text:
${text}

Data Sharing Summary:`;
  }

  /**
   * Creates a user rights prompt
   * @param {string} text - Policy text
   * @returns {string} Prompt
   */
  static userRights(text) {
    return `You are analyzing a privacy policy to identify user rights (access, deletion, portability, opt-out, etc.). Summarize what rights users have according to this policy.

Privacy Policy Text:
${text}

User Rights Summary:`;
  }
}
