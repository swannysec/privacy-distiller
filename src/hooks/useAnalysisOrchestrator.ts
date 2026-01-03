/**
 * @file Analysis Orchestration hook
 * @description Orchestrates the full analysis process, delegating to PolicyAnalyzer
 */

import React, { useCallback, useRef, useEffect } from "react";
import { useAnalysis } from "../contexts/AnalysisContext.jsx";
import { useDocumentExtractor } from "./useDocumentExtractor";
import { useLLMProvider } from "./useLLMProvider";
import { useTurnstile } from "./useTurnstile";
import { PolicyAnalyzer } from "../services/analysis/PolicyAnalyzer";
import { HostedFreeTierProvider } from "../services/llm/HostedFreeTierProvider";
import { TURNSTILE_SITE_KEY, FREE_TIER_ENABLED } from "../utils/constants";
import type { LLMConfig, DocumentInput, AnalysisResult } from "../types";

/**
 * Extended LLM config with optional contextWindow
 */
interface ExtendedLLMConfig extends LLMConfig {
  contextWindow?: number;
}

/**
 * Context window validation result
 */
interface ContextWindowValidation {
  valid: boolean;
  error?: string;
  contextLength?: number;
  estimatedTokens?: number;
}

/**
 * Return type for useAnalysisOrchestrator hook
 */
export interface UseAnalysisOrchestratorReturn {
  /** Analyze a document from URL */
  analyzeUrl: (url: string) => Promise<void>;
  /** Analyze a PDF file */
  analyzePdf: (file: File) => Promise<void>;
  /** Unified analysis entry point */
  startAnalysis: (
    documentInput: DocumentInput,
    config?: LLMConfig,
  ) => Promise<void>;
  /** Current analysis status */
  status: string;
  /** Analysis result if completed */
  result: AnalysisResult | null;
  /** Error message if status is 'error' */
  error: string | null;
  /** Progress percentage (0-100) */
  progress: number;
  /** Description of current step */
  currentStep: string | null;
  /** Document being analyzed */
  document: DocumentInput | null;
  /** Set document input */
  setDocumentInput: (doc: DocumentInput) => void;
  /** Update progress */
  updateProgress: (progress: number, currentStep: string) => void;
  /** Set status to analyzing */
  setAnalyzing: () => void;
  /** Complete analysis with results */
  completeAnalysis: (result: AnalysisResult) => void;
  /** Set error state */
  setError: (error: string) => void;
  /** Reset analysis state */
  resetAnalysis: () => void;
  /** Clear results but keep document */
  clearResults: () => void;
  /** Clear error state */
  clearError: () => void;
  /** Whether status is idle */
  isIdle: boolean;
  /** Whether status is extracting */
  isExtracting: boolean;
  /** Whether status is analyzing */
  isAnalyzing: boolean;
  /** Whether status is completed */
  isCompleted: boolean;
  /** Whether status is error */
  isError: boolean;
  /** Whether there is a result */
  hasResult: boolean;
  /** Turnstile component for hosted-free provider (render in DOM when using hosted-free) */
  TurnstileComponent: React.FC;
  /** Whether Turnstile is ready (has valid token or not required) */
  isTurnstileReady: boolean;
  /** Refresh Turnstile token (call after failed request or token expiry) */
  refreshTurnstile: () => void;
}

// Default context windows for local providers (conservative estimates)
const DEFAULT_CONTEXT_WINDOWS: Record<string, number> = {
  ollama: 8192, // Most Ollama models default to 8K
  lmstudio: 8192, // Conservative default for LM Studio
};

// Rough estimate: ~4 characters per token (varies by model/language)
const CHARS_PER_TOKEN = 4;

// Reserve tokens for prompts and response (the prompts + expected output)
const RESERVED_TOKENS = 8000;

/**
 * Fetches model context length from OpenRouter API
 * @param modelId - Model ID (e.g., "anthropic/claude-3.5-sonnet")
 * @param apiKey - OpenRouter API key
 * @returns Context length in tokens, or null if unavailable
 */
async function fetchOpenRouterModelContextLength(
  modelId: string,
  apiKey: string,
): Promise<number | null> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const model = data.data?.find(
      (m: { id: string; context_length?: number }) => m.id === modelId,
    );

    return model?.context_length || null;
  } catch {
    return null;
  }
}

