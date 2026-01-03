/**
 * @file Type definitions for Privacy Policy Distiller
 * @description TypeScript type definitions for the application
 */

/**
 * Supported LLM providers
 */
export type LLMProvider = "openrouter" | "ollama" | "lmstudio" | "hosted-free";

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
  /** Optional context window override (in tokens). null = auto-detect */
  contextWindow?: number | null;
}

/**
 * Source type for document input
 */
export type DocumentSourceType = "url" | "pdf" | "file";

/**
 * Metadata for document input
 */
export interface DocumentMetadata {
  /** Original filename for file inputs */
  fileName?: string;
  /** File size in bytes */
  fileSize?: number;
  /** MIME type */
  mimeType?: string;
  /** Fetch timestamp */
  fetchedAt?: Date;
  /** Input mode (url or file) */
  inputMode?: string;
  /** Timestamp as ISO string */
  timestamp?: string;
}

/**
 * Input document information
 */
export interface DocumentInput {
  /** Type of the document source */
  type: DocumentSourceType;
  /** Source of the document (URL string or File) */
  source: string | File;
  /** URL of the policy document (for url source) */
  url?: string;
  /** PDF file (for pdf source) */
  file?: File;
  /** Extracted text content */
  rawText?: string;
  /** Optional metadata */
  metadata?: DocumentMetadata;
}

/**
 * Status of the analysis process
 */
export type AnalysisStatus =
  | "idle"
  | "extracting"
  | "analyzing"
  | "completed"
  | "error"
  | "failed";

/**
 * Severity level for privacy risks
 */
export type RiskLevel = "low" | "medium" | "high" | "critical";

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
  location?: string;
}

/**
 * Type of summary
 */
export type SummaryType = "brief" | "detailed" | "full";

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
 * Scorecard category with score, weight, and summary
 */
export interface ScorecardCategory {
  score: number;
  weight: number;
  summary: string;
}

/**
 * Privacy scorecard from analysis
 */
export interface PrivacyScorecard {
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

/**
 * Partial failure from Promise.allSettled analysis
 */
export interface PartialFailure {
  section: string;
  error: string;
}

/**
 * Document metadata in analysis result
 */
export interface AnalysisDocumentMetadata {
  source: string;
  type: "url" | "pdf";
  rawText: string;
  file?: {
    name: string;
    size: number;
    type: string;
  };
}

/**
 * Summary object with brief, detailed, and full versions
 */
export interface AnalysisSummary {
  brief: string;
  detailed: string;
  full: string;
}

/**
 * Complete analysis result from orchestrator
 */
export interface AnalysisResult {
  /** Unique identifier for the analysis */
  id: string;
  /** Document metadata */
  documentMetadata: AnalysisDocumentMetadata;
  /** Summary with brief, detailed, and full versions */
  summary: AnalysisSummary;
  /** Identified privacy risks */
  risks: PrivacyRisk[];
  /** Important terms and definitions */
  keyTerms: KeyTerm[];
  /** Privacy scorecard with scores per category (null if unavailable) */
  scorecard?: PrivacyScorecard | null;
  /** When the analysis was completed */
  timestamp: Date;
  /** LLM configuration used */
  llmConfig: LLMConfig;
  /** Partial failures from parallel analysis */
  partialFailures: PartialFailure[];
  /** Whether there were any partial failures */
  hasPartialFailures: boolean;
}

/**
 * Legacy analysis result structure (used internally by PolicyAnalyzer)
 * @deprecated Use AnalysisResult instead
 */
export interface LegacyAnalysisResult {
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
