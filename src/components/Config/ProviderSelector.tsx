import { LLM_PROVIDERS, FREE_TIER_ENABLED } from "../../utils/constants";
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
  // Get providers, filtering out hosted-free if not enabled
  const providers = Object.values(LLM_PROVIDERS).filter((p) => {
    if (!p) return false;
    if (p.id === "hosted-free" && !FREE_TIER_ENABLED) return false;
    return true;
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!disabled) {
      onChange(e.target.value as LLMProvider);
    }
  };

  const currentProvider = LLM_PROVIDERS[value.toUpperCase().replace("-", "_")];

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
              {providerOption.id === "hosted-free"
                ? "✨ Hosted Free"
                : `${providerOption.name}${providerOption.requiresApiKey ? "" : " (Local)"}`}
            </option>
          ))}
      </select>

      {currentProvider && (
        <p className="input-hint">
          {value === "hosted-free" && (
            <>
              <strong className="provider-badge provider-badge--free">
                Free &amp; No Setup Required
              </strong>{" "}
              Analyze policies instantly using our hosted service. Rate-limited
              to ensure fair usage. No API key needed.
            </>
          )}
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
