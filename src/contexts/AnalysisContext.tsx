/**
 * @file Analysis Context
 * @description Manages document analysis state and results
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { ANALYSIS_STATUS } from "../utils/constants.js";
import { generateId } from "../utils/helpers.js";
import { saveAnalysisToHistory } from "../utils/storage.js";
import type {
  DocumentInput,
  AnalysisResult,
  AnalysisStatus,
} from "../types/index.js";

/**
 * Internal state shape for analysis
 */
interface InternalAnalysisState {
  status: AnalysisStatus;
  result: AnalysisResult | null;
  error: string | null;
  progress: number;
  currentStep: string | null;
}

/**
 * State values exposed by context
 */
interface AnalysisStateValues extends InternalAnalysisState {
  document: DocumentInput | null;
}

/**
 * Actions available in context
 */
interface AnalysisActions {
  setDocumentInput: (doc: DocumentInput) => void;
  startAnalysis: () => void;
  updateProgress: (progress: number, currentStep: string) => void;
  setAnalyzing: () => void;
  completeAnalysis: (result: AnalysisResult) => void;
  setError: (error: string) => void;
  resetAnalysis: () => void;
  clearResults: () => void;
  clearError: () => void;
}

/**
 * Computed values derived from state
 */
interface AnalysisComputed {
  isIdle: boolean;
  isExtracting: boolean;
  isAnalyzing: boolean;
  isCompleted: boolean;
  isError: boolean;
  hasResult: boolean;
}

/**
 * Complete context value type
 */
interface AnalysisContextValue
  extends AnalysisStateValues, AnalysisActions, AnalysisComputed {
  // Grouped structure (preferred)
  state: AnalysisStateValues;
  actions: AnalysisActions;
  computed: AnalysisComputed;
}

const AnalysisContext = createContext<AnalysisContextValue | undefined>(
  undefined,
);

/**
 * Analysis Provider Component Props
 */
interface AnalysisProviderProps {
  children: ReactNode;
}

/**
 * Analysis Provider Component
 */
export function AnalysisProvider({ children }: AnalysisProviderProps) {
  const [state, setState] = useState<InternalAnalysisState>({
    status: ANALYSIS_STATUS.IDLE,
    result: null,
    error: null,
    progress: 0,
    currentStep: null,
  });

  const [document, setDocument] = useState<DocumentInput | null>(null);

  /**
   * Sets the document to be analyzed
   */
  const setDocumentInput = useCallback((doc: DocumentInput) => {
    setDocument(doc);
    setState((prev) => ({
      ...prev,
      status: ANALYSIS_STATUS.IDLE,
      result: null,
      error: null,
      progress: 0,
      currentStep: null,
    }));
  }, []);

  /**
   * Starts the analysis process
   */
  const startAnalysis = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: ANALYSIS_STATUS.EXTRACTING,
      error: null,
      progress: 0,
      currentStep: "Extracting document text...",
    }));
  }, []);

  /**
   * Updates analysis progress
   */
  const updateProgress = useCallback(
    (progress: number, currentStep: string) => {
      setState((prev) => ({
        ...prev,
        progress,
        currentStep,
      }));
    },
    [],
  );

  /**
   * Sets status to analyzing
   */
  const setAnalyzing = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: ANALYSIS_STATUS.ANALYZING,
      progress: 25,
      currentStep: "Analyzing policy document...",
    }));
  }, []);

  /**
   * Completes the analysis with results
   */
  const completeAnalysis = useCallback((result: AnalysisResult) => {
    const completeResult: AnalysisResult = {
      ...result,
      id: result.id || generateId(),
      timestamp: result.timestamp || new Date(),
    };

    setState({
      status: ANALYSIS_STATUS.COMPLETED,
      result: completeResult,
      error: null,
      progress: 100,
      currentStep: "Analysis complete",
    });

    // Save to history
    saveAnalysisToHistory(completeResult);
  }, []);

  /**
   * Sets error state
   */
  const setError = useCallback((error: string) => {
    setState((prev) => ({
      ...prev,
      status: ANALYSIS_STATUS.ERROR,
      error,
      progress: 0,
      currentStep: null,
    }));
  }, []);

  /**
   * Resets analysis state
   */
  const resetAnalysis = useCallback(() => {
    setState({
      status: ANALYSIS_STATUS.IDLE,
      result: null,
      error: null,
      progress: 0,
      currentStep: null,
    });
    setDocument(null);
  }, []);

  /**
   * Clears current results but keeps document
   */
  const clearResults = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: ANALYSIS_STATUS.IDLE,
      result: null,
      error: null,
      progress: 0,
      currentStep: null,
    }));
  }, []);

  /**
   * Clears error state but keeps document for retry
   */
  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: ANALYSIS_STATUS.IDLE,
      error: null,
      progress: 0,
      currentStep: null,
    }));
  }, []);

  // Memoized context value to prevent unnecessary re-renders
  const value = useMemo((): AnalysisContextValue => {
    const stateValues: AnalysisStateValues = {
      status: state.status,
      result: state.result,
      error: state.error,
      progress: state.progress,
      currentStep: state.currentStep,
      document,
    };

    const actions: AnalysisActions = {
      setDocumentInput,
      startAnalysis,
      updateProgress,
      setAnalyzing,
      completeAnalysis,
      setError,
      resetAnalysis,
      clearResults,
      clearError,
    };

    const computed: AnalysisComputed = {
      isIdle: state.status === ANALYSIS_STATUS.IDLE,
      isExtracting: state.status === ANALYSIS_STATUS.EXTRACTING,
      isAnalyzing: state.status === ANALYSIS_STATUS.ANALYZING,
      isCompleted: state.status === ANALYSIS_STATUS.COMPLETED,
      isError: state.status === ANALYSIS_STATUS.ERROR,
      hasResult: state.result !== null,
    };

    return {
      // Grouped structure (preferred)
      state: stateValues,
      actions,
      computed,

      // Flat structure (backward compatibility)
      ...stateValues,
      ...actions,
      ...computed,
    };
  }, [
    state,
    document,
    setDocumentInput,
    startAnalysis,
    updateProgress,
    setAnalyzing,
    completeAnalysis,
    setError,
    resetAnalysis,
    clearResults,
    clearError,
  ]);

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
}

/**
 * Hook to use analysis context
 * @throws Error if used outside AnalysisProvider
 */
export function useAnalysis(): AnalysisContextValue {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error("useAnalysis must be used within AnalysisProvider");
  }
  return context;
}
