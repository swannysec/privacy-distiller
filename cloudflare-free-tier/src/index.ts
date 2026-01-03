/**
 * Privacy Policy Analyzer - Free Tier LLM Proxy Worker
 *
 * A configurable Cloudflare Worker that proxies LLM API requests with:
 * - Optional Cloudflare Turnstile validation (bot protection)
 * - Configurable global daily request limits
 * - Free API key with spending cap
 * - Seamless fallback to user-provided (BYOK) keys
 *
 * Privacy considerations:
 * - No logging enabled (observability.enabled = false in wrangler.toml)
 * - No IP addresses or personal data are stored or tracked
 * - No cookies or authentication headers are forwarded to third parties
 * - All features are toggleable for privacy-conscious self-hosted deployments
 *
 * @license MIT License with Commercial Product Restriction
 * @copyright 2025-2026 John D. Swanson
 */

import type {
  Env,
  FreeTierStatus,
  ErrorResponse,
  FreeTierErrorCode,
} from "./types";
import { parseEnvBoolean, parseEnvList } from "./types";
import { validateTurnstileToken } from "./turnstile";
import { checkRateLimit } from "./ratelimit";
import { selectApiKey, getFreeStatus } from "./keySelector";

/**
 * OpenAI-compatible message format
 */
interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * OpenAI-compatible chat completion request
 */
interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

/**
 * Request body for the /api/analyze endpoint
 */
interface AnalyzeRequestBody {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  turnstileToken?: string;
  userApiKey?: string;
}

/**
 * Get CORS headers for a given origin
 */
function getCorsHeaders(
  origin: string | null,
  allowedOrigins: string[],
): HeadersInit {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Accept, Authorization, X-Turnstile-Token, X-User-Api-Key",
    "Access-Control-Expose-Headers": "x-key-source, x-free-remaining",
    "Access-Control-Max-Age": "86400",
  };

  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  } else if (allowedOrigins.includes("*")) {
    headers["Access-Control-Allow-Origin"] = "*";
  }

  return headers;
}

/**
 * Check if the request origin is allowed
 */
function isOriginAllowed(
  origin: string | null,
  allowedOrigins: string[],
): boolean {
  if (!origin) return false;
  if (allowedOrigins.includes("*")) return true;
  return allowedOrigins.includes(origin);
}

/**
 * Create a JSON error response
 */
function errorResponse(
  message: string,
  errorCode: FreeTierErrorCode,
  status: number,
  corsHeaders: HeadersInit,
  additionalData?: Record<string, unknown>,
): Response {
  const body: ErrorResponse = {
    success: false,
    error: message,
    errorCode,
    ...additionalData,
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

/**
 * Create a JSON success response
 */
function jsonResponse<T>(
  data: T,
  status: number,
  corsHeaders: HeadersInit,
  additionalHeaders?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...additionalHeaders,
    },
  });
}

/**
 * Handle CORS preflight requests
 */
function handleOptions(corsHeaders: HeadersInit): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * Parse and validate the analyze request body
 */
