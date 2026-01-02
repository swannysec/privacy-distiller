/**
 * @file Tests for useLLMProvider hook and TokenBucket rate limiter
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLLMProvider, __resetRateLimiter } from "./useLLMProvider.js";
import * as LLMConfigContext from "../contexts/LLMConfigContext.jsx";

// Define types for mocks
interface MockConfig {
  provider: string;
  apiKey: string;
  model: string;
  baseUrl: string;
  temperature: number;
  maxTokens: number;
  contextWindow?: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Mock the LLMConfigContext
vi.mock("../contexts/LLMConfigContext.jsx", () => ({
  useLLMConfig: vi.fn(),
}));

// Common error messages
const RATE_LIMIT_ERROR =
  "Rate limit exceeded. Please wait before making another request.";
const HTTP_RATE_LIMIT_ERROR =
  "Rate limit exceeded. Please wait a moment and try again.";
const INVALID_RESPONSE_ERROR =
  "Received invalid response from AI. Please try again.";
const DEFAULT_API_KEY_ERROR = "Please enter a valid API key";

describe("useLLMProvider - TokenBucket Rate Limiting", () => {
  let mockConfig: MockConfig;
  let mockValidateConfig: ReturnType<typeof vi.fn<[], ValidationResult>>;

  /**
   * Sets up fake timers with a specific timestamp and resets the rate limiter
   */
  function setupFakeTimers(isoDate: string): void {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(isoDate));
    __resetRateLimiter(Date.now());
  }

  /**
   * Creates a mock fetch response for OpenRouter/LM Studio format
   */
  function mockOpenAIResponse(content: string) {
    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { content } }],
      }),
    };
  }

  /**
   * Creates a mock fetch response for Ollama format
   */
  function mockOllamaResponse(content: string) {
    return {
      ok: true,
      json: async () => ({
        message: { content },
      }),
    };
  }

  /**
   * Configures mockConfig for Ollama provider
   */
  function configureOllama(contextWindow?: number): void {
    mockConfig.provider = "ollama";
    mockConfig.baseUrl = "http://localhost:11434";
    mockConfig.model = "llama3.1";
    if (contextWindow) {
      mockConfig.contextWindow = contextWindow;
    }
  }

  /**
   * Exhausts the rate limiter by making 10 successful requests
   */
  async function exhaustRateLimit(result: { current: { complete: (prompt: string) => Promise<string> } }): Promise<void> {
    for (let i = 0; i < 10; i++) {
      await result.current.complete(`Test ${i}`);
    }
  }

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    __resetRateLimiter();

    mockConfig = {
      provider: "openrouter",
      apiKey: "test-api-key",
      model: "anthropic/claude-3.5-sonnet",
      baseUrl: "https://openrouter.ai/api/v1",
      temperature: 0.7,
      maxTokens: 4096,
    };

    mockValidateConfig = vi.fn<[], ValidationResult>().mockReturnValue({
      isValid: true,
      errors: [],
    });

    (LLMConfigContext.useLLMConfig as ReturnType<typeof vi.fn>).mockReturnValue({
      config: mockConfig,
      validateConfig: mockValidateConfig,
    });
  });

  it("should allow requests up to capacity (10) and reject 11th request", async () => {
    setupFakeTimers("2024-01-01T00:00:00Z");

    const { result } = renderHook(() => useLLMProvider());
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOpenAIResponse("Test response"));

    // Make 10 requests (the capacity) - should all succeed
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(result.current.complete(`Test prompt ${i}`));
    }

    const results = await Promise.all(promises);
    expect(results).toHaveLength(10);
    expect(global.fetch).toHaveBeenCalledTimes(10);

    // 11th request should be rate limited
    await act(async () => {
      await expect(result.current.complete("Test prompt 11")).rejects.toThrow(
        RATE_LIMIT_ERROR,
      );
    });

    expect(global.fetch).toHaveBeenCalledTimes(10);
    expect(result.current.error).toBe(RATE_LIMIT_ERROR);
    expect(result.current.isProcessing).toBe(false);

    vi.useRealTimers();
  });

  it("should refill tokens over time (6 seconds per token)", async () => {
    setupFakeTimers("2024-01-01T00:01:00Z");

    const { result } = renderHook(() => useLLMProvider());
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOpenAIResponse("Test response"));

    await exhaustRateLimit(result);

    // Should fail immediately
    await expect(result.current.complete("Fail")).rejects.toThrow(
      RATE_LIMIT_ERROR,
    );

    // Advance time by 6 seconds (1 token refilled)
    vi.advanceTimersByTime(6000);

    // Should succeed now
    const response = await result.current.complete("Success");
    expect(response).toBe("Test response");

    vi.useRealTimers();
  });

  it("should work with OpenRouter provider", async () => {
    setupFakeTimers("2024-01-01T00:02:00Z");

    const { result } = renderHook(() => useLLMProvider());
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOpenAIResponse("OpenRouter response"));

    const response = await result.current.complete("Test prompt");

    expect(response).toBe("OpenRouter response");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-api-key",
          "HTTP-Referer": window.location.origin,
          "X-Title": "Privacy Policy Distiller",
        }),
      }),
    );

    vi.useRealTimers();
  });

  it("should work with Ollama provider", async () => {
    setupFakeTimers("2024-01-01T00:03:00Z");
    configureOllama();

    const { result } = renderHook(() => useLLMProvider());
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOllamaResponse("Ollama response"));

    const response = await result.current.complete("Test prompt");

    expect(response).toBe("Ollama response");
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:11434/api/chat",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("llama3.1"),
      }),
    );

    vi.useRealTimers();
  });

  it("should check rate limit before validating config", async () => {
    setupFakeTimers("2024-01-01T00:04:00Z");

    const { result } = renderHook(() => useLLMProvider());
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOpenAIResponse("Test response"));

    await exhaustRateLimit(result);

    // Make validateConfig return invalid
    mockValidateConfig.mockReturnValue({
      isValid: false,
      errors: ["Invalid API key"],
    });

    // Should fail with rate limit error, not validation error
    await expect(result.current.complete("Test")).rejects.toThrow(
      RATE_LIMIT_ERROR,
    );

    // validateConfig should not have been called for the rate-limited request
    expect(mockValidateConfig).toHaveBeenCalledTimes(10);

    vi.useRealTimers();
  });

  it("should use exact rate limit error message", async () => {
    setupFakeTimers("2024-01-01T00:05:00Z");

    const { result } = renderHook(() => useLLMProvider());
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOpenAIResponse("Test response"));

    await exhaustRateLimit(result);

    const error = await result.current
      .complete("Rate limited")
      .catch((err: Error) => err);
    expect(error.message).toBe(RATE_LIMIT_ERROR);

    vi.useRealTimers();
  });

  it("should handle validation errors", async () => {
    setupFakeTimers("2024-01-01T00:06:00Z");

    mockValidateConfig.mockReturnValue({
      isValid: false,
      errors: ["Invalid API key format"],
    });

    const { result } = renderHook(() => useLLMProvider());

    await expect(result.current.complete("Test prompt")).rejects.toThrow(
      "Invalid API key format",
    );

    vi.useRealTimers();
  });

  it("should handle validation errors with no specific error message", async () => {
    setupFakeTimers("2024-01-01T00:07:00Z");

    mockValidateConfig.mockReturnValue({
      isValid: false,
      errors: [],
    });

    const { result } = renderHook(() => useLLMProvider());

    await expect(result.current.complete("Test prompt")).rejects.toThrow(
      DEFAULT_API_KEY_ERROR,
    );

    vi.useRealTimers();
  });

  it("should handle HTTP 429 rate limit response", async () => {
    vi.useRealTimers();
    __resetRateLimiter();

    const { result } = renderHook(() => useLLMProvider());

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
    });

    await expect(result.current.complete("Test prompt")).rejects.toThrow(
      HTTP_RATE_LIMIT_ERROR,
    );
  }, 15000);

  it("should handle non-429 HTTP errors", async () => {
    vi.useRealTimers();
    __resetRateLimiter();

    const { result } = renderHook(() => useLLMProvider());

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(result.current.complete("Test prompt")).rejects.toThrow(
      "HTTP 500: Internal Server Error",
    );
  }, 15000);

  it("should work with LM Studio provider", async () => {
    setupFakeTimers("2024-01-01T00:10:00Z");

    mockConfig.provider = "lmstudio";
    mockConfig.baseUrl = "http://localhost:1234/v1";
    mockConfig.model = "local-model";
    mockConfig.apiKey = "";

    const { result } = renderHook(() => useLLMProvider());
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOpenAIResponse("LM Studio response"));

    const response = await result.current.complete("Test prompt");

    expect(response).toBe("LM Studio response");
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:1234/v1/chat/completions",
      expect.anything(),
    );

    vi.useRealTimers();
  });

  it("should handle invalid Ollama response format", async () => {
    vi.useRealTimers();
    __resetRateLimiter();
    configureOllama();

    const { result } = renderHook(() => useLLMProvider());

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({}), // Missing message.content
    });

    await expect(result.current.complete("Test prompt")).rejects.toThrow(
      INVALID_RESPONSE_ERROR,
    );
  }, 15000);

  it("should handle invalid OpenRouter response format", async () => {
    vi.useRealTimers();
    __resetRateLimiter();

    const { result } = renderHook(() => useLLMProvider());

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({}), // Missing choices array
    });

    await expect(result.current.complete("Test prompt")).rejects.toThrow(
      INVALID_RESPONSE_ERROR,
    );
  }, 15000);

  it("should handle network errors", async () => {
    vi.useRealTimers();
    __resetRateLimiter();

    const { result } = renderHook(() => useLLMProvider());
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network error"));

    await expect(result.current.complete("Test prompt")).rejects.toThrow(
      "Network error",
    );
  }, 15000);

  it("should clear error state", () => {
    const { result } = renderHook(() => useLLMProvider());

    expect(typeof result.current.clearError).toBe("function");

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it("should use custom temperature and maxTokens options", async () => {
    setupFakeTimers("2024-01-01T00:15:00Z");

    const { result } = renderHook(() => useLLMProvider());
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOpenAIResponse("Test response"));

    await result.current.complete("Test prompt", {
      temperature: 0.5,
      maxTokens: 2000,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"temperature":0.5'),
      }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"max_tokens":2000'),
      }),
    );

    vi.useRealTimers();
  });

  it("should expose config from hook", () => {
    const { result } = renderHook(() => useLLMProvider());
    expect(result.current.config).toEqual(mockConfig);
  });

  it("should handle non-Error exceptions", async () => {
    vi.useRealTimers();
    __resetRateLimiter();

    const { result } = renderHook(() => useLLMProvider());
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue("string error");

    await expect(result.current.complete("Test prompt")).rejects.toThrow(
      "string error",
    );
  }, 15000);

  it("should handle Ollama with contextWindow option", async () => {
    setupFakeTimers("2024-01-01T00:17:00Z");
    configureOllama(16384);

    const { result } = renderHook(() => useLLMProvider());
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOllamaResponse("Ollama response"));

    await result.current.complete("Test prompt");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"num_ctx":16384'),
      }),
    );

    vi.useRealTimers();
  });
});
