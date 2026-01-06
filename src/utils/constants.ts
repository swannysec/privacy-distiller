/**
 * @file Application constants
 */

import type { LLMProvider } from "../types";

interface ProviderConfig {
  id: LLMProvider;
  name: string;
  baseUrl: string;
  requiresApiKey: boolean;
  defaultModels: string[];
}

interface LLMProviders {
  OPENROUTER: ProviderConfig;
  OLLAMA: ProviderConfig;
  LMSTUDIO: ProviderConfig;
  HOSTED_FREE: ProviderConfig;
  [key: string]: ProviderConfig | undefined;
}

interface DefaultLLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  baseUrl: string;
  temperature: number;
  maxTokens: number;
  contextWindow: number | null;
}

interface DefaultContextWindows {
  [key: string]: number;
}

interface DefaultMaxTokens {
  [key: string]: number;
}

interface FileConstraints {
  MAX_SIZE_BYTES: number;
  MAX_SIZE_MB: number;
  ALLOWED_TYPES: string[];
  ALLOWED_EXTENSIONS: string[];
  PDF_MAGIC_BYTES: number[];
}

interface URLConstraints {
  MAX_LENGTH: number;
  ALLOWED_PROTOCOLS: string[];
  BLOCKED_DOMAINS: string[];
  PRIVATE_IP_PATTERNS: RegExp[];
}

interface TextProcessing {
  MAX_DOCUMENT_LENGTH: number;
  MIN_DOCUMENT_LENGTH: number;
  CHUNK_SIZE: number;
  CHUNK_OVERLAP: number;
}

interface AnalysisConfig {
  TIMEOUT_MS: number;
  RETRY_ATTEMPTS: number;
  RETRY_DELAY_MS: number;
}

interface RiskLevelConfig {
  value: string;
  label: string;
  color: string;
  priority: number;
}

interface RiskLevels {
  LOW: RiskLevelConfig;
  MEDIUM: RiskLevelConfig;
  HIGHER: RiskLevelConfig;
  CRITICAL: RiskLevelConfig;
}

interface AnalysisStatusConstants {
  IDLE: "idle";
  EXTRACTING: "extracting";
  ANALYZING: "analyzing";
  COMPLETED: "completed";
  ERROR: "error";
  FAILED: "failed";
}

interface SummaryTypeConfig {
  value: string;
  label: string;
  maxLength: number;
}

interface SummaryTypes {
  BRIEF: SummaryTypeConfig;
  DETAILED: SummaryTypeConfig;
  FULL: SummaryTypeConfig;
}

interface StorageKeys {
  LLM_CONFIG: string;
  LLM_CONFIG_TIMESTAMP: string;
  ANALYSIS_HISTORY: string;
  USER_PREFERENCES: string;
}

interface ErrorCodes {
  INVALID_URL: string;
  INVALID_FILE_TYPE: string;
  FILE_TOO_LARGE: string;
  INVALID_API_KEY: string;
  PDF_EXTRACTION_FAILED: string;
  URL_FETCH_FAILED: string;
  DOCUMENT_TOO_LONG: string;
  DOCUMENT_TOO_SHORT: string;
  LLM_REQUEST_FAILED: string;
  LLM_TIMEOUT: string;
  LLM_RATE_LIMITED: string;
  LLM_INVALID_RESPONSE: string;
  NETWORK_ERROR: string;
  UNKNOWN_ERROR: string;
}

interface ErrorMessages {
  [key: string]: string;
}

interface A11Y {
  SKIP_TO_MAIN: string;
  MAIN_CONTENT: string;
  ARIA_LIVE_REGION: string;
}

// LLM Provider configurations
export const LLM_PROVIDERS: LLMProviders = {
  HOSTED_FREE: {
    id: "hosted-free",
    name: "Hosted Free",
    baseUrl: "", // Uses FREE_TIER_WORKER_URL
    requiresApiKey: false,
    // Note: This must match FREE_TIER_MODEL defined below
    defaultModels: ["openai/gpt-oss-120b:free"],
  },
  OPENROUTER: {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    requiresApiKey: true,
    defaultModels: [
      "anthropic/claude-3.5-sonnet",
      "openai/gpt-4-turbo",
      "meta-llama/llama-3.1-70b-instruct",
    ],
  },
  OLLAMA: {
    id: "ollama",
    name: "Ollama",
    baseUrl: "http://localhost:11434",
    requiresApiKey: false,
    defaultModels: ["llama3.1", "mistral", "phi3"],
  },
  LMSTUDIO: {
    id: "lmstudio",
    name: "LM Studio",
    baseUrl: "http://localhost:1234/v1",
    requiresApiKey: false,
    defaultModels: ["local-model"],
  },
};

// Default LLM configuration
export const DEFAULT_LLM_CONFIG: DefaultLLMConfig = {
  provider: "openrouter",
  apiKey: "",
  model: "google/gemini-3-flash-preview",
  baseUrl: LLM_PROVIDERS.OPENROUTER.baseUrl,
  temperature: 0.7, // Recommended default for balanced output
  maxTokens: 32000, // OpenRouter models support large responses
  contextWindow: null, // null = auto-detect for OpenRouter, use default for local
};

