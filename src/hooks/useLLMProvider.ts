/**
 * @file LLM Provider hook
 * @description Hook for interacting with LLM providers
 */

import { useState, useCallback } from "react";
import { useLLMConfig } from "../contexts/LLMConfigContext.jsx";
import {
  ANALYSIS_CONFIG,
  ERROR_CODES,
  ERROR_MESSAGES,
} from "../utils/constants";
import { retry } from "../utils/helpers";
import { refreshLLMConfigTimestamp } from "../utils/storage";
import type { LLMConfig } from "../types";

/**
 * Options for LLM completion requests
 */
interface CompleteOptions {
  /** Temperature override for this request */
  temperature?: number;
  /** Max tokens override for this request */
  maxTokens?: number;
}

/**
 * Return type for useLLMProvider hook
 */
export interface UseLLMProviderReturn {
  /** Send a completion request to the LLM */
  complete: (prompt: string, options?: CompleteOptions) => Promise<string>;
  /** Whether a request is currently being processed */
  isProcessing: boolean;
  /** Current error message, if any */
  error: string | null;
  /** Clear the error state */
  clearError: () => void;
  /** Current LLM configuration */
  config: LLMConfig;
}

/**
 * Simple token bucket rate limiter
 * Prevents API abuse by limiting requests to max 10 per minute
 */
class TokenBucket {
  private capacity: number;
  private tokens: number;
  private refillRate: number;
  private lastRefill: number;

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity; // Maximum tokens
    this.tokens = capacity; // Current available tokens
    this.refillRate = refillRate; // Tokens per millisecond
    this.lastRefill = Date.now(); // Last refill timestamp
  }

  refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  tryConsume(): boolean {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }

  // Expose for testing
  _setTokens(tokens: number): void {
    this.tokens = tokens;
  }

  _setLastRefill(timestamp: number): void {
    this.lastRefill = timestamp;
  }

  _getCapacity(): number {
    return this.capacity;
  }
}

// Module-level rate limiter: max 10 requests per minute (1 token every 6 seconds)
const rateLimiter = new TokenBucket(10, 1 / 6000);

/**
 * Reset rate limiter for testing purposes
 * @param timestamp - Optional timestamp for lastRefill (useful with fake timers)
 */
export function __resetRateLimiter(timestamp: number = Date.now()): void {
  rateLimiter._setTokens(rateLimiter._getCapacity());
  rateLimiter._setLastRefill(timestamp);
}

/**
 * Hook for LLM provider interactions
 * @returns LLM provider utilities
 */
export function useLLMProvider(): UseLLMProviderReturn {
  const { config, validateConfig } = useLLMConfig();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Sends a completion request to the LLM
   * @param prompt - Prompt to send
   * @param options - Additional options
   * @returns LLM response
   */
  const complete = useCallback(
    async (prompt: string, options: CompleteOptions = {}): Promise<string> => {
      setIsProcessing(true);
      setError(null);

      try {
        // Check rate limit
        if (!rateLimiter.tryConsume()) {
          throw new Error(
            "Rate limit exceeded. Please wait before making another request.",
          );
        }

        // Refresh API key timeout on successful API usage
        refreshLLMConfigTimestamp();

        // Validate config
        const validation = validateConfig();
        if (!validation.isValid) {
          throw new Error(
            validation.errors?.[0] ||
              ERROR_MESSAGES[ERROR_CODES.INVALID_API_KEY],
          );
        }

        const requestBody = {
          model: config.model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: options.temperature ?? config.temperature,
          max_tokens: options.maxTokens ?? config.maxTokens,
        };

        // Add API key for OpenRouter
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (config.provider === "openrouter") {
          headers["Authorization"] = `Bearer ${config.apiKey}`;
          headers["HTTP-Referer"] = window.location.origin;
          headers["X-Title"] = "Privacy Policy Distiller";
        }

        // Determine endpoint and request body based on provider
        let endpoint: string;
        let body: string;

        if (config.provider === "ollama") {
          // Ollama uses /api/chat with different request format
          endpoint = `${config.baseUrl}/api/chat`;
          const ollamaBody = {
            model: config.model,
            messages: requestBody.messages,
            stream: false,
            options: {
              temperature: requestBody.temperature,
              num_predict: requestBody.max_tokens,
              num_ctx: (config as LLMConfig & { contextWindow?: number }).contextWindow || 8192,
            },
          };
          body = JSON.stringify(ollamaBody);
        } else {
          // OpenAI-compatible API (OpenRouter, LM Studio)
          endpoint = `${config.baseUrl}/chat/completions`;
          body = JSON.stringify(requestBody);
        }

        // Make request with retry logic
        const response = await retry(
          async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(
              () => controller.abort(),
              ANALYSIS_CONFIG.TIMEOUT_MS,
            );

            try {
              const res = await fetch(endpoint, {
                method: "POST",
                headers,
                body,
                signal: controller.signal,
              });

              clearTimeout(timeoutId);

              if (!res.ok) {
                if (res.status === 429) {
                  throw new Error(ERROR_MESSAGES[ERROR_CODES.LLM_RATE_LIMITED]);
                }
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
              }

              return res;
            } catch (err) {
              clearTimeout(timeoutId);
              if (err instanceof Error && err.name === "AbortError") {
                throw new Error(ERROR_MESSAGES[ERROR_CODES.LLM_TIMEOUT]);
              }
              throw err;
            }
          },
          ANALYSIS_CONFIG.RETRY_ATTEMPTS,
          ANALYSIS_CONFIG.RETRY_DELAY_MS,
        );

        const data = await response.json();

        // Extract response text based on provider format
        let responseText: string;

        if (config.provider === "ollama") {
          // Ollama format: { message: { content: "..." } }
          if (!data.message || !data.message.content) {
            throw new Error(ERROR_MESSAGES[ERROR_CODES.LLM_INVALID_RESPONSE]);
          }
          responseText = data.message.content;
        } else {
          // OpenAI format: { choices: [{ message: { content: "..." } }] }
          if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error(ERROR_MESSAGES[ERROR_CODES.LLM_INVALID_RESPONSE]);
          }
          responseText = data.choices[0].message.content;
        }

        setIsProcessing(false);
        return responseText;
      } catch (err) {
        const errorMessage =
          (err instanceof Error ? err.message : null) ||
          ERROR_MESSAGES[ERROR_CODES.LLM_REQUEST_FAILED];
        setError(errorMessage);
        setIsProcessing(false);
        throw new Error(errorMessage);
      }
    },
    [config, validateConfig],
  );

  /**
   * Clears error state
   */
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  return {
    complete,
    isProcessing,
    error,
    clearError,
    config,
  };
}
