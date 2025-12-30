import { LLM_PROVIDERS } from '../../utils/constants';

/**
 * ProviderSelector - Dropdown component for selecting LLM provider
 * @param {Object} props
 * @param {string} props.value - Currently selected provider ID
 * @param {Function} props.onChange - Callback when provider changes
 * @param {boolean} props.disabled - Whether selector is disabled
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function ProviderSelector({ value, onChange, disabled = false, className = '' }) {
  const providers = Object.values(LLM_PROVIDERS);

  /**
   * Handle provider selection change
   * @param {React.ChangeEvent<HTMLSelectElement>} e
   */
  const handleChange = (e) => {
    if (!disabled) {
      onChange(e.target.value);
    }
  };

  const currentProvider = LLM_PROVIDERS[value.toUpperCase()];

  return (
    <div className={`input-group ${className}`}>
      <label htmlFor="llm-provider" className="input-label">
        LLM Provider
      </label>

      <select
        id="llm-provider"
        className="select-field"
        value={value}
        onChange={handleChange}
        disabled={disabled}
      >
        {providers.map((provider) => (
          <option key={provider.id} value={provider.id}>
            {provider.name}{provider.requiresApiKey ? '' : ' (Local)'}
          </option>
        ))}
      </select>

      {/* Provider info hint */}
      {currentProvider && (
        <p className="input-hint">
          {value === 'openrouter' && (
            <>
              <strong>Recommended for large documents.</strong> Access Claude, GPT-4, Gemini and more with 100K+ token contexts. Get your API key at{' '}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
              >
                openrouter.ai/keys
              </a>
            </>
          )}
          {value === 'ollama' && (
            <>
              Runs models locally. Limited context windows may not handle large documents. Install from{' '}
              <a
                href="https://ollama.ai"
                target="_blank"
                rel="noopener noreferrer"
              >
                ollama.ai
              </a>
            </>
          )}
          {value === 'lmstudio' && (
            <>
              Desktop app for local models. Limited context windows may not handle large documents. Download from{' '}
              <a
                href="https://lmstudio.ai"
                target="_blank"
                rel="noopener noreferrer"
              >
                lmstudio.ai
              </a>
            </>
          )}
        </p>
      )}
    </div>
  );
}