async function parseAnalyzeRequest(
  request: Request,
): Promise<AnalyzeRequestBody | null> {
  try {
    const body = await request.json();

    // Basic validation
    if (typeof body !== "object" || body === null) {
      return null;
    }

    const {
      model,
      messages,
      temperature,
      max_tokens,
      turnstileToken,
      userApiKey,
    } = body as Record<string, unknown>;

    // Required: model
    if (typeof model !== "string" || model.trim().length === 0) {
      return null;
    }

    // Required: messages array
    if (!Array.isArray(messages) || messages.length === 0) {
      return null;
    }

    // Validate message structure
    for (const msg of messages) {
      if (typeof msg !== "object" || msg === null) return null;
      const m = msg as Record<string, unknown>;
      if (
        typeof m["role"] !== "string" ||
        !["user", "assistant", "system"].includes(m["role"])
      ) {
        return null;
      }
      if (typeof m["content"] !== "string") return null;
    }

    // Get turnstile token from header or body
    const headerToken = request.headers.get("X-Turnstile-Token");
    const finalTurnstileToken =
      headerToken ||
      (typeof turnstileToken === "string" ? turnstileToken.trim() : undefined);

    // Get user API key from header or body
    const headerApiKey = request.headers.get("X-User-Api-Key");
    const finalUserApiKey =
      headerApiKey ||
      (typeof userApiKey === "string" ? userApiKey.trim() : undefined);

    return {
      model: model.trim(),
      messages: messages as ChatMessage[],
      temperature: typeof temperature === "number" ? temperature : undefined,
      max_tokens: typeof max_tokens === "number" ? max_tokens : undefined,
      turnstileToken: finalTurnstileToken || undefined,
      userApiKey: finalUserApiKey || undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Handle POST /api/analyze - Main LLM proxy endpoint
 *
 * Validates request, checks rate limits, selects API key,
 * and proxies the request to OpenRouter.
 */
async function handleAnalyze(
  request: Request,
  env: Env,
  corsHeaders: HeadersInit,
): Promise<Response> {
  // Parse request body
  const analyzeRequest = await parseAnalyzeRequest(request);
  if (!analyzeRequest) {
    return errorResponse(
      "Invalid request body",
      "INVALID_REQUEST",
      400,
      corsHeaders,
    );
  }

  // Check if Turnstile validation is required
  const turnstileEnabled = parseEnvBoolean(env.TURNSTILE_ENABLED);
  if (turnstileEnabled && env.TURNSTILE_SECRET_KEY) {
    if (!analyzeRequest.turnstileToken) {
      return errorResponse(
        "Turnstile token required",
        "TURNSTILE_FAILED",
        401,
        corsHeaders,
      );
    }

    const turnstileResult = await validateTurnstileToken(
      analyzeRequest.turnstileToken,
      env,
    );
    if (!turnstileResult.success) {
      return errorResponse(
        "Turnstile verification failed",
        "TURNSTILE_FAILED",
        401,
        corsHeaders,
      );
    }
  }

  // Check global rate limit (if enabled)
  const globalLimitEnabled = parseEnvBoolean(env.GLOBAL_LIMIT_ENABLED);
  if (globalLimitEnabled) {
    const rateLimitResult = await checkRateLimit(env);
    if (!rateLimitResult.allowed) {
      return errorResponse(
        `Daily rate limit exceeded. Resets at ${rateLimitResult.resetAt}`,
        "DAILY_LIMIT_REACHED",
        429,
        corsHeaders,
        { reset_at: rateLimitResult.resetAt },
      );
    }
  }

  // Select API key (free tier or BYOK)
  const keySelection = await selectApiKey(env, analyzeRequest.userApiKey);

  if (!keySelection.apiKey) {
    if (keySelection.error?.code === "FREE_KEY_EXHAUSTED") {
      return errorResponse(
        "Free tier daily limit reached. Please provide your own API key.",
        "FREE_KEY_EXHAUSTED",
        402,
        corsHeaders,
      );
    }
    if (keySelection.error?.code === "FREE_KEY_BALANCE_LOW") {
      return errorResponse(
        "Free tier budget exhausted. Please provide your own API key.",
        "FREE_KEY_EXHAUSTED",
        402,
        corsHeaders,
      );
    }
    return errorResponse(
      "No API key available. Please provide your own API key.",
      "NO_API_KEY",
      402,
      corsHeaders,
    );
  }

  // Prepare OpenRouter request
  const openRouterRequest: ChatCompletionRequest = {
    model: analyzeRequest.model,
    messages: analyzeRequest.messages,
    temperature: analyzeRequest.temperature ?? 0.7,
    max_tokens: analyzeRequest.max_tokens ?? 32000,
  };

  try {
    // Proxy to OpenRouter
    const openRouterResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${keySelection.apiKey}`,
          "HTTP-Referer": "https://korykilpatrick.github.io/policy-analyzer/",
          "X-Title": "Privacy Policy Distiller",
        },
        body: JSON.stringify(openRouterRequest),
      },
    );

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse
        .text()
        .catch(() => "Unknown error");
      console.error("OpenRouter error:", openRouterResponse.status, errorText);

      if (openRouterResponse.status === 429) {
        return errorResponse(
          "LLM rate limit exceeded. Please try again later.",
          "DAILY_LIMIT_REACHED",
          429,
          corsHeaders,
        );
      }

      return errorResponse(
        "Failed to process request",
        "INTERNAL_ERROR",
        502,
        corsHeaders,
      );
    }

    // Return OpenRouter response with our headers
    const responseData = await openRouterResponse.json();

    const additionalHeaders: Record<string, string> = {
      "x-key-source": keySelection.source,
    };

    if (
      keySelection.source === "free" &&
      keySelection.freeRemaining !== null &&
      keySelection.freeRemaining !== undefined
    ) {
      additionalHeaders["x-free-remaining"] = String(
        keySelection.freeRemaining,
      );
    }

    return jsonResponse(responseData, 200, corsHeaders, additionalHeaders);
  } catch (error) {
    // Sanitize error - never log request details that might contain API key
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("OpenRouter API error:", errorMessage);

    return errorResponse(
      "Failed to process request",
      "INTERNAL_ERROR",
      500,
      corsHeaders,
    );
  }
}

/**
 * Handle GET /api/status - Free tier status endpoint
 *
 * Returns current availability of free tier features.
 */
async function handleStatus(
  env: Env,
  corsHeaders: HeadersInit,
): Promise<Response> {
  const turnstileEnabled = parseEnvBoolean(env.TURNSTILE_ENABLED);

  try {
    const freeStatus = await getFreeStatus(env);

    const status: FreeTierStatus = {
      freeAvailable: freeStatus.free_available,
      dailyRemaining: freeStatus.daily_remaining,
      balanceRemaining: freeStatus.balance_remaining ?? 0,
      turnstileRequired: turnstileEnabled && !!env.TURNSTILE_SECRET_KEY,
      lastBalanceCheck: new Date().toISOString(),
    };

    return jsonResponse(status, 200, corsHeaders);
  } catch (error) {
    console.error(
      "Status check error:",
      error instanceof Error ? error.message : "Unknown",
    );

    // Return minimal status on error
    const status: FreeTierStatus = {
      freeAvailable: false,
      dailyRemaining: 0,
      balanceRemaining: 0,
      turnstileRequired: turnstileEnabled && !!env.TURNSTILE_SECRET_KEY,
    };

    return jsonResponse(status, 200, corsHeaders);
  }
}

/**
 * Handle GET /health - Health check endpoint
 */
function handleHealth(corsHeaders: HeadersInit): Response {
  return jsonResponse(
    { status: "ok", timestamp: new Date().toISOString() },
    200,
    corsHeaders,
  );
}

/**
 * Main request router
 */
async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin");
  const allowedOrigins = parseEnvList(env.ALLOWED_ORIGINS);
  const corsHeaders = getCorsHeaders(origin, allowedOrigins);

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return handleOptions(corsHeaders);
  }

  // Check origin for non-preflight requests with an Origin header
  if (origin && !isOriginAllowed(origin, allowedOrigins)) {
    return errorResponse(
      "Origin not allowed",
      "ORIGIN_NOT_ALLOWED",
      403,
      corsHeaders,
    );
  }

  // Route handling
  const path = url.pathname;

  // POST /api/analyze - Main LLM proxy endpoint
  if (path === "/api/analyze" && request.method === "POST") {
    return handleAnalyze(request, env, corsHeaders);
  }

  // GET /api/status - Free tier status endpoint
  if (path === "/api/status" && request.method === "GET") {
    return handleStatus(env, corsHeaders);
  }

  // GET /health - Health check endpoint
  if (path === "/health" && request.method === "GET") {
    return handleHealth(corsHeaders);
  }

  // Method not allowed for known paths
  if (path === "/api/analyze" || path === "/api/status") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        Allow: path === "/api/analyze" ? "POST, OPTIONS" : "GET, OPTIONS",
        ...corsHeaders,
      },
    });
  }

  // 404 for unknown paths
  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

/**
 * Worker entry point
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      // Log error for debugging (only in development - observability disabled in production)
      console.error(
        "Worker error:",
        error instanceof Error ? error.message : "Unknown",
      );

      const origin = request.headers.get("Origin");
      const allowedOrigins = parseEnvList(env.ALLOWED_ORIGINS);
      const corsHeaders = getCorsHeaders(origin, allowedOrigins);

      return errorResponse(
        "Internal server error",
        "INTERNAL_ERROR",
        500,
        corsHeaders,
      );
    }
  },
};