/**
 * Validates that document fits within model's context window
 * @param text - Document text
 * @param config - LLM configuration
 * @returns Validation result
 */
async function validateContextWindow(
  text: string,
  config: ExtendedLLMConfig,
): Promise<ContextWindowValidation> {
  const charCount = text.length;
  const estimatedTokens = Math.ceil(charCount / CHARS_PER_TOKEN);

  let contextLength: number | null = null;

  // Get context length based on provider
  // First check if user has configured a custom context window
  if (config.contextWindow && config.contextWindow > 0) {
    contextLength = config.contextWindow;
  } else if (
    config.provider === "openrouter" &&
    config.apiKey &&
    config.model
  ) {
    // For OpenRouter, auto-detect from API
    contextLength = await fetchOpenRouterModelContextLength(
      config.model,
      config.apiKey,
    );
  } else if (config.provider === "ollama" || config.provider === "lmstudio") {
    // For local providers, use conservative defaults
    contextLength = DEFAULT_CONTEXT_WINDOWS[config.provider];
  }

  // If we couldn't determine context length, skip validation
  if (!contextLength) {
    return { valid: true };
  }

  // Available tokens = context window - reserved for prompts/response
  const availableTokens = contextLength - RESERVED_TOKENS;

  if (estimatedTokens > availableTokens) {
    const modelName = config.model || config.provider;
    const contextK = Math.round(contextLength / 1000);
    const estimatedK = Math.round(estimatedTokens / 1000);
    const isLocalProvider =
      config.provider === "ollama" || config.provider === "lmstudio";

    let suggestion = "Please use a shorter document.";
    if (isLocalProvider) {
      suggestion =
        "Consider using OpenRouter with a large-context model (e.g., Claude, GPT-4, or Gemini), or use a shorter document.";
    } else {
      suggestion =
        "Please try a model with a larger context window, or use a shorter document.";
    }

    return {
      valid: false,
      error: `Document is too large for the selected model. The document is approximately ${estimatedK.toLocaleString()}K tokens, but "${modelName}" has a ${contextK}K token context window. ${suggestion}`,
      contextLength,
      estimatedTokens,
    };
  }

  return { valid: true, contextLength, estimatedTokens };
}

/**
 * Hook for orchestrating document analysis
 * Handles document extraction, state management, and error handling
 * Delegates actual LLM analysis to PolicyAnalyzer service
 * @returns Analysis orchestration utilities
 */