// Default context windows for local providers (conservative defaults)
export const DEFAULT_CONTEXT_WINDOWS: DefaultContextWindows = {
  ollama: 8192,
  lmstudio: 8192,
};

// Default max response tokens for local providers
export const DEFAULT_MAX_TOKENS: DefaultMaxTokens = {
  ollama: 4096,
  lmstudio: 4096,
  openrouter: 32000,
};

// File upload constraints
export const FILE_CONSTRAINTS: FileConstraints = {
  MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  MAX_SIZE_MB: 10,
  ALLOWED_TYPES: ["application/pdf"],
  ALLOWED_EXTENSIONS: [".pdf"],
  PDF_MAGIC_BYTES: [0x25, 0x50, 0x44, 0x46, 0x2d], // %PDF- signature
};

// URL validation
export const URL_CONSTRAINTS: URLConstraints = {
  MAX_LENGTH: 2048,
  ALLOWED_PROTOCOLS: ["http:", "https:"],
  BLOCKED_DOMAINS: ["localhost", "127.0.0.1", "0.0.0.0", "[::1]", "[::]"],
  // Private IP patterns for SSRF protection
  PRIVATE_IP_PATTERNS: [
    /^127\./, // 127.0.0.0/8 loopback
    /^10\./, // 10.0.0.0/8 private
    /^192\.168\./, // 192.168.0.0/16 private
    /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16.0.0/12 private
    /^169\.254\./, // 169.254.0.0/16 link-local
    /^0\./, // 0.0.0.0/8 current network
    /^\[fe80:/i, // IPv6 link-local
    /^\[fc00:/i, // IPv6 unique local
    /^\[fd/i, // IPv6 unique local
    /^::1$/, // IPv6 loopback (unbracketed)
    /^\[::1\]$/, // IPv6 loopback (bracketed)
    /^0:0:0:0:0:0:0:1$/, // IPv6 loopback (full form)
    /^\[0:0:0:0:0:0:0:1\]$/, // IPv6 loopback (full form, bracketed)
  ],
};

// Text processing
export const TEXT_PROCESSING: TextProcessing = {
  MAX_DOCUMENT_LENGTH: 2000000, // characters - ~500k tokens for large context windows
  MIN_DOCUMENT_LENGTH: 100,
  CHUNK_SIZE: 4000, // characters per chunk for LLM processing
  CHUNK_OVERLAP: 200, // overlap between chunks
};

// Analysis configuration
export const ANALYSIS_CONFIG: AnalysisConfig = {
  TIMEOUT_MS: 600000, // 10 minutes - local models may need longer for large documents
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
};

// Risk severity levels
export const RISK_LEVELS: RiskLevels = {
  LOW: {
    value: "low",
    label: "Low",
    color: "#22c55e",
    priority: 1,
  },
  MEDIUM: {
    value: "medium",
    label: "Medium",
    color: "#f59e0b",
    priority: 2,
  },
  HIGHER: {
    value: "high",
    label: "Higher",
    color: "#ef4444",
    priority: 3,
  },
  CRITICAL: {
    value: "critical",
    label: "Critical",
    color: "#dc2626",
    priority: 4,
  },
};

// Analysis statuses
export const ANALYSIS_STATUS: AnalysisStatusConstants = {
  IDLE: "idle",
  EXTRACTING: "extracting",
  ANALYZING: "analyzing",
  COMPLETED: "completed",
  ERROR: "error",
  FAILED: "failed",
} as const;

// Summary types
export const SUMMARY_TYPES: SummaryTypes = {
  BRIEF: {
    value: "brief",
    label: "Brief Summary",
    maxLength: 500,
  },
  DETAILED: {
    value: "detailed",
    label: "Detailed Summary",
    maxLength: 2000,
  },
  FULL: {
    value: "full",
    label: "Full Summary",
    maxLength: 5000,
  },
};

// Storage keys
export const STORAGE_KEYS: StorageKeys = {
  LLM_CONFIG: "ppa_llm_config",
  LLM_CONFIG_TIMESTAMP: "ppa_llm_config_timestamp",
  ANALYSIS_HISTORY: "ppa_analysis_history",
  USER_PREFERENCES: "ppa_user_preferences",
};

// Security: API key timeout (60 minutes of inactivity)
export const API_KEY_TIMEOUT_MS: number = 60 * 60 * 1000; // 60 minutes

// Error codes
export const ERROR_CODES: ErrorCodes = {
  // Validation errors
  INVALID_URL: "INVALID_URL",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  INVALID_API_KEY: "INVALID_API_KEY",

  // Extraction errors
  PDF_EXTRACTION_FAILED: "PDF_EXTRACTION_FAILED",
  URL_FETCH_FAILED: "URL_FETCH_FAILED",
  DOCUMENT_TOO_LONG: "DOCUMENT_TOO_LONG",
  DOCUMENT_TOO_SHORT: "DOCUMENT_TOO_SHORT",

  // LLM errors
  LLM_REQUEST_FAILED: "LLM_REQUEST_FAILED",
  LLM_TIMEOUT: "LLM_TIMEOUT",
  LLM_RATE_LIMITED: "LLM_RATE_LIMITED",
  LLM_INVALID_RESPONSE: "LLM_INVALID_RESPONSE",

  // General errors
  NETWORK_ERROR: "NETWORK_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
};

// Error messages
export const ERROR_MESSAGES: ErrorMessages = {
  [ERROR_CODES.INVALID_URL]:
    "Please enter a valid URL starting with http:// or https://",
  [ERROR_CODES.INVALID_FILE_TYPE]: "Please upload a PDF file",
  [ERROR_CODES.FILE_TOO_LARGE]: `File size must be less than ${FILE_CONSTRAINTS.MAX_SIZE_MB}MB`,
  [ERROR_CODES.INVALID_API_KEY]: "Please enter a valid API key",
  [ERROR_CODES.PDF_EXTRACTION_FAILED]:
    "Failed to extract text from PDF. The file may be corrupted or image-based.",
  [ERROR_CODES.URL_FETCH_FAILED]:
    "Failed to fetch document from URL. Please check the URL and try again.",
  [ERROR_CODES.DOCUMENT_TOO_LONG]: "Document is too long to process",
  [ERROR_CODES.DOCUMENT_TOO_SHORT]:
    "Document is too short. Please provide a longer document.",
  [ERROR_CODES.LLM_REQUEST_FAILED]:
    "Failed to analyze document. Please try again.",
  [ERROR_CODES.LLM_TIMEOUT]: "Analysis timed out. Please try again.",
  [ERROR_CODES.LLM_RATE_LIMITED]:
    "Rate limit exceeded. Please wait a moment and try again.",
  [ERROR_CODES.LLM_INVALID_RESPONSE]:
    "Received invalid response from AI. Please try again.",
  [ERROR_CODES.NETWORK_ERROR]:
    "Network error. Please check your connection and try again.",
  [ERROR_CODES.UNKNOWN_ERROR]:
    "An unexpected error occurred. Please try again.",
};

// CORS proxy configuration
// Cloudflare Worker proxies requests to bypass CORS restrictions
export const CLOUDFLARE_WORKER_URL: string =
  "https://proxy.privacydistiller.com";

/**
 * Free tier Cloudflare Worker URL for hosted LLM proxy
 * This worker handles Turnstile verification, rate limiting, and API key management
 */
export const FREE_TIER_WORKER_URL: string =
  import.meta.env.VITE_FREE_TIER_WORKER_URL ||
  "https://free.privacydistiller.com";

/**
 * Turnstile site key for bot protection on free tier
 * Uses a test key if not configured (for development)
 */
export const TURNSTILE_SITE_KEY: string =
  import.meta.env.VITE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

/**
 * Whether the free tier is enabled
 */
export const FREE_TIER_ENABLED: boolean =
  import.meta.env.VITE_FREE_TIER_ENABLED === "true";

/**
 * Free tier model to use via OpenRouter
 * Uses a Zero Data Retention (ZDR) endpoint for privacy
 * Default: openai/gpt-oss-120b:free
 */
export const FREE_TIER_MODEL: string =
  import.meta.env.VITE_FREE_TIER_MODEL || "openai/gpt-oss-120b:free";

/**
 * Service tier types for hosted free provider
 */
export type ServiceTier = "paid-central" | "free" | "paid-user";

/**
 * Tier-specific messaging for UI display
 * Used by ProviderSelector to show appropriate privacy information
 */
export interface TierMessage {
  badge: string;
  privacyNote: string;
  zdrLink?: string;
}

export interface TierMessages {
  "paid-central": TierMessage;
  free: TierMessage;
  "paid-user": TierMessage;
  unknown: TierMessage;
}

export const TIER_MESSAGES: TierMessages = {
  "paid-central": {
    badge: "ZDR Active",
    privacyNote:
      "Your policy content is not stored or used for training thanks to Zero Data Retention.",
    zdrLink: "https://openrouter.ai/docs/features/privacy",
  },
  free: {
    badge: "Free Tier",
    privacyNote:
      "Telemetry may be collected by OpenRouter or the model provider on free tier models.",
  },
  "paid-user": {
    badge: "Your API Key",
    privacyNote:
      "Privacy settings depend on your OpenRouter account configuration.",
    zdrLink: "https://openrouter.ai/docs/features/privacy",
  },
  unknown: {
    badge: "Checking...",
    privacyNote:
      "Checking service status. Privacy protection depends on availability.",
  },
};

// CORS proxy fallback chain
// When CLOUDFLARE_WORKER_URL is set, it will be used exclusively
// When empty, falls back to direct fetch only (no third-party proxies)
export const CORS_PROXIES: string[] = CLOUDFLARE_WORKER_URL
  ? ["", `${CLOUDFLARE_WORKER_URL}/?url=`] // Direct + Cloudflare Worker
  : [""]; // Direct fetch only (no third-party proxies)

// Accessibility
export const A11Y: A11Y = {
  SKIP_TO_MAIN: "skip-to-main",
  MAIN_CONTENT: "main-content",
  ARIA_LIVE_REGION: "aria-live-region",
};
