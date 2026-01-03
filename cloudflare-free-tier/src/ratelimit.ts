/**
 * Privacy Policy Analyzer - Rate Limiting Module
 *
 * Global daily rate limiting for free tier LLM proxy using Cloudflare KV.
 * Implements atomic counter operations with automatic daily reset.
 *
 * @license MIT License with Commercial Product Restriction
 * @copyright 2025-2026 John D. Swanson
 */

import type { Env } from "./types";
import { parseEnvBoolean, parseEnvNumber } from "./types";

/**
 * Result of a rate limit check operation
 */
export interface RateLimitResult {
  /** Whether the request is allowed under current rate limit */
  allowed: boolean;

  /** Number of requests remaining in the current period */
  remaining: number;

  /** Maximum requests allowed per period */
  limit: number;

  /** ISO timestamp when the rate limit resets (midnight UTC) */
  resetAt: string;
}

/**
 * Internal structure stored in KV for rate limit tracking
 */
interface RateLimitEntry {
  count: number;
  date: string;
}

/**
 * Get the current UTC date key for KV storage
 * Format: YYYY-MM-DD
 *
 * @returns Date key string in format "count:YYYY-MM-DD"
 */
export function getDailyKey(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `count:${year}-${month}-${day}`;
}

/**
 * Calculate the timestamp for the next midnight UTC
 *
 * @returns ISO timestamp string for next day at 00:00:00 UTC
 */
function getNextMidnightUTC(): string {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0,
    ),
  );
  return tomorrow.toISOString();
}

/**
 * Get current rate limit status without incrementing the counter
 *
 * This is useful for status endpoints that need to check quota without
 * consuming a request.
 *
 * @param env - Cloudflare Worker environment bindings
 * @returns Current rate limit status
 */
export async function getRateLimitStatus(env: Env): Promise<RateLimitResult> {
  const enabled = parseEnvBoolean(env.GLOBAL_LIMIT_ENABLED);

  // If rate limiting is disabled, return unlimited quota
  if (!enabled) {
    return {
      allowed: true,
      remaining: Infinity,
      limit: Infinity,
      resetAt: "",
    };
  }

  const limit = parseEnvNumber(env.GLOBAL_DAILY_LIMIT, 100);
  const key = getDailyKey();
  const resetAt = getNextMidnightUTC();

  try {
    const value = await env.POLICY_ANALYZER_KV.get<RateLimitEntry>(key, "json");

    if (!value) {
      // No requests yet today
      return {
        allowed: true,
        remaining: limit,
        limit,
        resetAt,
      };
    }

    const count = value.count || 0;
    const remaining = Math.max(0, limit - count);

    return {
      allowed: remaining > 0,
      remaining,
      limit,
      resetAt,
    };
  } catch (error) {
    // Fail open on KV errors - allow the request but log the issue
    console.warn("Rate limit status check failed:", error);
    return {
      allowed: true,
      remaining: limit,
      limit,
      resetAt,
    };
  }
}

/**
 * Check and increment the global daily request counter
 *
 * Uses atomic operations to prevent race conditions when multiple requests
 * arrive simultaneously. Returns whether the request is allowed and remaining quota.
 *
 * Implementation strategy:
 * 1. Get current count from KV
 * 2. Check if under limit
 * 3. Atomically increment using put with expirationTtl
 * 4. Return updated status
 *
 * Note: While this isn't a true atomic increment (KV doesn't support that),
 * it's sufficient for rate limiting purposes. In edge cases where two requests
 * race, both might be allowed even if it exceeds the limit by 1-2 requests.
 * This is acceptable for a free tier rate limit.
 *
 * @param env - Cloudflare Worker environment bindings
 * @returns Rate limit check result with updated quota
 */
export async function checkRateLimit(env: Env): Promise<RateLimitResult> {
  const enabled = parseEnvBoolean(env.GLOBAL_LIMIT_ENABLED);

  // If rate limiting is disabled, return unlimited quota
  if (!enabled) {
    return {
      allowed: true,
      remaining: Infinity,
      limit: Infinity,
      resetAt: "",
    };
  }

  const limit = parseEnvNumber(env.GLOBAL_DAILY_LIMIT, 100);
  const key = getDailyKey();
  const resetAt = getNextMidnightUTC();

  try {
    // Get current count
    const value = await env.POLICY_ANALYZER_KV.get<RateLimitEntry>(key, "json");
    const currentCount = value?.count || 0;

    // Check if we're at or over the limit
    if (currentCount >= limit) {
      return {
        allowed: false,
        remaining: 0,
        limit,
        resetAt,
      };
    }

    // Increment the counter
    const newCount = currentCount + 1;
    const today = key.split(":")[1] ?? getDailyKey().split(":")[1]!; // Extract date from "count:YYYY-MM-DD"

    const entry: RateLimitEntry = {
      count: newCount,
      date: today,
    };

    // Store with 24-hour TTL for automatic cleanup
    // expirationTtl is in seconds
    await env.POLICY_ANALYZER_KV.put(key, JSON.stringify(entry), {
      expirationTtl: 86400, // 24 hours
    });

    const remaining = Math.max(0, limit - newCount);

    return {
      allowed: true,
      remaining,
      limit,
      resetAt,
    };
  } catch (error) {
    // Fail open on KV errors - allow the request but log the issue
    // This prevents the service from being completely unavailable if KV has issues
    console.error("Rate limit check failed, failing open:", error);
    return {
      allowed: true,
      remaining: limit - 1, // Conservative estimate
      limit,
      resetAt,
    };
  }
}
