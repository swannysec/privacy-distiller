import { useMemo, useState, useEffect, useCallback } from 'react';
import { useLLMConfig } from '../../contexts';
import { LLM_PROVIDERS } from '../../utils/constants.js';

/**
 * Recommended models for OpenRouter with descriptions
 */
const OPENROUTER_RECOMMENDED_MODELS = [
  { id: 'nvidia/nemotron-3-nano-30b-a3b', name: 'Nvidia Nemotron 3 Nano 30B' },
  { id: 'google/gemini-3-flash-preview', name: 'Google Gemini 3 Flash Preview' },
  { id: 'openai/gpt-oss-120b', name: 'OpenAI GPT-OSS 120B' },
  { id: 'deepcogito/cogito-v2.1-671b', name: 'DeepCogito Cogito v2.1 671B' },
  { id: 'minimax/minimax-m2.1', name: 'MiniMax M2.1' },
  { id: 'anthropic/claude-haiku-4.5', name: 'Anthropic Claude Haiku 4.5' },
  { id: 'openai/gpt-5-mini', name: 'OpenAI GPT-5 Mini' },
];;

/**
 * Validate OpenRouter model ID format (provider/model-name)
 * @param {string} modelId
 * @returns {boolean}
 */
function isValidOpenRouterModelFormat(modelId) {
  if (!modelId || typeof modelId !== 'string') return false;
  // Must match pattern: provider/model-name (alphanumeric, hyphens, dots, underscores)
  return /^[a-z0-9_-]+\/[a-z0-9._-]+$/i.test(modelId.trim());
}

/**
 * Format price for display
 * @param {number} price - Price per token
 * @returns {string}
 */
function formatPrice(price) {
  if (price === 0) return 'Free';
  if (price < 0.000001) return '<$0.01/M';
  // Convert to per-million tokens
  const perMillion = price * 1000000;
  if (perMillion < 0.01) return '<$0.01/M';
  if (perMillion < 1) return `$${perMillion.toFixed(2)}/M`;
  return `$${perMillion.toFixed(2)}/M`;
}

