/**
 * @file Analysis Context
 * @description Manages document analysis state and results
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { ANALYSIS_STATUS } from "../utils/constants.js";
import { generateId } from "../utils/helpers.js";
import { saveAnalysisToHistory } from "../utils/storage.js";

const AnalysisContext = createContext(null);

/**
 * Analysis Provider Component
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function AnalysisProvider({ children }) {
  const [state, setState] = useState({
    status: ANALYSIS_STATUS.IDLE,
    result: null,
    error: null,
    progress: 0,
    currentStep: null,
  });

  const [document, setDocument] = useState(null);

  /**
   * Sets the document to be analyzed
   * @param {import('../types').DocumentInput} doc
   */
  const setDocumentInput = useCallback((doc) => {
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
   * @param {number} progress - Progress percentage (0-100)
   * @param {string} currentStep - Description of current step
   */
  const updateProgress = useCallback((progress, currentStep) => {
    setState((prev) => ({
      ...prev,
      progress,
      currentStep,
    }));
  }, []);

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
   * @param {import('../types').AnalysisResult} result
   */
  const completeAnalysis = useCallback((result) => {
    const completeResult = {
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
   * @param {string} error - Error message
   */
  const setError = useCallback((error) => {
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
  const value = useMemo(() => {
    const stateValues = {
      status: state.status,
      result: state.result,
      error: state.error,
      progress: state.progress,
      currentStep: state.currentStep,
      document,
    };

    const actions = {
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

    const computed = {
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
 * @returns {Object} Analysis context value
 */
export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error("useAnalysis must be used within AnalysisProvider");
  }
  return context;
}
