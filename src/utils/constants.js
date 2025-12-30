/**
 * @file Application constants
 */

// LLM Provider configurations
export const LLM_PROVIDERS = {
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
export const DEFAULT_LLM_CONFIG = {
  provider: "openrouter",
  apiKey: "",
  model: "google/gemini-3-flash-preview",
  baseUrl: LLM_PROVIDERS.OPENROUTER.baseUrl,
  temperature: 0.7, // Recommended default for balanced output
  maxTokens: 32000, // OpenRouter models support large responses
  contextWindow: null, // null = auto-detect for OpenRouter, use default for local
};

// Default context windows for local providers (conservative defaults)
export const DEFAULT_CONTEXT_WINDOWS = {
  ollama: 8192,
  lmstudio: 8192,
};

// Default max response tokens for local providers
export const DEFAULT_MAX_TOKENS = {
  ollama: 4096,
  lmstudio: 4096,
  openrouter: 32000,
};

// File upload constraints
export const FILE_CONSTRAINTS = {
  MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  MAX_SIZE_MB: 10,
  ALLOWED_TYPES: ["application/pdf"],
  ALLOWED_EXTENSIONS: [".pdf"],
};

// URL validation
export const URL_CONSTRAINTS = {
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
  ],
};

// Text processing
export const TEXT_PROCESSING = {
  MAX_DOCUMENT_LENGTH: 2000000, // characters - ~500k tokens for large context windows
  MIN_DOCUMENT_LENGTH: 100,
  CHUNK_SIZE: 4000, // characters per chunk for LLM processing
  CHUNK_OVERLAP: 200, // overlap between chunks
};

// Analysis configuration
export const ANALYSIS_CONFIG = {
  TIMEOUT_MS: 600000, // 10 minutes - local models may need longer for large documents
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
};

// Risk severity levels
export const RISK_LEVELS = {
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
export const ANALYSIS_STATUS = {
  IDLE: "idle",
  EXTRACTING: "extracting",
  ANALYZING: "analyzing",
  COMPLETED: "completed",
  ERROR: "error",
  FAILED: "failed",
};

// Summary types
export const SUMMARY_TYPES = {
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
export const STORAGE_KEYS = {
  LLM_CONFIG: "ppa_llm_config",
  ANALYSIS_HISTORY: "ppa_analysis_history",
  USER_PREFERENCES: "ppa_user_preferences",
};

// Error codes
export const ERROR_CODES = {
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
export const ERROR_MESSAGES = {
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
export const CLOUDFLARE_WORKER_URL = "https://proxy.privacydistiller.com";

// CORS proxy fallback chain
// When CLOUDFLARE_WORKER_URL is set, it will be used exclusively
// When empty, falls back to direct fetch only (no third-party proxies)
export const CORS_PROXIES = CLOUDFLARE_WORKER_URL
  ? ["", `${CLOUDFLARE_WORKER_URL}/?url=`] // Direct + Cloudflare Worker
  : [""]; // Direct fetch only (no third-party proxies)

// Accessibility
export const A11Y = {
  SKIP_TO_MAIN: "skip-to-main",
  MAIN_CONTENT: "main-content",
  ARIA_LIVE_REGION: "aria-live-region",
};
