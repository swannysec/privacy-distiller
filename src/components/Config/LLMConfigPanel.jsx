import { useCallback, useState } from 'react';
import { useLLMConfig } from '../../contexts';
import { ProviderSelector } from './ProviderSelector';
import { APIKeyInput } from './APIKeyInput';
import { ModelSelector } from './ModelSelector';
import { Card, Button } from '../Common';
import { LLM_PROVIDERS } from '../../utils/constants';

/**
 * LLMConfigPanel - Panel for configuring LLM provider settings
 * @param {Object} props
 * @param {boolean} props.disabled - Whether panel is disabled
 * @param {Function} props.onSave - Optional callback when config is saved
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function LLMConfigPanel({ disabled = false, onSave, className = '' }) {
  const { config, updateConfig, setProvider, validateConfig, resetConfig } = useLLMConfig();
  const [hasChanges, setHasChanges] = useState(false);
  const [validationError, setValidationError] = useState(null);

  /**
   * Handle provider change
   * @param {string} providerId
   */
  const handleProviderChange = useCallback((providerId) => {
    setProvider(providerId);
    setHasChanges(true);
    setValidationError(null);
  }, [setProvider]);

  /**
   * Handle API key change
   * @param {string} apiKey
   */
  const handleApiKeyChange = useCallback((apiKey) => {
    updateConfig({ apiKey });
    setHasChanges(true);
    setValidationError(null);
  }, [updateConfig]);

  /**
   * Handle model change
   * @param {string} model
   */
  const handleModelChange = useCallback((model) => {
    updateConfig({ model });
    setHasChanges(true);
    setValidationError(null);
  }, [updateConfig]);

  /**
   * Handle temperature change
   * @param {number} temperature
   */
  const handleTemperatureChange = useCallback((temperature) => {
    updateConfig({ temperature });
    setHasChanges(true);
  }, [updateConfig]);

  /**
   * Handle max tokens change
   * @param {number} maxTokens
   */
  const handleMaxTokensChange = useCallback((maxTokens) => {
    updateConfig({ maxTokens });
    setHasChanges(true);
  }, [updateConfig]);

  /**
   * Handle save
   */
  const handleSave = useCallback(() => {
    const validation = validateConfig();

    if (!validation.isValid) {
      setValidationError(validation.errors.join(', '));
      return;
    }

    setValidationError(null);
    setHasChanges(false);

    if (onSave) {
      onSave(config);
    }
  }, [config, validateConfig, onSave]);

  /**
   * Handle reset
   */
  const handleReset = useCallback(() => {
    resetConfig();
    setHasChanges(false);
    setValidationError(null);
  }, [resetConfig]);

  const currentProvider = LLM_PROVIDERS[config.provider.toUpperCase()];
  const requiresApiKey = currentProvider?.requiresApiKey ?? false;

  return (
    <Card
      className={`llm-config-panel ${className}`}
      title="LLM Configuration"
      subtitle="Configure your language model provider and settings"
    >
      <div className="llm-config-panel__content">
        {/* Provider selection */}
        <div className="llm-config-panel__section">
          <ProviderSelector
            value={config.provider}
            onChange={handleProviderChange}
            disabled={disabled}
          />
        </div>

        {/* API key (if required) */}
        {requiresApiKey && (
          <div className="llm-config-panel__section">
            <APIKeyInput
              value={config.apiKey}
              onChange={handleApiKeyChange}
              provider={config.provider}
              disabled={disabled}
            />
          </div>
        )}

        {/* Model selection */}
        <div className="llm-config-panel__section">
          <ModelSelector
            provider={config.provider}
            value={config.model}
            onChange={handleModelChange}
            disabled={disabled}
          />
        </div>

        {/* Advanced settings */}
        <details className="llm-config-panel__advanced">
          <summary className="llm-config-panel__advanced-toggle">
            Advanced Settings
          </summary>

          <div className="llm-config-panel__advanced-content">
            {/* Temperature */}
            <div className="llm-config-panel__setting">
              <label
                htmlFor="temperature-input"
                className="llm-config-panel__label"
              >
                Temperature
                <span className="llm-config-panel__label-hint">
                  ({config.temperature})
                </span>
              </label>
              <input
                id="temperature-input"
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={config.temperature}
                onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
                disabled={disabled}
                className="llm-config-panel__slider"
                aria-describedby="temperature-description"
              />
              <p
                id="temperature-description"
                className="llm-config-panel__description"
              >
                Controls randomness. Lower values are more focused and deterministic.
              </p>
            </div>

            {/* Max tokens */}
            <div className="llm-config-panel__setting">
              <label
                htmlFor="max-tokens-input"
                className="llm-config-panel__label"
              >
                Max Tokens
                <span className="llm-config-panel__label-hint">
                  ({config.maxTokens})
                </span>
              </label>
              <input
                id="max-tokens-input"
                type="range"
                min="1000"
                max="16000"
                step="1000"
                value={config.maxTokens}
                onChange={(e) => handleMaxTokensChange(parseInt(e.target.value))}
                disabled={disabled}
                className="llm-config-panel__slider"
                aria-describedby="max-tokens-description"
              />
              <p
                id="max-tokens-description"
                className="llm-config-panel__description"
              >
                Maximum length of generated response.
              </p>
            </div>
          </div>
        </details>

        {/* Validation error */}
        {validationError && (
          <div className="llm-config-panel__error" role="alert" aria-live="polite">
            <span className="llm-config-panel__error-icon" aria-hidden="true">⚠️</span>
            <span className="llm-config-panel__error-text">{validationError}</span>
          </div>
        )}

        {/* Actions */}
        <div className="llm-config-panel__actions">
          <Button
            variant="secondary"
            onClick={handleReset}
            disabled={disabled || !hasChanges}
            ariaLabel="Reset to default configuration"
          >
            Reset
          </Button>

          <Button
            variant="primary"
            onClick={handleSave}
            disabled={disabled || !hasChanges}
            ariaLabel="Save configuration"
          >
            Save Configuration
          </Button>
        </div>

        {/* Info note */}
        <p className="llm-config-panel__note">
          <strong>Note:</strong> API keys are stored securely in your browser's session storage
          and are never sent to any server except your chosen LLM provider.
        </p>
      </div>
    </Card>
  );
}