/**
 * ModelSelector - Editable combobox for selecting or entering LLM model
 * @param {Object} props
 * @param {string} props.provider - Current provider ID
 * @param {string} props.value - Currently selected model ID
 * @param {Function} props.onChange - Callback when model changes
 * @param {boolean} props.disabled - Whether selector is disabled
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function ModelSelector({ provider, value, onChange, disabled = false, className = '' }) {
  const { config } = useLLMConfig();

  // Local state
  const [inputValue, setInputValue] = useState(value || '');
  const [isCustom, setIsCustom] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // API-fetched models for Ollama/LM Studio
  const [fetchedModels, setFetchedModels] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // OpenRouter model validation and pricing
  const [modelInfo, setModelInfo] = useState(null);
  const [validationStatus, setValidationStatus] = useState(null); // 'valid', 'invalid', 'checking'

  // Sync input value with prop value
  useEffect(() => {
    setInputValue(value || '');
    // Check if current value is a recommended model
    if (provider === 'openrouter') {
      const isRecommended = OPENROUTER_RECOMMENDED_MODELS.some(m => m.id === value);
      setIsCustom(!isRecommended && value !== '');
    }
  }, [value, provider]);

  // Fetch models for Ollama/LM Studio
  useEffect(() => {
    if (provider !== 'ollama' && provider !== 'lmstudio') {
      setFetchedModels([]);
      setFetchError(null);
      return;
    }

    const fetchModels = async () => {
      setFetchLoading(true);
      setFetchError(null);
      setFetchedModels([]);

      // Use baseUrl from config, fall back to provider defaults
      const baseUrl = config.baseUrl || LLM_PROVIDERS[provider.toUpperCase()]?.baseUrl;

      try {
        if (provider === 'ollama') {
          const response = await fetch(`${baseUrl}/api/tags`);
          if (!response.ok) {
            throw new Error('Cannot connect to Ollama');
          }
          const data = await response.json();
          const models = (data.models || []).map(model => ({
            id: model.name,
            name: model.name,
            size: model.size ? `${(model.size / 1e9).toFixed(1)}GB` : null
          }));
          setFetchedModels(models);

          // Auto-select first model if current value is empty or not in list
          if (models.length > 0 && (!value || !models.find(m => m.id === value))) {
            onChange(models[0].id);
          }
        } else if (provider === 'lmstudio') {
          const response = await fetch(`${baseUrl}/models`);
          if (!response.ok) {
            throw new Error('Cannot connect to LM Studio');
          }
          const data = await response.json();
          const models = (data.data || []).map(model => ({
            id: model.id,
            name: model.id
          }));
          setFetchedModels(models);

          if (models.length > 0 && (!value || !models.find(m => m.id === value))) {
            onChange(models[0].id);
          }
        }
      } catch (err) {
        console.error(`Failed to fetch ${provider} models:`, err);
        setFetchError(`Unable to connect to ${provider === 'ollama' ? 'Ollama' : 'LM Studio'}. Is it running?`);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchModels();
  }, [provider, onChange, value, config.baseUrl]);

  // Validate and fetch pricing for OpenRouter models
  useEffect(() => {
    if (provider !== 'openrouter' || !inputValue || !config.apiKey) {
      setModelInfo(null);
      setValidationStatus(null);
      return;
    }

    // Skip validation if empty
    if (!inputValue.trim()) {
      setValidationStatus(null);
      return;
    }

    // Check format first
    if (!isValidOpenRouterModelFormat(inputValue)) {
      setValidationStatus('invalid');
      setModelInfo(null);
      return;
    }

    // Debounce API validation
    const timeoutId = setTimeout(async () => {
      setValidationStatus('checking');

      try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
          headers: { 'Authorization': `Bearer ${config.apiKey}` }
        });

        if (!response.ok) {
          setValidationStatus('invalid');
          setModelInfo(null);
          return;
        }

        const data = await response.json();
        const model = data.data?.find(m => m.id === inputValue.trim());

        if (model) {
          setValidationStatus('valid');
          setModelInfo({
            name: model.name || model.id,
            contextLength: model.context_length,
            promptPrice: model.pricing?.prompt,
            completionPrice: model.pricing?.completion
          });
        } else {
          setValidationStatus('invalid');
          setModelInfo(null);
        }
      } catch (err) {
        console.error('Failed to validate model:', err);
        // Don't mark as invalid on network error, just clear status
        setValidationStatus(null);
        setModelInfo(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [provider, inputValue, config.apiKey]);

  /**
   * Handle input change (for custom model entry)
   */
  const handleInputChange = useCallback((e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsCustom(true);
    setShowDropdown(true);
    onChange(newValue);
  }, [onChange]);

  /**
   * Handle selecting a model from dropdown
   */
  const handleSelectModel = useCallback((modelId) => {
    setInputValue(modelId);
    setIsCustom(false);
    setShowDropdown(false);
    onChange(modelId);
  }, [onChange]);

  /**
   * Handle input focus
   */
  const handleFocus = useCallback(() => {
    if (provider === 'openrouter') {
      setShowDropdown(true);
    }
  }, [provider]);

  /**
   * Handle input blur (delayed to allow click on dropdown)
   */
  const handleBlur = useCallback(() => {
    setTimeout(() => setShowDropdown(false), 200);
  }, []);

  // Determine available models based on provider
  const availableModels = useMemo(() => {
    if (provider === 'openrouter') {
      return OPENROUTER_RECOMMENDED_MODELS;
    }
    return fetchedModels;
  }, [provider, fetchedModels]);

  // Filter dropdown models based on input
  const filteredModels = useMemo(() => {
    if (provider !== 'openrouter') {
      return availableModels;
    }
    // Always show all recommended models when dropdown is open
    // Only filter if user is actively typing something not in the list
    if (!inputValue) {
      return availableModels;
    }
    // Check if current value exactly matches a recommended model
    const exactMatch = availableModels.find(m => m.id === inputValue);
    if (exactMatch) {
      return availableModels; // Show all when a recommended model is selected
    }
    // Filter by search term
    const search = inputValue.toLowerCase();
    const filtered = availableModels.filter(m =>
      m.id.toLowerCase().includes(search) ||
      m.name.toLowerCase().includes(search)
    );
    // If nothing matches filter, still show all recommended as suggestions
    return filtered.length > 0 ? filtered : availableModels;
  }, [availableModels, inputValue, provider]);

  // Render for Ollama/LM Studio (standard dropdown)
  if (provider === 'ollama' || provider === 'lmstudio') {
    return (
      <div className={`input-group ${className}`}>
        <label htmlFor="model-select" className="input-label">
          Model
        </label>

        {fetchLoading ? (
          <div className="model-loading">
            <span className="model-loading__spinner"></span>
            <span>Connecting to {provider === 'ollama' ? 'Ollama' : 'LM Studio'}...</span>
          </div>
        ) : fetchError ? (
          <div className="model-error">
            <span className="model-error__icon">⚠️</span>
            <span className="model-error__text">{fetchError}</span>
          </div>
        ) : fetchedModels.length === 0 ? (
          <div className="model-empty">
            <span className="model-empty__icon">📭</span>
            <span className="model-empty__text">
              {provider === 'ollama'
                ? 'No models installed. Run `ollama pull llama3.2` to download a model.'
                : 'No models loaded. Load a model in LM Studio first.'}
            </span>
          </div>
        ) : (
          <>
            <select
              id="model-select"
              className="select-field"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
            >
              {fetchedModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}{model.size ? ` (${model.size})` : ''}
                </option>
              ))}
            </select>
            <p className="input-hint">
              {fetchedModels.length} model{fetchedModels.length !== 1 ? 's' : ''} available
            </p>
          </>
        )}
      </div>
    );
  }

  // Render for OpenRouter (editable combobox)
  return (
    <div className={`input-group model-combobox ${className}`}>
      <label htmlFor="model-input" className="input-label">
        Model
      </label>

      <div className="model-combobox__container">
        <input
          type="text"
          id="model-input"
          className={`input-field model-combobox__input ${
            validationStatus === 'invalid' ? 'input-field--error' : ''
          } ${validationStatus === 'valid' ? 'input-field--valid' : ''}`}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Select or type a model ID..."
          disabled={disabled}
          autoComplete="off"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-describedby="model-status"
        />

        {/* Status indicator */}
        <span className="model-combobox__status" aria-hidden="true">
          {validationStatus === 'checking' && '⏳'}
          {validationStatus === 'valid' && '✓'}
          {validationStatus === 'invalid' && '✗'}
        </span>

        {/* Dropdown */}
        {showDropdown && filteredModels.length > 0 && (
          <ul className="model-combobox__dropdown" role="listbox">
            {filteredModels.map((model) => (
              <li
                key={model.id}
                className={`model-combobox__option ${model.id === value ? 'model-combobox__option--selected' : ''}`}
                role="option"
                aria-selected={model.id === value}
                onClick={() => handleSelectModel(model.id)}
              >
                <span className="model-combobox__option-name">{model.name}</span>
                <span className="model-combobox__option-id">{model.id}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Status messages */}
      <div id="model-status">
        {validationStatus === 'invalid' && (
          <p className="input-error">
            Invalid model ID. Use format: provider/model-name
          </p>
        )}

        {validationStatus === 'valid' && modelInfo && (
          <div className="model-info">
            <span className="model-info__pricing">
              💰 Input: {formatPrice(modelInfo.promptPrice)} · Output: {formatPrice(modelInfo.completionPrice)}
            </span>
            {modelInfo.contextLength && (
              <span className="model-info__context">
                📝 {(modelInfo.contextLength / 1000).toFixed(0)}K context
              </span>
            )}
          </div>
        )}

        {!validationStatus && !inputValue && (
          <p className="input-hint">
            Select a recommended model or enter any OpenRouter model ID
          </p>
        )}

        {validationStatus === 'checking' && (
          <p className="input-hint">Validating model...</p>
        )}
      </div>
    </div>
  );
}
