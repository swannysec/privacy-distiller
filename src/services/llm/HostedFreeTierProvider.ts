/**
 * @file Hosted Free Tier LLM Provider
 * @description LLM provider that uses the free tier Cloudflare Worker proxy
 *
 * This provider communicates with a Cloudflare Worker that:
 * - Validates Turnstile tokens for bot protection
 * - Enforces global rate limits
 * - Manages API key selection (free tier with BYOK fallback)
 * - Proxies requests to OpenRouter
 */

import { BaseLLMProvider } from "./BaseLLMProvider";
import {
  ERROR_MESSAGES,
  ERROR_CODES,
  ANALYSIS_CONFIG,
  FREE_TIER_WORKER_URL,
  FREE_TIER_MODEL,
} from "../../utils/constants";

/**
 * Service tier indicating the level of service and privacy guarantees
 * Matches the worker's ServiceTier type
 */
export type ServiceTier = "paid-central" | "free" | "paid-user";

/**
 * Response from the free tier status endpoint
 */
export interface FreeTierStatus {
  free_available: boolean;
  daily_remaining: number;
  daily_limit: number;
  balance_remaining: number | null;
  reset_at: string;
  /** Current service tier (paid-central with ZDR, free with telemetry, or paid-user BYOK) */
  tier: ServiceTier;
  /** Whether Zero Data Retention is enabled for this tier */
  zdrEnabled: boolean;
  /** Whether the paid budget is exhausted (triggers fallback to free tier) */
  paidBudgetExhausted: boolean;
  /** The model being used for this tier (for display purposes) */
  model: string;
}

/**
 * Response from the session endpoint
 */
interface SessionResponse {
  success: boolean;
  sessionToken?: string;
  expiresIn?: number;
  error?: string;
}

/**
 * Provider for the hosted free tier service
 * Uses Cloudflare Worker proxy with Turnstile validation
 */
export class HostedFreeTierProvider extends BaseLLMProvider {
  private turnstileToken: string | null = null;
  private sessionToken: string | null = null;
  private sessionTokenPromise: Promise<string> | null = null;
  private userApiKey: string | null = null;
  /** Cached tier status for the current analysis session */
  private cachedStatus: FreeTierStatus | null = null;

  getName(): string {
    return "Hosted Free";
  }

  /**
   * Get the model being used by the free tier
   * @returns The model identifier (e.g., "google/gemini-2.5-flash-preview-05-20")
   */
  static getFreeTierModel(): string {
    return FREE_TIER_MODEL;
  }

  /**
   * Get a human-readable model name for display
   * @returns Formatted model name (e.g., "Gemini 2.5 Flash Preview")
   */
  static getFreeTierModelDisplayName(): string {
    // Return the model ID as-is for clarity
    return FREE_TIER_MODEL;
  }

  /**
   * Format any model name for display
   * @param model - Full model ID (e.g., "nvidia/nemotron-3-nano-30b-a3b:free")
   * @returns Human-readable model name (e.g., "Gpt Oss 120b:free")
   */
  static formatModelDisplayName(model: string): string {
    // Return the model ID as-is for clarity
    return model;
  }

  /**
   * Set the Turnstile token for request validation
   * @param token - The Turnstile token from widget verification
   */
  setTurnstileToken(token: string | null): void {
    this.turnstileToken = token;
    // Clear session token when Turnstile token changes (new verification)
    this.sessionToken = null;
    this.sessionTokenPromise = null;
  }

  /**
   * Set an optional user API key for BYOK fallback
   * @param apiKey - User's OpenRouter API key
   */
  setUserApiKey(apiKey: string | null): void {
    this.userApiKey = apiKey;
  }

