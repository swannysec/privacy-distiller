/**
 * Key Selection Module
 * Determines which API key to use for requests based on availability and limits
 */

import type { Env, KeySource, ServiceTier } from "./types";
import { TIER_MODELS } from "./types";
import { checkRateLimit, type RateLimitResult } from "./ratelimit";
import { checkBalance, type BalanceResult } from "./balance";

export interface KeySelectionResult {
  apiKey: string | null;
  source: KeySource;
  freeRemaining: number | null;
  error?: {
    code: string;
    message: string;
  };
  /** Service tier for this request */
  tier: ServiceTier;
  /** Model to use (worker-controlled for hosted free, client-controlled for BYOK) */
  model: string;
  /** Whether Zero Data Retention is enabled for this tier */
  zdrEnabled: boolean;
}

export interface KeySelectionContext {
  userApiKey?: string | null;
  rateLimit: RateLimitResult;
  balance: BalanceResult;
}

/**
 * Error codes for key selection failures
 */
export const KeySelectionErrors = {
  DAILY_LIMIT_REACHED: {
    code: "DAILY_LIMIT_REACHED",
    message:
      "Daily free tier limit reached. Configure your own API key to continue.",
    status: 429,
  },
  FREE_KEY_EXHAUSTED: {
    code: "FREE_KEY_EXHAUSTED",
    message:
      "Free tier budget exhausted. Configure your own API key to continue.",
    status: 402,
  },
  NO_API_KEY: {
    code: "NO_API_KEY",
    message: "No API key available. Please configure your own API key.",
    status: 401,
  },
} as const;

/**
 * Determine which API key to use for the request
 * Priority:
 * 1. User BYOK (paid-user tier) - if provided, user controls everything
 * 2. Free key with paid budget (paid-central tier, ZDR enabled)
 * 3. Free key with exhausted budget (free tier, no ZDR)
 * 4. Error (no key available)
 *
 * @param env - Worker environment bindings
 * @param userApiKey - Optional user-provided API key (BYOK)
 * @returns KeySelectionResult with selected key, tier, model, and metadata
 */
export async function selectApiKey(
  env: Env,
  userApiKey?: string | null,
): Promise<KeySelectionResult> {
  // If user provides their own key, use it (BYOK) - they control model selection
  if (userApiKey) {
    return {
      apiKey: userApiKey,
      source: "byok",
      freeRemaining: null,
      tier: "paid-user",
      model: "", // Client controls model for BYOK
      zdrEnabled: false, // User controls their own ZDR settings via OpenRouter dashboard
    };
  }

  // Check if free tier is available
  const hasFreeKey = Boolean(env.FREE_API_KEY);

  if (hasFreeKey) {
    // Check rate limit first (fast, KV-based)
    const rateLimit = await checkRateLimit(env);

    if (!rateLimit.allowed) {
      // Rate limit exceeded - no key available
      return {
        apiKey: null,
        source: "none",
        freeRemaining: 0,
        error: KeySelectionErrors.DAILY_LIMIT_REACHED,
        tier: "free",
        model: TIER_MODELS.FREE,
        zdrEnabled: false,
      };
    }

    // Check balance (may involve API call)
    const balance = await checkBalance(env);

    if (balance.available) {
      // Paid budget still available - use paid-central tier with ZDR
      return {
        apiKey: env.FREE_API_KEY!,
        source: "free",
        freeRemaining: rateLimit.remaining,
        tier: "paid-central",
        model: TIER_MODELS.PAID_CENTRAL,
        zdrEnabled: true,
      };
    } else {
      // Paid budget exhausted - fall back to free tier (no ZDR)
      return {
        apiKey: env.FREE_API_KEY!,
        source: "free",
        freeRemaining: rateLimit.remaining,
        tier: "free",
        model: TIER_MODELS.FREE,
        zdrEnabled: false,
      };
    }
  }

  // No free tier configured and no BYOK - error
  return {
    apiKey: null,
    source: "none",
    freeRemaining: null,
    error: KeySelectionErrors.NO_API_KEY,
    tier: "free",
    model: TIER_MODELS.FREE,
    zdrEnabled: false,
  };
}

/**
 * Get current free tier status without selecting a key
 * Used for the /api/status endpoint
 *
 * @param env - Worker environment bindings
 * @returns Status information about free tier availability including tier info
 */
export async function getFreeStatus(env: Env): Promise<{
  free_available: boolean;
  daily_remaining: number;
  daily_limit: number;
  balance_remaining: number | null;
  reset_at: string;
  tier: ServiceTier;
  zdrEnabled: boolean;
  paidBudgetExhausted: boolean;
  model: string;
}> {
  const dailyLimit = parseInt(env.GLOBAL_DAILY_LIMIT || "50", 10);

  // Check rate limit status (using getRateLimitStatus to not consume quota)
  const rateLimit = await checkRateLimit(env);

  // Check balance status
  const balance = await checkBalance(env);

  // Calculate reset time (next midnight UTC)
  const now = new Date();
  const resetAt = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );

  // Determine current tier based on balance availability
  const paidBudgetExhausted = !balance.available;
  const tier: ServiceTier = paidBudgetExhausted ? "free" : "paid-central";
  const zdrEnabled = !paidBudgetExhausted;
  const model = paidBudgetExhausted ? TIER_MODELS.FREE : TIER_MODELS.PAID_CENTRAL;

  return {
    free_available: rateLimit.allowed && balance.available,
    daily_remaining: rateLimit.remaining,
    daily_limit: dailyLimit,
    balance_remaining: balance.remaining,
    reset_at: resetAt.toISOString(),
    tier,
    zdrEnabled,
    paidBudgetExhausted,
    model,
  };
}
