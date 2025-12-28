import { useMemo } from 'react';

/**
 * Available models by provider
 */
const PROVIDER_MODELS = {
  openrouter: [
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Best for analysis and reasoning' },
    { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Fast and capable' },
    { id: 'openai/gpt-4', name: 'GPT-4', description: 'High quality responses' },
    { id: 'google/gemini-pro', name: 'Gemini Pro', description: 'Google\'s flagship model' },
    { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B', description: 'Open source, powerful' }
  ],
  ollama: [
    { id: 'llama3', name: 'Llama 3', description: 'Meta\'s latest open model' },
    { id: 'mistral', name: 'Mistral', description: 'Efficient and capable' },
    { id: 'mixtral', name: 'Mixtral 8x7B', description: 'Mixture of experts model' },
    { id: 'phi3', name: 'Phi-3', description: 'Small but capable' },
    { id: 'gemma', name: 'Gemma', description: 'Google\'s open model' }
  ],
  lmstudio: [
    { id: 'local-model', name: 'Local Model', description: 'Currently loaded model' }
  ]
};

/**
 * ModelSelector - Component for selecting LLM model
 * @param {Object} props
 * @param {string} props.provider - Current provider ID
 * @param {string} props.value - Currently selected model ID
 * @param {Function} props.onChange - Callback when model changes
 * @param {boolean} props.disabled - Whether selector is disabled
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function ModelSelector({ provider, value, onChange, disabled = false, className = '' }) {
  const availableModels = useMemo(() => {
    return PROVIDER_MODELS[provider] || [];
  }, [provider]);

  /**
   * Handle model selection
   * @param {React.ChangeEvent<HTMLSelectElement>} e
   */
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  const selectedModel = availableModels.find(m => m.id === value);

  return (
    <div className={`model-selector ${className}`}>
      <label
        htmlFor="model-select"
        className="model-selector__label"
      >
        Model
      </label>

      <div className="model-selector__container">
        <select
          id="model-select"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="model-selector__select"
          aria-describedby="model-description"
        >
          {availableModels.length === 0 ? (
            <option value="">No models available</option>
          ) : (
            availableModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))
          )}
        </select>

        <span className="model-selector__icon" aria-hidden="true">
          ▼
        </span>
      </div>

      {/* Model description */}
      {selectedModel && (
        <p
          id="model-description"
          className="model-selector__description"
        >
          {selectedModel.description}
        </p>
      )}

      {/* Provider-specific notes */}
      {provider === 'ollama' && (
        <div className="model-selector__note">
          <p className="model-selector__note-text">
            Make sure the selected model is downloaded in Ollama.
            Run <code className="model-selector__code">ollama pull {value}</code> if needed.
          </p>
        </div>
      )}

      {provider === 'lmstudio' && (
        <div className="model-selector__note">
          <p className="model-selector__note-text">
            This will use whichever model is currently loaded in LM Studio's local server.
          </p>
        </div>
      )}

      {provider === 'openrouter' && (
        <div className="model-selector__note">
          <p className="model-selector__note-text">
            Different models have different pricing. Check{' '}
            <a
              href="https://openrouter.ai/docs#models"
              target="_blank"
              rel="noopener noreferrer"
              className="model-selector__link"
            >
              OpenRouter's pricing
            </a>
            {' '}for details.
          </p>
        </div>
      )}
    </div>
  );
}
