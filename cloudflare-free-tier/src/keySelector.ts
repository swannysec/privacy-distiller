/**
 * Key Selection Module
 * Determines which API key to use for requests based on availability and limits
 */

import type { Env, KeySource } from './types';
import { checkRateLimit, type RateLimitResult } from './ratelimit';
import { checkBalance, type BalanceResult } from './balance';

export interface KeySelectionResult {
  apiKey: string | null;
  source: KeySource;
  freeRemaining: number | null;
  error?: {
    code: string;
    message: string;
  };
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
    code: 'DAILY_LIMIT_REACHED',
    message: 'Daily free tier limit reached. Configure your own API key to continue.',
    status: 429,
  },
  FREE_KEY_EXHAUSTED: {
    code: 'FREE_KEY_EXHAUSTED',
    message: 'Free tier budget exhausted. Configure your own API key to continue.',
    status: 402,
  },
  NO_API_KEY: {
    code: 'NO_API_KEY',
    message: 'No API key available. Please configure your own API key.',
    status: 401,
  },
} as const;

/**
 * Determine which API key to use for the request
 * Priority: Free key (if available) → User BYOK (if provided) → Error
 *
 * @param env - Worker environment bindings
 * @param userApiKey - Optional user-provided API key (BYOK)
 * @returns KeySelectionResult with selected key and metadata
 */
export async function selectApiKey(
  env: Env,
  userApiKey?: string | null
): Promise<KeySelectionResult> {
  // Check if free tier is available
  const hasFreeKey = Boolean(env.FREE_API_KEY);

  if (hasFreeKey) {
    // Check rate limit first (fast, KV-based)
    const rateLimit = await checkRateLimit(env);

    if (rateLimit.allowed) {
      // Check balance (may involve API call)
      const balance = await checkBalance(env);

      if (balance.available) {
        // Free tier available - use it
        return {
          apiKey: env.FREE_API_KEY!,
          source: 'free',
          freeRemaining: rateLimit.remaining,
        };
      } else {
        // Balance exhausted - fall back to BYOK or error
        if (userApiKey) {
          return {
            apiKey: userApiKey,
            source: 'byok',
            freeRemaining: null,
          };
        }

        return {
          apiKey: null,
          source: 'none',
          freeRemaining: 0,
          error: KeySelectionErrors.FREE_KEY_EXHAUSTED,
        };
      }
    } else {
      // Rate limit exceeded - fall back to BYOK or error
      if (userApiKey) {
        return {
          apiKey: userApiKey,
          source: 'byok',
          freeRemaining: null,
        };
      }

      return {
        apiKey: null,
        source: 'none',
        freeRemaining: 0,
        error: KeySelectionErrors.DAILY_LIMIT_REACHED,
      };
    }
  }

  // No free tier configured - require BYOK
  if (userApiKey) {
    return {
      apiKey: userApiKey,
      source: 'byok',
      freeRemaining: null,
    };
  }

  return {
    apiKey: null,
    source: 'none',
    freeRemaining: null,
    error: KeySelectionErrors.NO_API_KEY,
  };
}

/**
 * Get current free tier status without selecting a key
 * Used for the /api/status endpoint
 *
 * @param env - Worker environment bindings
 * @returns Status information about free tier availability
 */
export async function getFreeStatus(
  env: Env
): Promise<{
  free_available: boolean;
  daily_remaining: number;
  daily_limit: number;
  balance_remaining: number | null;
  reset_at: string;
}> {
  const dailyLimit = parseInt(env.GLOBAL_DAILY_LIMIT || '50', 10);

  // Check rate limit status (using getRateLimitStatus to not consume quota)
  const rateLimit = await checkRateLimit(env);

  // Check balance status
  const balance = await checkBalance(env);

  // Calculate reset time (next midnight UTC)
  const now = new Date();
  const resetAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));

  return {
    free_available: rateLimit.allowed && balance.available,
    daily_remaining: rateLimit.remaining,
    daily_limit: dailyLimit,
    balance_remaining: balance.remaining,
    reset_at: resetAt.toISOString(),
  };
}
