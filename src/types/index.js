/**
 * @file Type definitions for Privacy Policy Distiller
 * @description JSDoc type definitions for type safety without TypeScript
 */

/**
 * @typedef {'openrouter' | 'ollama' | 'lmstudio'} LLMProvider
 */

/**
 * @typedef {Object} LLMConfig
 * @property {LLMProvider} provider - The LLM provider to use
 * @property {string} apiKey - API key for the provider (empty for local providers)
 * @property {string} model - Model identifier
 * @property {string} baseUrl - Base URL for the provider API
 * @property {number} temperature - Temperature for response generation (0-1)
 * @property {number} maxTokens - Maximum tokens in response
 */

/**
 * @typedef {'url' | 'pdf'} DocumentSource
 */

/**
 * @typedef {Object} DocumentInput
 * @property {DocumentSource} source - Source type of the document
 * @property {string} [url] - URL of the policy document (for url source)
 * @property {File} [file] - PDF file (for pdf source)
 * @property {string} [rawText] - Extracted text content
 */

/**
 * @typedef {'idle' | 'extracting' | 'analyzing' | 'completed' | 'error'} AnalysisStatus
 */

/**
 * @typedef {'low' | 'medium' | 'high' | 'critical'} RiskLevel
 */

/**
 * @typedef {Object} PrivacyRisk
 * @property {string} id - Unique identifier for the risk
 * @property {string} title - Brief title of the risk
 * @property {string} description - Detailed description of the risk
 * @property {RiskLevel} severity - Severity level of the risk
 * @property {string} location - Location in the document (section reference)
 * @property {string} [recommendation] - Recommendation for the user
 */

/**
 * @typedef {Object} KeyTerm
 * @property {string} term - The term or phrase
 * @property {string} definition - Plain language definition
 * @property {string} location - Location in the document
 */

/**
 * @typedef {'brief' | 'detailed' | 'full'} SummaryType
 */

/**
 * @typedef {Object} PolicySummary
 * @property {SummaryType} type - Type of summary
 * @property {string} content - Summary content
 * @property {string[]} keyPoints - Key points extracted
 */

/**
 * @typedef {Object} AnalysisResult
 * @property {string} id - Unique identifier for the analysis
 * @property {DocumentInput} document - Source document information
 * @property {PolicySummary[]} summaries - Array of summaries (brief, detailed, full)
 * @property {PrivacyRisk[]} risks - Identified privacy risks
 * @property {KeyTerm[]} keyTerms - Important terms and definitions
 * @property {Date} timestamp - When the analysis was completed
 * @property {LLMConfig} llmConfig - LLM configuration used
 */

/**
 * @typedef {Object} AnalysisState
 * @property {AnalysisStatus} status - Current analysis status
 * @property {AnalysisResult | null} result - Analysis result if completed
 * @property {string | null} error - Error message if status is 'error'
 * @property {number} progress - Progress percentage (0-100)
 * @property {string} [currentStep] - Description of current step
 */

/**
 * @typedef {Object} ValidationError
 * @property {string} field - Field that failed validation
 * @property {string} message - Error message
 * @property {string} [code] - Error code for programmatic handling
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether validation passed
 * @property {ValidationError[]} errors - Array of validation errors
 */

export {};
