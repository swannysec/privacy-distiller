import { LLM_PROVIDERS } from '../../utils/constants';

/**
 * ProviderSelector - Component for selecting LLM provider
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
   * Handle provider selection
   * @param {string} providerId
   */
  const handleSelect = (providerId) => {
    if (!disabled) {
      onChange(providerId);
    }
  };

  return (
    <div className={`provider-selector ${className}`}>
      <label
        id="provider-selector-label"
        className="provider-selector__label"
      >
        LLM Provider
      </label>

      <div
        className="provider-selector__options"
        role="radiogroup"
        aria-labelledby="provider-selector-label"
      >
        {providers.map((provider) => {
          const isSelected = value === provider.id;
          const optionClasses = [
            'provider-selector__option',
            isSelected && 'provider-selector__option--selected',
            disabled && 'provider-selector__option--disabled'
          ].filter(Boolean).join(' ');

          return (
            <div
              key={provider.id}
              className={optionClasses}
            >
              <input
                type="radio"
                id={`provider-${provider.id}`}
                name="llm-provider"
                value={provider.id}
                checked={isSelected}
                onChange={() => handleSelect(provider.id)}
                disabled={disabled}
                className="provider-selector__radio"
              />

              <label
                htmlFor={`provider-${provider.id}`}
                className="provider-selector__option-label"
              >
                <span className="provider-selector__option-name">
                  {provider.name}
                </span>

                <span className="provider-selector__option-description">
                  {provider.requiresApiKey ? (
                    <>
                      <span className="provider-selector__badge provider-selector__badge--key">
                        🔑 API Key Required
                      </span>
                      <span className="provider-selector__option-url">
                        {provider.baseUrl}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="provider-selector__badge provider-selector__badge--local">
                        💻 Local
                      </span>
                      <span className="provider-selector__option-url">
                        {provider.baseUrl}
                      </span>
                    </>
                  )}
                </span>
              </label>
            </div>
          );
        })}
      </div>

      {/* Provider info */}
      <div className="provider-selector__info">
        {value === 'openrouter' && (
          <p className="provider-selector__info-text">
            <strong>OpenRouter</strong> provides access to multiple commercial LLMs.
            Get your API key at{' '}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="provider-selector__link"
            >
              openrouter.ai/keys
            </a>
          </p>
        )}

        {value === 'ollama' && (
          <p className="provider-selector__info-text">
            <strong>Ollama</strong> runs models locally on your machine.
            Install from{' '}
            <a
              href="https://ollama.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="provider-selector__link"
            >
              ollama.ai
            </a>
            {' '}and ensure it's running before analysis.
          </p>
        )}

        {value === 'lmstudio' && (
          <p className="provider-selector__info-text">
            <strong>LM Studio</strong> provides a desktop app for running local models.
            Download from{' '}
            <a
              href="https://lmstudio.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="provider-selector__link"
            >
              lmstudio.ai
            </a>
            {' '}and start the local server before analysis.
          </p>
        )}
      </div>
    </div>
  );
}