  /**
   * Obtain a session token from the backend using the Turnstile token.
   * Session tokens are short-lived JWTs that can be used for multiple
   * API calls within a single analysis (enables parallel requests).
   *
   * @returns Session token string
   * @throws Error if session token cannot be obtained
   */
  async getSessionToken(): Promise<string> {
    // Return existing session token if available
    if (this.sessionToken) {
      return this.sessionToken;
    }

    // If a fetch is already in progress, wait for it (prevents race condition)
    if (this.sessionTokenPromise) {
      return this.sessionTokenPromise;
    }

    if (!this.turnstileToken) {
      throw new Error("Turnstile token required to obtain session token");
    }

    // Create the promise and store it to guard against concurrent calls
    this.sessionTokenPromise = (async () => {
      try {
        const response = await fetch(`${FREE_TIER_WORKER_URL}/api/session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Turnstile-Token": this.turnstileToken!,
          },
          body: JSON.stringify({ turnstileToken: this.turnstileToken }),
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Turnstile verification failed. Please try again.");
          }
          throw new Error(`Failed to obtain session token: ${response.status}`);
        }

        const data: SessionResponse = await response.json();

        if (!data.success || !data.sessionToken) {
          throw new Error(data.error || "Failed to obtain session token");
        }

        this.sessionToken = data.sessionToken;
        return this.sessionToken;
      } finally {
        // Clear the promise guard after completion (success or failure)
        this.sessionTokenPromise = null;
      }
    })();

    return this.sessionTokenPromise;
  }

  /**
   * Clear the current session token (call after analysis completes)
   */
  clearSessionToken(): void {
    this.sessionToken = null;
    this.sessionTokenPromise = null;
  }

  /**
   * Check and cache the current tier status.
   * Call this BEFORE starting analysis to commit to a tier for all requests.
   * @returns The cached status
   */
  async checkAndCacheStatus(): Promise<FreeTierStatus> {
    const status = await this.getStatus();
    this.cachedStatus = status;
    return status;
  }

  /**
   * Get the cached tier status (for UI display)
   * @returns Cached status or null if not yet fetched
   */
  getCachedStatus(): FreeTierStatus | null {
    return this.cachedStatus;
  }

  /**
   * Clear cached status (call after analysis completes)
   */
  clearCachedStatus(): void {
    this.cachedStatus = null;
  }

  /**
   * Check if ZDR is enabled for current cached tier
   * @returns true if ZDR is enabled, false otherwise
   */
  isZdrEnabled(): boolean {
    return this.cachedStatus?.zdrEnabled ?? false;
  }

  /**
   * Get current service tier from cached status
   * @returns The current tier or null if status not cached
   */
  getCurrentTier(): ServiceTier | null {
    return this.cachedStatus?.tier ?? null;
  }

  /**
   * Get the current free tier status
   * @returns Status information about free tier availability
   */
  async getStatus(): Promise<FreeTierStatus> {
    const response = await fetch(`${FREE_TIER_WORKER_URL}/api/status`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get free tier status: ${response.status}`);
    }

    return response.json();
  }

  validateConfig(): boolean {
    // Free tier doesn't require API key or specific config
    // Turnstile token is validated at request time
    return true;
  }

  async complete(
    prompt: string,
    options: Record<string, unknown> = {},
  ): Promise<string> {
    // Worker controls model selection based on tier (paid-central vs free)
    // We still send a model field for BYOK compatibility, but the worker
    // will override it for hosted free tier requests
    const requestBody = {
      model: FREE_TIER_MODEL, // Worker overrides this for hosted free tier
      messages: [{ role: "user", content: prompt }],
      temperature:
        (options.temperature as number | undefined) ?? this.config.temperature,
      max_tokens:
        (options.maxTokens as number | undefined) ?? this.config.maxTokens,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Use session token if available (preferred for parallel requests)
    // Otherwise fall back to Turnstile token for single requests
    if (this.sessionToken) {
      headers["X-Session-Token"] = this.sessionToken;
    } else if (this.turnstileToken) {
      headers["X-Turnstile-Token"] = this.turnstileToken;
    }

    // Add user API key if available (for BYOK fallback)
    if (this.userApiKey) {
      headers["X-User-Api-Key"] = this.userApiKey;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      ANALYSIS_CONFIG.TIMEOUT_MS,
    );

    try {
      const response = await fetch(`${FREE_TIER_WORKER_URL}/api/analyze`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error("Turnstile verification failed. Please try again.");
        }
        if (response.status === 429) {
          const errorData = await response.json().catch(() => ({}));
          const resetAt = errorData.reset_at || "tomorrow";
          throw new Error(
            `Rate limit exceeded. Free tier resets ${resetAt}. ` +
              "To continue analyzing, switch to OpenRouter (bring your own API key) " +
              "or use a local model like Ollama or LM Studio from the provider dropdown.",
          );
        }
        if (response.status === 402) {
          throw new Error(
            "Free tier budget exhausted for today. " +
              "To continue analyzing, switch to OpenRouter (bring your own API key) " +
              "or use a local model like Ollama or LM Studio from the provider dropdown.",
          );
        }
        if (response.status === 503) {
          throw new Error(
            "Free tier service temporarily unavailable. " +
              "Please try again later or use your own API key.",
          );
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.choices?.[0]?.message?.content) {
        throw new Error(ERROR_MESSAGES[ERROR_CODES.LLM_INVALID_RESPONSE]);
      }

      return data.choices[0].message.content;
    } catch (err) {
      clearTimeout(timeoutId);

      if ((err as Error).name === "AbortError") {
        throw new Error(ERROR_MESSAGES[ERROR_CODES.LLM_TIMEOUT]);
      }
      throw err;
    }
  }
}
