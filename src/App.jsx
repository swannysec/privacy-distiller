import { useState, useCallback } from "react";
import {
  LLMConfigProvider,
  AnalysisProvider,
  useLLMConfig,
  useAnalysis,
} from "./contexts";
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
} from "./components";
import { ANALYSIS_STATUS } from "./utils/constants";
import "./globals.css";

/**
 * AppContent - Main application content (must be inside providers)
 */
function AppContent() {
  const { config, validateConfig } = useLLMConfig();
  const { state } = useAnalysis();
  const { startAnalysis } = useAnalysisOrchestrator();

  const [showConfig, setShowConfig] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
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
   * Handle new analysis
   */
  const handleNewAnalysis = useCallback(() => {
    // Analysis context will reset state
    // Just scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /**
   * Handle export results
   */
  const handleExportResults = useCallback((result) => {
    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `privacy-policy-analysis-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const isAnalyzing =
    state.status === ANALYSIS_STATUS.EXTRACTING ||
    state.status === ANALYSIS_STATUS.ANALYZING;
  const hasResults = state.status === ANALYSIS_STATUS.COMPLETED && state.result;
  const showInput = !isAnalyzing && !hasResults;

  return (
    <div className="app">
      <Header
        onConfigOpen={() => setShowConfig(true)}
        onAboutOpen={() => setShowAbout(true)}
      />

      <Main>
        {/* Configuration Modal */}
        {showConfig && (
          <div className="modal-overlay" onClick={() => setShowConfig(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowConfig(false)}
                aria-label="Close configuration"
              >
                ✕
              </button>

              <LLMConfigPanel
                onSave={() => {
                  setShowConfig(false);
                  setConfigError(null);
                }}
              />

              {configError && (
                <Card className="modal-error">
                  <p className="modal-error-text">
                    <strong>Configuration Error:</strong> {configError}
                  </p>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* About Modal */}
        {showAbout && (
          <div className="modal-overlay" onClick={() => setShowAbout(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowAbout(false)}
                aria-label="Close about"
              >
                ✕
              </button>

              <Card title="About Privacy Policy Analyzer">
                <div className="about-content">
                  <p>
                    <strong>Privacy Policy Analyzer</strong> helps you
                    understand complex privacy policies and terms of service
                    documents using AI-powered analysis.
                  </p>

                  <h3>Features</h3>
                  <ul>
                    <li>📄 Analyze policies from URLs or PDF uploads</li>
                    <li>
                      🤖 Multiple LLM providers (OpenRouter, Ollama, LM Studio)
                    </li>
                    <li>📊 Layered summaries (brief, detailed, full)</li>
                    <li>⚠️ Privacy risk identification with severity levels</li>
                    <li>📚 Key terms glossary with explanations</li>
                    <li>🔒 Privacy-first: all processing in your browser</li>
                  </ul>

                  <h3>How to Use</h3>
                  <ol>
                    <li>Configure your LLM provider (click ⚙️ Configure)</li>
                    <li>Enter a privacy policy URL or upload a PDF</li>
                    <li>Wait for AI analysis (30-60 seconds)</li>
                    <li>Review results and identified risks</li>
                  </ol>

                  <h3>Technology</h3>
                  <p>
                    Built with React 19, Vite 7, and modern web technologies.
                    Open source under MIT License.
                  </p>

                  <div className="about-actions">
                    <Button
                      variant="primary"
                      onClick={() => setShowAbout(false)}
                    >
                      Got It
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Welcome / Input Section */}
        {showInput && (
          <div className="welcome-section">
            <Card className="welcome-card">
              <h2 className="welcome-title">Welcome!</h2>
              <p className="welcome-text">
                Privacy policies can be long, complex, and full of legal jargon.
                This tool uses AI to break them down into plain language,
                highlight potential risks, and explain key terms.
              </p>
              <p className="welcome-text">
                To get started, make sure you've configured your LLM provider,
                then provide a privacy policy URL or upload a PDF.
              </p>
            </Card>

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
            />
          </div>
        )}

        {/* Analysis Section */}
        <AnalysisSection
          onNewAnalysis={handleNewAnalysis}
          onExportResults={handleExportResults}
        />
      </Main>

      <Footer />
    </div>
  );
}

/**
 * App - Root component with providers
 */
function App() {
  return (
    <ErrorBoundary>
      <LLMConfigProvider>
        <AnalysisProvider>
          <AppContent />
        </AnalysisProvider>
      </LLMConfigProvider>
    </ErrorBoundary>
  );
}

export default App;
