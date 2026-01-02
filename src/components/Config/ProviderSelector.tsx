import { LLM_PROVIDERS } from "../../utils/constants";
import type { LLMProvider } from "../../types";

interface ProviderSelectorProps {
  value: LLMProvider;
  onChange: (provider: LLMProvider) => void;
  disabled?: boolean;
  className?: string;
}

export function ProviderSelector({
  value,
  onChange,
  disabled = false,
  className = "",
}: ProviderSelectorProps) {
  const providers = Object.values(LLM_PROVIDERS);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!disabled) {
      onChange(e.target.value as LLMProvider);
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
        {providers
          .filter((p): p is NonNullable<typeof p> => p != null)
          .map((providerOption) => (
            <option key={providerOption.id} value={providerOption.id}>
              {providerOption.name}
              {providerOption.requiresApiKey ? "" : " (Local)"}
            </option>
          ))}
      </select>

      {currentProvider && (
        <p className="input-hint">
          {value === "openrouter" && (
            <>
              <strong>Recommended for large documents.</strong> Access Claude,
              GPT-4, Gemini and more with 100K+ token contexts. Get your API key
              at{" "}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
              >
                openrouter.ai/keys
              </a>
            </>
          )}
          {value === "ollama" && (
            <>
              Runs models locally. Limited context windows may not handle large
              documents. Install from{" "}
              <a
                href="https://ollama.ai"
                target="_blank"
                rel="noopener noreferrer"
              >
                ollama.ai
              </a>
            </>
          )}
          {value === "lmstudio" && (
            <>
              Desktop app for local models. Limited context windows may not
              handle large documents. Download from{" "}
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
