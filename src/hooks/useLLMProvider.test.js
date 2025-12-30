/**
 * @file Tests for useLLMProvider hook and TokenBucket rate limiter
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLLMProvider, __resetRateLimiter } from './useLLMProvider.js';
import * as LLMConfigContext from '../contexts/LLMConfigContext.jsx';

// Mock the LLMConfigContext
vi.mock('../contexts/LLMConfigContext.jsx', () => ({
  useLLMConfig: vi.fn(),
}));

describe('useLLMProvider - TokenBucket Rate Limiting', () => {
  let mockConfig;
  let mockValidateConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();

    // Reset rate limiter state between tests to prevent token depletion
    __resetRateLimiter();

    mockConfig = {
      provider: 'openrouter',
      apiKey: 'test-api-key',
      model: 'anthropic/claude-3.5-sonnet',
      baseUrl: 'https://openrouter.ai/api/v1',
      temperature: 0.7,
      maxTokens: 4096,
    };

    mockValidateConfig = vi.fn().mockReturnValue({
      isValid: true,
      errors: [],
    });

    LLMConfigContext.useLLMConfig.mockReturnValue({
      config: mockConfig,
      validateConfig: mockValidateConfig,
    });
  });

  it('should allow requests up to capacity (10) and reject 11th request', async () => {
    // Use fake timers and advance to ensure full token bucket
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    __resetRateLimiter(Date.now()); // Reset with fake timer's current time

    const { result } = renderHook(() => useLLMProvider());

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Test response' } }],
      }),
    });

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
      await expect(
        result.current.complete('Test prompt 11')
      ).rejects.toThrow('Rate limit exceeded. Please wait before making another request.');
    });

    expect(global.fetch).toHaveBeenCalledTimes(10); // Still 10, not 11

    // Error state should be set after the async operation
    expect(result.current.error).toBe('Rate limit exceeded. Please wait before making another request.');
    expect(result.current.isProcessing).toBe(false);

    vi.useRealTimers();
  });

  it('should refill tokens over time (6 seconds per token)', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:01:00Z'));
    __resetRateLimiter(Date.now()); // Reset with fake timer's current time

    const { result } = renderHook(() => useLLMProvider());

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Test response' } }],
      }),
    });

    // Exhaust rate limit
    for (let i = 0; i < 10; i++) {
      await result.current.complete(`Test ${i}`);
    }

    // Should fail immediately
    await expect(
      result.current.complete('Fail')
    ).rejects.toThrow('Rate limit exceeded. Please wait before making another request.');

    // Advance time by 6 seconds (1 token refilled)
    vi.advanceTimersByTime(6000);

    // Should succeed now
    const response = await result.current.complete('Success');
    expect(response).toBe('Test response');

    vi.useRealTimers();
  });

  it('should work with OpenRouter provider', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:02:00Z'));
    __resetRateLimiter(Date.now()); // Reset with fake timer's current time

    const { result } = renderHook(() => useLLMProvider());

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'OpenRouter response' } }],
      }),
    });

    const response = await result.current.complete('Test prompt');

    expect(response).toBe('OpenRouter response');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-api-key',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Privacy Policy Distiller',
        }),
      })
    );

    vi.useRealTimers();
  });

  it('should work with Ollama provider', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:03:00Z'));
    __resetRateLimiter(Date.now()); // Reset with fake timer's current time

    mockConfig.provider = 'ollama';
    mockConfig.baseUrl = 'http://localhost:11434';
    mockConfig.model = 'llama3.1';

    const { result } = renderHook(() => useLLMProvider());

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        message: { content: 'Ollama response' },
      }),
    });

    const response = await result.current.complete('Test prompt');

    expect(response).toBe('Ollama response');
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/chat',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('llama3.1'),
      })
    );

    vi.useRealTimers();
  });

  it('should check rate limit before validating config', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:04:00Z'));
    __resetRateLimiter(Date.now()); // Reset with fake timer's current time

    const { result } = renderHook(() => useLLMProvider());

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Test response' } }],
      }),
    });

    // Exhaust rate limit
    for (let i = 0; i < 10; i++) {
      await result.current.complete(`Test ${i}`);
    }

    // Make validateConfig return invalid
    mockValidateConfig.mockReturnValue({
      isValid: false,
      errors: ['Invalid API key'],
    });

    // Should fail with rate limit error, not validation error
    await expect(
      result.current.complete('Test')
    ).rejects.toThrow('Rate limit exceeded. Please wait before making another request.');

    // validateConfig should not have been called for the rate-limited request
    expect(mockValidateConfig).toHaveBeenCalledTimes(10);

    vi.useRealTimers();
  });

  it('should use exact rate limit error message', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:05:00Z'));
    __resetRateLimiter(Date.now()); // Reset with fake timer's current time

    const { result } = renderHook(() => useLLMProvider());

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Test response' } }],
      }),
    });

    // Exhaust rate limit
    for (let i = 0; i < 10; i++) {
      await result.current.complete(`Test ${i}`);
    }

    // Verify exact error message
    const error = await result.current.complete('Rate limited').catch(err => err);
    expect(error.message).toBe('Rate limit exceeded. Please wait before making another request.');

    vi.useRealTimers();
  });
});
