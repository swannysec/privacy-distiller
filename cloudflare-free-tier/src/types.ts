/**
 * Privacy Policy Analyzer - Free Tier LLM Proxy Types
 *
 * TypeScript type definitions for the Cloudflare Worker proxy service.
 *
 * @license MIT License with Commercial Product Restriction
 * @copyright 2025-2026 John D. Swanson
 */

/**
 * Cloudflare Worker environment bindings
 */
export interface Env {
  // KV Namespace for rate limiting and balance caching
  POLICY_ANALYZER_KV: KVNamespace;

  // Environment variables (strings in Workers)
  TURNSTILE_ENABLED: string;
  GLOBAL_LIMIT_ENABLED: string;
  GLOBAL_DAILY_LIMIT: string;
  FREE_KEY_SPENDING_CAP: string;
  ALLOWED_ORIGINS: string;

  // Secrets (set via wrangler secret put)
  TURNSTILE_SECRET_KEY?: string;
  FREE_API_KEY?: string;
}

/**
 * Source of the API key used for the request
 */
export type KeySource = "free" | "byok" | "none";

/**
 * Service tier indicating the level of service and privacy guarantees
 * - 'paid-central': Using centralized paid API key with ZDR (Zero Data Retention)
 * - 'free': Using free model tier (telemetry may be collected by OpenRouter)
 * - 'paid-user': User provided their own API key (BYOK)
 */
export type ServiceTier = "paid-central" | "free" | "paid-user";

/**
 * Model configuration for each service tier
 * Worker controls model selection - frontend should not override these
 */
export const TIER_MODELS = {
  /** Paid tier model (without :free suffix) - ZDR enabled */
  PAID_CENTRAL: "openai/gpt-oss-120b",

  /** Free tier model (with :free suffix) - telemetry collected */
  FREE: "openai/gpt-oss-120b:free",
} as const;

/**
 * Request body for the /api/analyze endpoint
 */
export interface AnalyzeRequest {
  // The policy text or URL to analyze
  content: string;

  // Type of content being sent
  contentType: "text" | "url";

  // LLM model to use (e.g., "openai/gpt-4o-mini")
  model: string;

  // Analysis prompt template key or custom prompt
  prompt?: string;

  // User's own API key (BYOK - Bring Your Own Key)
  apiKey?: string;

  // Turnstile token for bot verification (when using free tier)
  turnstileToken?: string;
}

/**
 * Response from the /api/analyze endpoint
 */
export interface AnalyzeResponse {
  // Whether the request was successful
  success: boolean;

  // The LLM analysis result (when successful)
  result?: string;

  // Error message (when not successful)
  error?: string;

  // Error code for programmatic handling
  errorCode?: FreeTierErrorCode;
}

/**
 * Custom response headers included with analyze responses
 */
export interface AnalyzeResponseHeaders {
  // Source of the API key used: 'free' or 'byok'
  "x-key-source": KeySource;

  // Remaining free tier requests for the day (only when using free key)
  "x-free-remaining"?: string;
}

/**
 * Response from the /api/status endpoint
 */
export interface FreeTierStatus {
  // Whether free tier is currently available
  free_available: boolean;

  // Remaining requests in daily global limit
  daily_remaining: number;

  // Daily limit configured
  daily_limit: number;

  // Remaining balance on free API key (USD) - internal use, not exposed to frontend for budget decisions
  balance_remaining: number | null;

  // Timestamp when daily limit resets (ISO 8601)
  reset_at: string;

  // Current service tier (paid-central, free, or paid-user)
  tier: ServiceTier;

  // Whether Zero Data Retention is enabled for this tier
  zdrEnabled: boolean;

  // Whether the paid budget is exhausted (triggers fallback to free tier)
  paidBudgetExhausted: boolean;
}

/**
 * Rate limit tracking information stored in KV
 */
export interface RateLimitInfo {
  // Current count of requests for the day
  dailyCount: number;

  // UTC date string for the current tracking period (YYYY-MM-DD)
  date: string;
}

/**
 * Balance information from OpenRouter API (cached in KV)
 */
export interface BalanceInfo {
  // Remaining balance in USD
  balance: number;

  // Timestamp when balance was last fetched
  cachedAt: string;

  // Whether the free key is exhausted
  exhausted: boolean;
}

/**
 * Error codes for free tier specific errors
 */
export type FreeTierErrorCode =
  | "TURNSTILE_FAILED"
  | "DAILY_LIMIT_REACHED"
  | "FREE_KEY_EXHAUSTED"
  | "NO_API_KEY"
  | "INVALID_REQUEST"
  | "ORIGIN_NOT_ALLOWED"
  | "INTERNAL_ERROR";

/**
 * Structured error response
 */
export interface ErrorResponse {
  success: false;
  error: string;
  errorCode: FreeTierErrorCode;
}

/**
 * Turnstile verification response from Cloudflare API
 */
export interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

/**
 * OpenRouter balance response
 */
export interface OpenRouterBalanceResponse {
  data?: {
    balance?: number;
    limit?: number;
    usage?: number;
  };
}

/**
 * KV storage keys used by the worker
 */
export const KV_KEYS = {
  DAILY_RATE_LIMIT: "rate:daily",
  BALANCE_CACHE: "balance:cache",
} as const;

/**
 * Helper to parse boolean environment variables
 */
export function parseEnvBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const lowered = value.toLowerCase().trim();
  return lowered === "true" || lowered === "1" || lowered === "yes";
}

/**
 * Helper to parse numeric environment variables
 */
export function parseEnvNumber(
  value: string | undefined,
  defaultValue: number,
): number {
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Helper to parse comma-separated list environment variables
 */
export function parseEnvList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
