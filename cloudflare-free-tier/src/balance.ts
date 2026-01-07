/**
 * Privacy Policy Analyzer - Balance Checking Module
 *
 * OpenRouter API key balance tracking with KV-based caching.
 * Implements 5-minute cache to minimize API calls while maintaining accuracy.
 *
 * @license MIT License with Commercial Product Restriction
 * @copyright 2025-2026 John D. Swanson
 */

import type { Env } from "./types";

/**
 * Result of a balance check operation
 */
export interface BalanceResult {
  /** Whether the API key has sufficient balance available */
  available: boolean;

  /** Remaining balance in USD */
  remaining: number;

  /** Maximum spending limit configured for the free key */
  limit: number;

  /** Whether this result came from cache (true) or fresh API call (false) */
  cached: boolean;

  /** ISO timestamp when the balance was last checked */
  checkedAt: string;
}

/**
 * Internal structure stored in KV for balance caching
 */
interface BalanceCacheEntry {
  remaining: number;
  limit: number;
  usage: number;
  checkedAt: string;
}

/**
 * OpenRouter API balance response structure
 */
interface OpenRouterBalanceData {
  data: {
    limit: number;
    usage: number;
    limit_remaining: number;
  };
}

/**
 * KV key for balance cache storage
 */
const BALANCE_CACHE_KEY = "balance:free_key";

/**
 * Cache TTL in seconds (5 minutes)
 */
const CACHE_TTL = 300;

/**
 * Get cached balance without making an API call
 *
 * Returns null if no cache exists or cache is corrupted.
 *
 * @param env - Cloudflare Worker environment bindings
 * @returns Cached balance result or null if unavailable
 */
export async function getCachedBalance(
  env: Env,
): Promise<BalanceResult | null> {
  try {
    const cached = await env.PRIVACY_DISTILLER_KV.get<BalanceCacheEntry>(
      BALANCE_CACHE_KEY,
      "json",
    );

    if (!cached) {
      return null;
    }

    // Available if there's meaningful balance remaining
    // Threshold of $0.30 avoids edge cases near zero
    const available = cached.remaining > 0.3;

    return {
      available,
      remaining: cached.remaining,
      limit: cached.limit,
      cached: true,
      checkedAt: cached.checkedAt,
    };
  } catch (error) {
    console.warn("Failed to read cached balance:", error);
    return null;
  }
}

/**
 * Force refresh balance from OpenRouter API
 *
 * Makes a direct API call to OpenRouter to get current balance,
 * updates the cache, and returns the result.
 *
 * @param env - Cloudflare Worker environment bindings
 * @returns Fresh balance result from API
 */
export async function refreshBalance(env: Env): Promise<BalanceResult> {
  try {
    if (!env.FREE_API_KEY) {
      throw new Error("FREE_API_KEY not configured");
    }

    // Call OpenRouter balance endpoint
    const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.FREE_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `OpenRouter API returned ${response.status}: ${response.statusText}`,
      );
    }

    const data = (await response.json()) as OpenRouterBalanceData;

    if (!data.data || typeof data.data.limit_remaining !== "number") {
      throw new Error("Invalid response format from OpenRouter API");
    }

    const { limit, usage, limit_remaining } = data.data;
    const checkedAt = new Date().toISOString();

    // Cache the result
    const cacheEntry: BalanceCacheEntry = {
      remaining: limit_remaining,
      limit,
      usage,
      checkedAt,
    };

    await env.PRIVACY_DISTILLER_KV.put(
      BALANCE_CACHE_KEY,
      JSON.stringify(cacheEntry),
      {
        expirationTtl: CACHE_TTL,
      },
    );

    // Determine if balance is available
    // Threshold of $0.30 avoids edge cases near zero
    // Budget is controlled via OpenRouter key settings, not in code
    const available = limit_remaining > 0.3;

    return {
      available,
      remaining: limit_remaining,
      limit,
      cached: false,
      checkedAt,
    };
  } catch (error) {
    console.error("Failed to refresh balance from OpenRouter:", error);

    // Try to use cached value as fallback
    const cached = await getCachedBalance(env);
    if (cached) {
      console.warn("Using stale cached balance after API failure");
      return cached;
    }

    // If no cache and API failed, fail open with a warning
    console.warn("No cached balance available, failing open");
    return {
      available: true, // Fail open - allow request to proceed
      remaining: 1.0, // Assume some balance available
      limit: 10.0, // Default limit
      cached: false,
      checkedAt: new Date().toISOString(),
    };
  }
}

/**
 * Check OpenRouter API key balance with caching
 *
 * Returns cached balance if available and fresh (< 5 minutes old).
 * Otherwise, refreshes balance from OpenRouter API.
 *
 * Caching strategy:
 * - Cache hit: Return cached value (fast)
 * - Cache miss: Call API and cache result
 * - Cache expired: Call API and update cache
 * - API error with valid cache: Return cached value
 * - API error without cache: Fail open (allow request)
 *
 * @param env - Cloudflare Worker environment bindings
 * @returns Balance check result
 */
export async function checkBalance(env: Env): Promise<BalanceResult> {
  // Try to get cached balance first
  const cached = await getCachedBalance(env);

  if (cached) {
    // Cache hit - check if it's still fresh
    const cacheAge = Date.now() - new Date(cached.checkedAt).getTime();
    const cacheFresh = cacheAge < CACHE_TTL * 1000;

    if (cacheFresh) {
      // Cache is fresh, use it
      return cached;
    }
  }

  // Cache miss or expired - refresh from API
  return refreshBalance(env);
}
