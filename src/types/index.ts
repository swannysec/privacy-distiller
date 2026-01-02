/**
 * @file Type definitions for Privacy Policy Distiller
 * @description TypeScript type definitions for the application
 */

/**
 * Supported LLM providers
 */
export type LLMProvider = 'openrouter' | 'ollama' | 'lmstudio';

/**
 * Configuration for LLM provider
 */
export interface LLMConfig {
  /** The LLM provider to use */
  provider: LLMProvider;
  /** API key for the provider (empty for local providers) */
  apiKey: string;
  /** Model identifier */
  model: string;
  /** Base URL for the provider API */
  baseUrl: string;
  /** Temperature for response generation (0-1) */
  temperature: number;
  /** Maximum tokens in response */
  maxTokens: number;
}

/**
 * Source type for document input
 */
export type DocumentSource = 'url' | 'pdf';

/**
 * Input document information
 */
export interface DocumentInput {
  /** Source type of the document */
  source: DocumentSource;
  /** URL of the policy document (for url source) */
  url?: string;
  /** PDF file (for pdf source) */
  file?: File;
  /** Extracted text content */
  rawText?: string;
}

/**
 * Status of the analysis process
 */
export type AnalysisStatus = 'idle' | 'extracting' | 'analyzing' | 'completed' | 'error';

/**
 * Severity level for privacy risks
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Identified privacy risk
 */
export interface PrivacyRisk {
  /** Unique identifier for the risk */
  id: string;
  /** Brief title of the risk */
  title: string;
  /** Detailed description of the risk */
  description: string;
  /** Severity level of the risk */
  severity: RiskLevel;
  /** Location in the document (section reference) */
  location: string;
  /** Recommendation for the user */
  recommendation?: string;
}

/**
 * Key term extracted from the policy
 */
export interface KeyTerm {
  /** The term or phrase */
  term: string;
  /** Plain language definition */
  definition: string;
  /** Location in the document */
  location: string;
}

/**
 * Type of summary
 */
export type SummaryType = 'brief' | 'detailed' | 'full';

/**
 * Policy summary at a specific detail level
 */
export interface PolicySummary {
  /** Type of summary */
  type: SummaryType;
  /** Summary content */
  content: string;
  /** Key points extracted */
  keyPoints: string[];
}

/**
 * Complete analysis result
 */
export interface AnalysisResult {
  /** Unique identifier for the analysis */
  id: string;
  /** Source document information */
  document: DocumentInput;
  /** Array of summaries (brief, detailed, full) */
  summaries: PolicySummary[];
  /** Identified privacy risks */
  risks: PrivacyRisk[];
  /** Important terms and definitions */
  keyTerms: KeyTerm[];
  /** When the analysis was completed */
  timestamp: Date;
  /** LLM configuration used */
  llmConfig: LLMConfig;
}

/**
 * Current state of the analysis
 */
export interface AnalysisState {
  /** Current analysis status */
  status: AnalysisStatus;
  /** Analysis result if completed */
  result: AnalysisResult | null;
  /** Error message if status is 'error' */
  error: string | null;
  /** Progress percentage (0-100) */
  progress: number;
  /** Description of current step */
  currentStep?: string;
}

/**
 * Single validation error
 */
export interface ValidationError {
  /** Field that failed validation */
  field: string;
  /** Error message */
  message: string;
  /** Error code for programmatic handling */
  code?: string;
}

/**
 * Result of validation
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Array of validation errors */
  errors: ValidationError[];
}
