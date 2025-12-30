import { useState, useCallback } from "react";
import { exportToPDF } from "./utils/pdfExport";
import {
  LLMConfigProvider,
  AnalysisProvider,
  useLLMConfig,
  useAnalysis,
} from "./contexts";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAnalysisOrchestrator } from "./hooks";
import {
  Header,
  Main,
  Footer,
  DocumentInput,
  LLMConfigPanel,
  AnalysisSection,
  ErrorBoundary,
  Card,
  Button,
  TipsModal,
} from "./components";
import { ANALYSIS_STATUS } from "./utils/constants";
import "./globals.css";

/**
 * AppContent - Main application content (must be inside providers)
 */
function AppContent() {
  const { config, validateConfig } = useLLMConfig();
  const { status, result, error, progress, currentStep, resetAnalysis, clearError, document } = useAnalysis();
  const { startAnalysis } = useAnalysisOrchestrator();

  const [showConfig, setShowConfig] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [configError, setConfigError] = useState(null);

  /**
   * Handle document selection and start analysis
   */
  const handleDocumentSelected = useCallback(
    async (documentInput) => {
      setConfigError(null);

      // Validate LLM configuration before starting
      const validation = validateConfig();
      if (!validation.isValid) {
        setConfigError(validation.errors.join(", "));
        setShowConfig(true);
        return;
      }

      try {
        await startAnalysis(documentInput, config);
      } catch (error) {
        console.error("Analysis failed:", error);
      }
    },
    [config, validateConfig, startAnalysis],
  );

  /**
   * Handle retry analysis - re-run with same document
   */
  const handleRetryAnalysis = useCallback(async () => {
    if (!document) {
      // No document to retry, just clear error
      clearError();
      return;
    }

    // Clear error and re-run analysis with same document
    clearError();
    try {
      await startAnalysis(document, config);
    } catch (err) {
      console.error("Retry analysis failed:", err);
    }
  }, [document, config, clearError, startAnalysis]);

  /**
   * Handle new analysis
   */
  const handleNewAnalysis = useCallback(() => {
    // Analysis context will reset state
    // Just scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /**
   * Handle export results - generates a PDF formatted like the full report
   */
  const handleExportResults = useCallback(async (result) => {
    await exportToPDF(result);
  }, []);

  const isAnalyzing =
    status === ANALYSIS_STATUS.EXTRACTING ||
    status === ANALYSIS_STATUS.ANALYZING;
  const hasResults = status === ANALYSIS_STATUS.COMPLETED && result;
  const showInput = !isAnalyzing && !hasResults;

  return (
    <div className="app">
      <Header
        onConfigOpen={() => setShowConfig(true)}
        onAboutOpen={() => setShowAbout(true)}
        onTipsOpen={() => setShowTips(true)}
      />

      <Main>
        {/* Configuration Modal */}
        {showConfig && (
          <div className="modal-overlay" onClick={() => setShowConfig(false)}>
            <div onClick={(e) => e.stopPropagation()}>
              <LLMConfigPanel
                onSave={() => {
                  setShowConfig(false);
                  setConfigError(null);
                }}
                onClose={() => setShowConfig(false)}
              />
            </div>
          </div>
        )}

        {/* Tips Modal */}
        {showTips && (
          <div className="modal-overlay" onClick={() => setShowTips(false)}>
            <TipsModal onClose={() => setShowTips(false)} />
          </div>
        )}

        {/* About Modal */}
        {showAbout && (
          <div className="modal-overlay" onClick={() => setShowAbout(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal__header">
                <h2 className="modal__title">About Privacy Policy Distiller</h2>
                <button
                  type="button"
                  className="modal__close"
                  onClick={() => setShowAbout(false)}
                  aria-label="Close about"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>

              <div className="modal__body">
                <div className="about-content">
                  <p>
                    <strong>Privacy Policy Distiller</strong> helps you
                    understand complex privacy policies using AI-powered
                    analysis with objective scoring.
                  </p>

                  <h3>7-Category Privacy Scorecard</h3>
                  <p>
                    Policies are evaluated across seven weighted categories based on
                    EFF, NIST, FTC, and GDPR privacy frameworks:
                  </p>
                  <ul>
                    <li><strong>Third-Party Sharing (20%)</strong> - Who receives user data and why</li>
                    <li><strong>User Rights & Control (18%)</strong> - What control users have over their data</li>
                    <li><strong>Data Collection (18%)</strong> - What data is collected and necessity</li>
                    <li><strong>Data Retention (14%)</strong> - How long data is kept</li>
                    <li><strong>Purpose Clarity (12%)</strong> - How clearly data uses are explained</li>
                    <li><strong>Security Measures (10%)</strong> - How data is protected</li>
                    <li><strong>Policy Transparency (8%)</strong> - Policy readability and accessibility</li>
                  </ul>
                  <p>
                    Each category is scored 1-10, producing an overall score (0-100)
                    and traditional letter grade (A+ through F).
                  </p>

                  <h3>Features</h3>
                  <ul>
                    <li>Analyze policies from URLs or PDF uploads</li>
                    <li>Multiple LLM providers: OpenRouter, Ollama, LM Studio</li>
                    <li>Recommended: Google Gemini 3 Flash (via OpenRouter)</li>
                    <li>Layered summaries (brief, detailed, full analysis)</li>
                    <li>Privacy risk identification with severity levels</li>
                    <li>Key terms glossary with plain-language explanations</li>
                    <li>Privacy-first: all processing in your browser</li>
                  </ul>

                  <h3>How to Use</h3>
                  <ol>
                    <li>Configure your LLM provider (click Configure)</li>
                    <li>Enter a privacy policy URL or upload a PDF</li>
                    <li>Wait for AI analysis (30-60 seconds)</li>
                    <li>Review scorecard, risks, and detailed summaries</li>
                    <li>Check Tips for model selection guidance</li>
                  </ol>

                  <h3>Technology</h3>
                  <p>
                    Built with React 19, Vite 7, and modern web technologies.
                    Open source under MIT License.
                  </p>
                </div>
              </div>

              <div className="modal__footer">
                <Button
                  variant="primary"
                  onClick={() => setShowAbout(false)}
                >
                  Got It
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Hero / Input Section */}
        {showInput && (
          <>
            <section className="hero">
              <h1 className="hero__title">
                Understand Privacy Policies<br />in Plain Language
              </h1>
              <p className="hero__subtitle">
                AI-powered analysis that breaks down complex legal jargon,
                highlights privacy risks, and explains what really matters.
              </p>
            </section>

            {configError && (
              <Card className="error-card">
                <p className="error-text">
                  <strong>⚠️ Configuration Required:</strong> {configError}
                </p>
                <Button variant="primary" onClick={() => setShowConfig(true)}>
                  Configure LLM Provider
                </Button>
              </Card>
            )}

            <DocumentInput
              onDocumentSelected={handleDocumentSelected}
              disabled={isAnalyzing}
              analysisError={status === ANALYSIS_STATUS.ERROR ? error : null}
              onClearAnalysisError={handleRetryAnalysis}
              onTipsOpen={() => setShowTips(true)}
            />
          </>
        )}

        {/* Analysis Section */}
        <AnalysisSection
          onNewAnalysis={handleNewAnalysis}
          onExportResults={handleExportResults}
        />
      </Main>

      <Footer onAboutOpen={() => setShowAbout(true)} />
    </div>
  );
}

/**
 * App - Root component with providers
 */
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LLMConfigProvider>
          <AnalysisProvider>
            <AppContent />
          </AnalysisProvider>
        </LLMConfigProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
