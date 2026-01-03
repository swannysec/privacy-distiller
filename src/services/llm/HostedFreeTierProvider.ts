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
} from "../../utils/constants";

/**
 * Response from the free tier status endpoint
 */
interface FreeTierStatus {
  free_available: boolean;
  daily_remaining: number;
  daily_limit: number;
  balance_remaining: number | null;
  reset_at: string;
}

/**
 * Provider for the hosted free tier service
 * Uses Cloudflare Worker proxy with Turnstile validation
 */
export class HostedFreeTierProvider extends BaseLLMProvider {
  private turnstileToken: string | null = null;
  private userApiKey: string | null = null;

  getName(): string {
    return "Hosted Free";
  }

  /**
   * Set the Turnstile token for request validation
   * @param token - The Turnstile token from widget verification
   */
  setTurnstileToken(token: string | null): void {
    this.turnstileToken = token;
  }

  /**
   * Set an optional user API key for BYOK fallback
   * @param apiKey - User's OpenRouter API key
   */
  setUserApiKey(apiKey: string | null): void {
    this.userApiKey = apiKey;
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
    const requestBody = {
      model: this.config.model || "anthropic/claude-3.5-sonnet",
      messages: [{ role: "user", content: prompt }],
      temperature:
        (options.temperature as number | undefined) ?? this.config.temperature,
      max_tokens:
        (options.maxTokens as number | undefined) ?? this.config.maxTokens,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add Turnstile token if available
    if (this.turnstileToken) {
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
        // Clear Turnstile token on any error (tokens are single-use)
        this.turnstileToken = null;

        // Handle specific error cases
        if (response.status === 401) {
          throw new Error("Turnstile verification failed. Please try again.");
        }
        if (response.status === 429) {
          const errorData = await response.json().catch(() => ({}));
          const resetAt = errorData.reset_at || "tomorrow";
          throw new Error(
            `Rate limit exceeded. Free tier resets ${resetAt}. ` +
              "You can add your own OpenRouter API key to continue.",
          );
        }
        if (response.status === 402) {
          throw new Error(
            "Free tier budget exhausted for today. " +
              "Please add your own OpenRouter API key to continue.",
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

      // Clear Turnstile token after successful use (tokens are single-use)
      this.turnstileToken = null;

      return data.choices[0].message.content;
    } catch (err) {
      clearTimeout(timeoutId);
      // Clear Turnstile token on network errors too (tokens are single-use)
      this.turnstileToken = null;

      if ((err as Error).name === "AbortError") {
        throw new Error(ERROR_MESSAGES[ERROR_CODES.LLM_TIMEOUT]);
      }
      throw err;
    }
  }
}
