import { useCallback, useState } from "react";
import { useLLMConfig } from "../../contexts";
import { ProviderSelector } from "./ProviderSelector";
import { APIKeyInput } from "./APIKeyInput";
import { ModelSelector } from "./ModelSelector";
import { Button } from "../Common";
import { LLM_PROVIDERS, DEFAULT_CONTEXT_WINDOWS } from "../../utils/constants";

// Status configuration for test status badge
const TEST_STATUS_CONFIG = {
  success: { badge: "success", icon: "●", label: "Connected" },
  error: { badge: "error", icon: "✕", label: "Failed" },
  testing: { badge: "warning", icon: "...", label: "Testing" },
};

/**
 * LLMConfigPanel - Panel for configuring LLM provider settings
 * Uses form-section layout matching the mockup design
 * @param {Object} props
 * @param {boolean} props.disabled - Whether panel is disabled
 * @param {Function} props.onSave - Optional callback when config is saved
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function LLMConfigPanel({
  disabled = false,
  onSave,
  onClose,
  className = "",
}) {
  const { config, updateConfig, setProvider, validateConfig } = useLLMConfig();
  const [hasChanges, setHasChanges] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [testStatus, setTestStatus] = useState(null); // 'testing', 'success', 'error'
  const [testMessage, setTestMessage] = useState("");

  const handleProviderChange = useCallback(
    (providerId) => {
      setProvider(providerId);
      setHasChanges(true);
      setValidationError(null);
      setTestStatus(null);
    },
    [setProvider],
  );

  const handleApiKeyChange = useCallback(
    (apiKey) => {
      updateConfig({ apiKey });
      setHasChanges(true);
      setValidationError(null);
    },
    [updateConfig],
  );

  const handleModelChange = useCallback(
    (model) => {
      updateConfig({ model });
      setHasChanges(true);
      setValidationError(null);
    },
    [updateConfig],
  );

  const handleEndpointChange = useCallback(
    (e) => {
      updateConfig({ baseUrl: e.target.value });
      setHasChanges(true);
      setValidationError(null);
      setTestStatus(null);
    },
    [updateConfig],
  );

  const handleTemperatureChange = useCallback(
    (e) => {
      updateConfig({ temperature: parseFloat(e.target.value) });
      setHasChanges(true);
    },
    [updateConfig],
  );

  const handleMaxTokensChange = useCallback(
    (e) => {
      updateConfig({ maxTokens: parseInt(e.target.value) });
      setHasChanges(true);
    },
    [updateConfig],
  );

  const handleContextWindowChange = useCallback(
    (e) => {
      const value = e.target.value;
      // Allow empty string to reset to default, otherwise parse as integer
      updateConfig({ contextWindow: value === "" ? null : parseInt(value) });
      setHasChanges(true);
    },
    [updateConfig],
  );

  const handleSave = useCallback(() => {
    const validation = validateConfig();
    if (!validation.isValid) {
      setValidationError(validation.errors.join(", "));
      return;
    }
    setValidationError(null);
    setHasChanges(false);
    if (onSave) {
      onSave(config);
    }
  }, [config, validateConfig, onSave]);

  const handleTestConnection = useCallback(async () => {
    const validation = validateConfig();
    if (!validation.isValid) {
      setValidationError(validation.errors.join(", "));
      return;
    }

    setTestStatus("testing");
    setTestMessage("");
    setValidationError(null);

    try {
      if (config.provider === "openrouter") {
        const response = await fetch(`${config.baseUrl}/models`, {
          headers: { Authorization: `Bearer ${config.apiKey}` },
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setTestStatus("success");
        setTestMessage(
          `Connected! ${data.data?.length || 0} models available.`,
        );
      } else if (config.provider === "ollama") {
        const response = await fetch(`${config.baseUrl}/api/tags`);
        if (!response.ok) {
          throw new Error("Cannot connect to Ollama. Make sure it is running.");
        }
        const data = await response.json();
        const models = data.models || [];
        setTestStatus("success");
        setTestMessage(
          models.length > 0
            ? `Connected! ${models.length} model(s) installed.`
            : "Connected, but no models installed. Use `ollama pull` to download models.",
        );
      } else if (config.provider === "lmstudio") {
        const response = await fetch(`${config.baseUrl}/models`);
        if (!response.ok) {
          throw new Error(
            "Cannot connect to LM Studio. Make sure the server is running.",
          );
        }
        const data = await response.json();
        const models = data.data || [];
        setTestStatus("success");
        setTestMessage(
          models.length > 0
            ? `Connected! ${models.length} model(s) loaded.`
            : "Connected, but no models loaded. Load a model in LM Studio first.",
        );
      }
    } catch (error) {
      setTestStatus("error");
      setTestMessage(`Connection failed: ${error.message}`);
    }
  }, [config, validateConfig]);

  const currentProvider = LLM_PROVIDERS[config.provider.toUpperCase()];
  const requiresApiKey = currentProvider?.requiresApiKey ?? false;

  return (
    <div className={`modal ${className}`}>
      <div className="modal__header">
        <h2 className="modal__title">⚙️ LLM Configuration</h2>
        {onClose && (
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Close configuration"
          >
            ×
          </button>
        )}
      </div>

      <div className="modal__body">
        {/* Provider Section */}
        <div className="form-section">
          <h3 className="form-section__title">Provider</h3>
          <ProviderSelector
            value={config.provider}
            onChange={handleProviderChange}
            disabled={disabled}
          />
        </div>

        {/* API Settings Section */}
        <div className="form-section">
          <h3 className="form-section__title">API Settings</h3>

          {requiresApiKey && (
            <APIKeyInput
              value={config.apiKey}
              onChange={handleApiKeyChange}
              provider={config.provider}
              disabled={disabled}
            />
          )}

          {/* Endpoint URL for local providers */}
          {!requiresApiKey && (
            <div className="input-group">
              <label htmlFor="endpoint-url" className="input-label">
                Endpoint URL
              </label>
              <input
                type="text"
                id="endpoint-url"
                className="input-field"
                value={config.baseUrl}
                onChange={handleEndpointChange}
                placeholder={
                  currentProvider?.baseUrl || "http://localhost:11434"
                }
                disabled={disabled}
              />
              <p className="input-hint">Default: {currentProvider?.baseUrl}</p>
            </div>
          )}

          <ModelSelector
            provider={config.provider}
            value={config.model}
            onChange={handleModelChange}
            disabled={disabled}
          />
        </div>

        {/* Advanced Section */}
        <div className="form-section">
          <h3 className="form-section__title">Advanced</h3>

          <div className="form-row">
            <div className="input-group">
              <label htmlFor="temperature" className="input-label">
                Temperature
              </label>
              <input
                type="number"
                id="temperature"
                className="input-field"
                value={config.temperature}
                onChange={handleTemperatureChange}
                step="0.1"
                min="0"
                max="2"
                disabled={disabled}
              />
              <p className="input-hint">
                Controls randomness. 0.7 is recommended (0 = deterministic, 2 =
                very creative)
              </p>
            </div>

            <div className="input-group">
              <label htmlFor="max-tokens" className="input-label">
                Max Response Length
              </label>
              <input
                type="number"
                id="max-tokens"
                className="input-field"
                value={config.maxTokens}
                onChange={handleMaxTokensChange}
                step="1000"
                min="1000"
                max="32000"
                disabled={disabled}
              />
              <p className="input-hint">
                Maximum tokens in each AI response (~750 words per 1K tokens)
              </p>
            </div>
          </div>

          {/* Context Window - Local Models Only */}
          {!requiresApiKey && (
            <div className="input-group" style={{ marginTop: "1rem" }}>
              <label htmlFor="context-window" className="input-label">
                Model Context Window
              </label>
              <input
                type="number"
                id="context-window"
                className="input-field"
                value={
                  config.contextWindow ??
                  DEFAULT_CONTEXT_WINDOWS[config.provider] ??
                  8192
                }
                onChange={handleContextWindowChange}
                step="1024"
                min="2048"
                max="1000000"
                disabled={disabled}
              />
              <p className="input-hint">
                Total capacity for document + responses. Larger documents need
                bigger context windows. Must match your model&apos;s
                configuration in{" "}
                {config.provider === "ollama" ? "Ollama" : "LM Studio"}.
              </p>
            </div>
          )}

          {/* Context Window Info - OpenRouter */}
          {requiresApiKey && config.provider === "openrouter" && (
            <div className="config-info" style={{ marginTop: "1rem" }}>
              <span className="config-info__icon">ℹ️</span>
              <span className="config-info__text">
                Model context window (document capacity) is automatically
                detected from OpenRouter.
              </span>
            </div>
          )}
        </div>

        {/* Local Model Warning */}
        {!requiresApiKey && (
          <div className="config-alert config-alert--warning">
            <span>⚠️</span>
            <div>
              <strong>Local Model Limitations</strong>
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem" }}>
                <strong>
                  For large documents, we recommend using OpenRouter
                </strong>{" "}
                with cloud models (Claude, GPT-4, Gemini) that support 100K+
                token contexts and 32K+ response lengths. Local models typically
                have limited capacity.
              </p>
              <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.875rem" }}>
                Current settings:{" "}
                {(
                  config.contextWindow ||
                  DEFAULT_CONTEXT_WINDOWS[config.provider] ||
                  8192
                ).toLocaleString()}{" "}
                token context, {(config.maxTokens || 4096).toLocaleString()} max
                response. If using a local model, ensure:
              </p>
              <ul
                style={{
                  margin: "0.25rem 0 0 0",
                  paddingLeft: "1.25rem",
                  fontSize: "0.875rem",
                }}
              >
                <li>
                  Your model supports these limits in{" "}
                  {config.provider === "ollama" ? "Ollama" : "LM Studio"}
                </li>
                <li>
                  You have sufficient RAM (larger contexts need more memory)
                </li>
                <li>
                  For Ollama: set <code>num_ctx</code> in Modelfile or use{" "}
                  <code>--ctx-size</code> flag
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Validation Error */}
        {validationError && (
          <div className="config-alert config-alert--error">
            <span>⚠️</span> {validationError}
          </div>
        )}

        {/* Connection Status */}
        {testStatus && (
          <div className="config-status">
            <span
              className={`status-badge status-badge--${TEST_STATUS_CONFIG[testStatus]?.badge || "warning"}`}
            >
              <span>{TEST_STATUS_CONFIG[testStatus]?.icon || "..."}</span>
              {TEST_STATUS_CONFIG[testStatus]?.label || "Unknown"}
            </span>
            {testMessage && (
              <span className="config-status__message">{testMessage}</span>
            )}
          </div>
        )}
      </div>

      <div className="modal__footer">
        <Button
          variant="secondary"
          onClick={handleTestConnection}
          disabled={disabled || testStatus === "testing"}
        >
          Test Connection
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={disabled}>
          Save Configuration
        </Button>
      </div>
    </div>
  );
}
