/**
 * Tests for Key Selection Module
 * Verifies tier selection logic based on balance and rate limits
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { selectApiKey, getFreeStatus, KeySelectionErrors } from "./keySelector";
import { TIER_MODELS } from "./types";
import type { Env } from "./types";

// Mock the ratelimit and balance modules
vi.mock("./ratelimit", () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock("./balance", () => ({
  checkBalance: vi.fn(),
}));

import { checkRateLimit } from "./ratelimit";
import { checkBalance } from "./balance";

const mockCheckRateLimit = vi.mocked(checkRateLimit);
const mockCheckBalance = vi.mocked(checkBalance);

describe("keySelector", () => {
  // Mock environment with free tier configured
  const mockEnv: Env = {
    PRIVACY_DISTILLER_KV: {} as KVNamespace,
    TURNSTILE_ENABLED: "true",
    GLOBAL_LIMIT_ENABLED: "true",
    GLOBAL_DAILY_LIMIT: "100",
    ALLOWED_ORIGINS: "*",
    TURNSTILE_SECRET_KEY: "turnstile-secret",
    FREE_API_KEY: "sk-free-test-key",
  };

  // Mock environment without free tier
  const mockEnvNoFreeKey: Env = {
    ...mockEnv,
    FREE_API_KEY: "",
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("selectApiKey", () => {
    describe("BYOK (Bring Your Own Key)", () => {
      it("returns paid-user tier when user provides their own API key", async () => {
        const userApiKey = "sk-user-provided-key";

        const result = await selectApiKey(mockEnv, userApiKey);

        expect(result).toEqual({
          apiKey: userApiKey,
          source: "byok",
          freeRemaining: null,
          tier: "paid-user",
          model: "", // Client controls model for BYOK
          zdrEnabled: false,
        });

        // Should not check rate limit or balance for BYOK
        expect(mockCheckRateLimit).not.toHaveBeenCalled();
        expect(mockCheckBalance).not.toHaveBeenCalled();
      });

      it("prioritizes BYOK even when free tier is available", async () => {
        const userApiKey = "sk-user-key";

        mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 50 });
        mockCheckBalance.mockResolvedValue({ available: true, remaining: 4.5 });

        const result = await selectApiKey(mockEnv, userApiKey);

        expect(result.source).toBe("byok");
        expect(result.tier).toBe("paid-user");
        expect(result.apiKey).toBe(userApiKey);
      });
    });

    describe("paid-central tier (ZDR enabled)", () => {
      it("returns paid-central tier with ZDR when balance is available", async () => {
        mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 50 });
        mockCheckBalance.mockResolvedValue({ available: true, remaining: 4.5 });

        const result = await selectApiKey(mockEnv);

        expect(result).toEqual({
          apiKey: mockEnv.FREE_API_KEY,
          source: "free",
          freeRemaining: 50,
          tier: "paid-central",
          model: TIER_MODELS.PAID_CENTRAL,
          zdrEnabled: true,
        });
      });

      it("uses non-free model for paid-central tier", async () => {
        mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 25 });
        mockCheckBalance.mockResolvedValue({ available: true, remaining: 3.0 });

        const result = await selectApiKey(mockEnv);

        expect(result.model).toBe(TIER_MODELS.PAID_CENTRAL);
        expect(result.model).not.toContain(":free");
      });
    });

    describe("free tier (no ZDR)", () => {
      it("returns free tier without ZDR when balance is exhausted", async () => {
        mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 50 });
        mockCheckBalance.mockResolvedValue({
          available: false,
          remaining: 0.1,
        });

        const result = await selectApiKey(mockEnv);

        expect(result).toEqual({
          apiKey: mockEnv.FREE_API_KEY,
          source: "free",
          freeRemaining: 50,
          tier: "free",
          model: TIER_MODELS.FREE,
          zdrEnabled: false,
        });
      });

      it("uses :free model suffix for free tier", async () => {
        mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 25 });
        mockCheckBalance.mockResolvedValue({ available: false, remaining: 0 });

        const result = await selectApiKey(mockEnv);

        expect(result.model).toBe(TIER_MODELS.FREE);
        expect(result.model).toContain(":free");
      });
    });

    describe("rate limit exceeded", () => {
      it("returns error when rate limit is exceeded", async () => {
        mockCheckRateLimit.mockResolvedValue({ allowed: false, remaining: 0 });
        mockCheckBalance.mockResolvedValue({ available: true, remaining: 5.0 });

        const result = await selectApiKey(mockEnv);

        expect(result).toEqual({
          apiKey: null,
          source: "none",
          freeRemaining: 0,
          error: KeySelectionErrors.DAILY_LIMIT_REACHED,
          tier: "free",
          model: TIER_MODELS.FREE,
          zdrEnabled: false,
        });
      });

      it("does not check balance when rate limit is exceeded", async () => {
        mockCheckRateLimit.mockResolvedValue({ allowed: false, remaining: 0 });

        await selectApiKey(mockEnv);

        expect(mockCheckRateLimit).toHaveBeenCalled();
        expect(mockCheckBalance).not.toHaveBeenCalled();
      });
    });

    describe("no free tier configured", () => {
      it("returns error when no API key is available", async () => {
        const result = await selectApiKey(mockEnvNoFreeKey);

        expect(result).toEqual({
          apiKey: null,
          source: "none",
          freeRemaining: null,
          error: KeySelectionErrors.NO_API_KEY,
          tier: "free",
          model: TIER_MODELS.FREE,
          zdrEnabled: false,
        });
      });
    });
  });

  describe("getFreeStatus", () => {
    it("returns paid-central tier status when balance is available", async () => {
      mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 75 });
      mockCheckBalance.mockResolvedValue({ available: true, remaining: 4.25 });

      const result = await getFreeStatus(mockEnv);

      expect(result.tier).toBe("paid-central");
      expect(result.zdrEnabled).toBe(true);
      expect(result.paidBudgetExhausted).toBe(false);
      expect(result.free_available).toBe(true);
      expect(result.daily_remaining).toBe(75);
      expect(result.balance_remaining).toBe(4.25);
      expect(result.model).toBe("openai/gpt-oss-120b");
    });

    it("returns free tier status when balance is exhausted", async () => {
      mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 50 });
      mockCheckBalance.mockResolvedValue({ available: false, remaining: 0.5 });

      const result = await getFreeStatus(mockEnv);

      expect(result.tier).toBe("free");
      expect(result.zdrEnabled).toBe(false);
      expect(result.paidBudgetExhausted).toBe(true);
      expect(result.free_available).toBe(false);
      expect(result.model).toBe("openai/gpt-oss-120b:free");
    });

    it("returns unavailable when rate limit exceeded", async () => {
      mockCheckRateLimit.mockResolvedValue({ allowed: false, remaining: 0 });
      mockCheckBalance.mockResolvedValue({ available: true, remaining: 5.0 });

      const result = await getFreeStatus(mockEnv);

      expect(result.free_available).toBe(false);
      expect(result.daily_remaining).toBe(0);
    });

    it("includes reset_at as ISO timestamp for next midnight UTC", async () => {
      mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 50 });
      mockCheckBalance.mockResolvedValue({ available: true, remaining: 5.0 });

      const result = await getFreeStatus(mockEnv);

      expect(result.reset_at).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/);

      const resetDate = new Date(result.reset_at);
      const now = new Date();
      expect(resetDate.getTime()).toBeGreaterThan(now.getTime());
    });

    it("uses GLOBAL_DAILY_LIMIT from env", async () => {
      mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 50 });
      mockCheckBalance.mockResolvedValue({ available: true, remaining: 5.0 });

      const result = await getFreeStatus(mockEnv);

      expect(result.daily_limit).toBe(100); // From mockEnv.GLOBAL_DAILY_LIMIT
    });
  });
});