export function useAnalysisOrchestrator(): UseAnalysisOrchestratorReturn {
  const analysis = useAnalysis();
  const extractor = useDocumentExtractor();
  const llm = useLLMProvider();

  // Determine if we need Turnstile (only for hosted-free provider)
  const isHostedFree = llm.config.provider === "hosted-free";
  const turnstileEnabled = isHostedFree && FREE_TIER_ENABLED;

  // Initialize Turnstile hook
  const {
    token: turnstileToken,
    isReady: turnstileIsReady,
    refresh: refreshTurnstile,
    TurnstileComponent,
  } = useTurnstile({
    siteKey: TURNSTILE_SITE_KEY,
    enabled: turnstileEnabled,
  });

  // Turnstile is ready if: not using hosted-free, OR turnstile hook says ready
  const isTurnstileReady = !turnstileEnabled || turnstileIsReady;

  /**
   * Creates a PolicyAnalyzer instance with proper provider setup
   * For hosted-free, creates provider manually, obtains session token,
   * and configures the provider for parallel API calls.
   */
  const createAnalyzer = useCallback(async (): Promise<PolicyAnalyzer> => {
    if (isHostedFree) {
      // Create hosted-free provider manually
      const provider = new HostedFreeTierProvider(llm.config);

      if (turnstileToken) {
        provider.setTurnstileToken(turnstileToken);
        // Obtain session token for parallel requests
        // This consumes the Turnstile token and returns a reusable JWT
        await provider.getSessionToken();
      }

      return new PolicyAnalyzer(llm.config, provider);
    }
    // For other providers, let PolicyAnalyzer create the provider
    return new PolicyAnalyzer(llm.config);
  }, [isHostedFree, llm.config, turnstileToken]);

  // Ref to hold simulated progress interval
  const simulatedProgressRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  /**
   * Start simulated progress updates during long operations
   * @param startProgress - Starting progress value
   * @param maxProgress - Maximum progress value (won't exceed this)
   * @param message - Progress message to show
   */
  const startSimulatedProgress = useCallback(
    (startProgress: number, maxProgress: number, message: string): void => {
      // Clear any existing interval
      if (simulatedProgressRef.current) {
        clearInterval(simulatedProgressRef.current);
      }

      let currentProgress = startProgress;
      simulatedProgressRef.current = setInterval(() => {
        // Add small random increment (0.5-2%)
        const increment = 0.5 + Math.random() * 1.5;
        currentProgress = Math.min(currentProgress + increment, maxProgress);
        analysis.updateProgress(currentProgress, message);
      }, 800);
    },
    [analysis],
  );

  /**
   * Stop simulated progress updates
   */
  const stopSimulatedProgress = useCallback((): void => {
    if (simulatedProgressRef.current) {
      clearInterval(simulatedProgressRef.current);
      simulatedProgressRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simulatedProgressRef.current) {
        clearInterval(simulatedProgressRef.current);
      }
    };
  }, []);

  /**
   * Analyzes a document from URL
   * @param url - Document URL
   */
  const analyzeUrl = useCallback(
    async (url: string): Promise<void> => {
      try {
        // For hosted-free provider, ensure Turnstile token is available
        if (isHostedFree && !turnstileToken) {
          throw new Error(
            "Verification in progress. Please wait a moment and try again.",
          );
        }

        // Set document input (format matches what startAnalysis expects for retry)
        analysis.setDocumentInput({
          type: "url",
          source: url,
        });

        // Start analysis
        analysis.startAnalysis();
        analysis.updateProgress(5, "Fetching document from URL...");

        // Start simulated progress during URL fetch
        startSimulatedProgress(5, 25, "Fetching document from URL...");

        // Extract text
        const rawText = await extractor.extractFromUrl(url);
        stopSimulatedProgress();

        analysis.updateProgress(30, "Document text extracted successfully");

        // Validate context window before sending to LLM
        analysis.updateProgress(32, "Checking model context limits...");
        const contextValidation = await validateContextWindow(
          rawText,
          llm.config as ExtendedLLMConfig,
        );
        if (!contextValidation.valid) {
          throw new Error(contextValidation.error);
        }

        // Begin LLM analysis
        analysis.setAnalyzing();

        // Start simulated progress during LLM analysis
        startSimulatedProgress(35, 85, "Analyzing policy with AI...");

        // Create analyzer with proper provider setup (handles Turnstile for hosted-free)
        const analyzer = await createAnalyzer();
        const analysisResult = await analyzer.analyze(
          rawText,
          (progress: number, message: string) => {
            stopSimulatedProgress();
            analysis.updateProgress(progress, message);
          },
          true, // useParallel = true for Promise.allSettled
        );
        stopSimulatedProgress();

        // Refresh Turnstile token after use (tokens are single-use)
        if (isHostedFree) {
          refreshTurnstile();
        }

        // Transform PolicyAnalyzer result format to orchestrator format
        const result: AnalysisResult = {
          id: analysisResult.id,
          documentMetadata: {
            source: url,
            type: "url",
            rawText,
          },
          summary: {
            brief: analysisResult.summaries[0].content,
            detailed: analysisResult.summaries[1].content,
            full: analysisResult.summaries[2].content,
          },
          risks: analysisResult.risks,
          keyTerms: analysisResult.keyTerms,
          scorecard: analysisResult.scorecard,
          timestamp: analysisResult.timestamp,
          llmConfig: analysisResult.llmConfig,
          partialFailures: analysisResult.partialFailures || [],
          hasPartialFailures: analysisResult.hasPartialFailures || false,
        };

        // Complete analysis
        analysis.completeAnalysis(result);
      } catch (err) {
        stopSimulatedProgress();
        analysis.setError(
          (err instanceof Error ? err.message : null) ||
            "Failed to analyze document",
        );
      }
    },
    [
      analysis,
      extractor,
      llm,
      startSimulatedProgress,
      stopSimulatedProgress,
      createAnalyzer,
      isHostedFree,
      turnstileToken,
      refreshTurnstile,
    ],
  );

  /**
   * Analyzes a PDF file
   * @param file - PDF file
   */
  const analyzePdf = useCallback(
    async (file: File): Promise<void> => {
      try {
        // For hosted-free provider, ensure Turnstile token is available
        if (isHostedFree && !turnstileToken) {
          throw new Error(
            "Verification in progress. Please wait a moment and try again.",
          );
        }

        // Set document input (format matches what startAnalysis expects for retry)
        analysis.setDocumentInput({
          type: "file",
          source: file,
        });

        // Start analysis
        analysis.startAnalysis();
        analysis.updateProgress(5, "Reading PDF file...");

        // Start simulated progress during PDF extraction
        startSimulatedProgress(5, 25, "Reading PDF file...");

        // Extract text
        const rawText = await extractor.extractFromPdf(file);
        stopSimulatedProgress();

        analysis.updateProgress(30, "PDF text extracted successfully");

        // Validate context window before sending to LLM
        analysis.updateProgress(32, "Checking model context limits...");
        const contextValidation = await validateContextWindow(
          rawText,
          llm.config as ExtendedLLMConfig,
        );
        if (!contextValidation.valid) {
          throw new Error(contextValidation.error);
        }

        // Begin LLM analysis
        analysis.setAnalyzing();

        // Start simulated progress during LLM analysis
        startSimulatedProgress(35, 85, "Analyzing policy with AI...");

        // Create analyzer with proper provider setup (handles Turnstile for hosted-free)
        const analyzer = await createAnalyzer();
        const analysisResult = await analyzer.analyze(
          rawText,
          (progress: number, message: string) => {
            stopSimulatedProgress();
            analysis.updateProgress(progress, message);
          },
          true, // useParallel = true for Promise.allSettled
        );
        stopSimulatedProgress();

        // Refresh Turnstile token after use (tokens are single-use)
        if (isHostedFree) {
          refreshTurnstile();
        }

        // Transform PolicyAnalyzer result format to orchestrator format
        const result: AnalysisResult = {
          id: analysisResult.id,
          documentMetadata: {
            source: file.name,
            type: "pdf",
            file: { name: file.name, size: file.size, type: file.type },
            rawText,
          },
          summary: {
            brief: analysisResult.summaries[0].content,
            detailed: analysisResult.summaries[1].content,
            full: analysisResult.summaries[2].content,
          },
          risks: analysisResult.risks,
          keyTerms: analysisResult.keyTerms,
          scorecard: analysisResult.scorecard,
          timestamp: analysisResult.timestamp,
          llmConfig: analysisResult.llmConfig,
          partialFailures: analysisResult.partialFailures || [],
          hasPartialFailures: analysisResult.hasPartialFailures || false,
        };

        // Complete analysis
        analysis.completeAnalysis(result);
      } catch (err) {
        stopSimulatedProgress();
        analysis.setError(
          (err instanceof Error ? err.message : null) ||
            "Failed to analyze PDF",
        );
      }
    },
    [
      analysis,
      extractor,
      llm,
      startSimulatedProgress,
      stopSimulatedProgress,
      createAnalyzer,
      isHostedFree,
      turnstileToken,
      refreshTurnstile,
    ],
  );

  /**
   * Unified analysis entry point - dispatches to appropriate handler based on document type
   * @param documentInput - Document input from DocumentInput component
   * @param _config - LLM config (unused, llm hook gets config from context)
   */
  const startAnalysis = useCallback(
    async (
      documentInput: DocumentInput,
      _config?: LLMConfig,
    ): Promise<void> => {
      if (documentInput.type === "url") {
        return analyzeUrl(documentInput.source as string);
      } else if (documentInput.type === "file") {
        return analyzePdf(documentInput.source as File);
      } else {
        throw new Error(
          `Unknown document type: ${(documentInput as DocumentInput).type}`,
        );
      }
    },
    [analyzeUrl, analyzePdf],
  );

  return {
    // Spread analysis context first, then override with orchestrator's functions
    ...analysis,
    analyzeUrl,
    analyzePdf,
    startAnalysis,
    // Turnstile integration for hosted-free provider
    TurnstileComponent,
    isTurnstileReady,
    refreshTurnstile,
  };
}
