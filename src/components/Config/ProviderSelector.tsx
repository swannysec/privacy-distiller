import { useState, useEffect } from "react";
import {
  LLM_PROVIDERS,
  FREE_TIER_ENABLED,
  TIER_MESSAGES,
} from "../../utils/constants";
import {
  HostedFreeTierProvider,
  type FreeTierStatus,
} from "../../services/llm/HostedFreeTierProvider";
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
  const [tierStatus, setTierStatus] = useState<FreeTierStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Fetch tier status when hosted-free is selected
  useEffect(() => {
    if (value === "hosted-free" && FREE_TIER_ENABLED) {
      setStatusLoading(true);
      const provider = new HostedFreeTierProvider({});
      provider
        .getStatus()
        .then((status) => {
          setTierStatus(status);
        })
        .catch(() => {
          // On error, leave status as null (will show "unknown" messaging)
          setTierStatus(null);
        })
        .finally(() => {
          setStatusLoading(false);
        });
    }
  }, [value]);

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

  // Get tier-specific messaging
  const getTierMessage = () => {
    if (statusLoading) {
      return TIER_MESSAGES.unknown;
    }
    if (!tierStatus) {
      return TIER_MESSAGES.unknown;
    }
    return TIER_MESSAGES[tierStatus.tier] || TIER_MESSAGES.unknown;
  };

  const tierMessage = getTierMessage();

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
              Analyze policies instantly using{" "}
              <strong>
                {HostedFreeTierProvider.getFreeTierModelDisplayName()}
              </strong>
              . Rate-limited to ensure fair usage. No API key needed.
              <br />
              <span className="privacy-note">
                🔒 <strong>Privacy:</strong>{" "}
                {tierMessage.zdrLink ? (
                  <>
                    {tierMessage.privacyNote.split("Zero Data Retention")[0]}
                    <a
                      href={tierMessage.zdrLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Zero Data Retention
                    </a>
                    {tierMessage.privacyNote.includes("Zero Data Retention")
                      ? tierMessage.privacyNote.split("Zero Data Retention")[1]
                      : ""}
                    {!tierMessage.privacyNote.includes("Zero Data Retention") &&
                      ` ${tierMessage.privacyNote}`}
                  </>
                ) : (
                  tierMessage.privacyNote
                )}
                {tierStatus && (
                  <span
                    className={`tier-badge tier-badge--${tierStatus.tier}`}
                    title={`Current tier: ${tierStatus.tier}`}
                  >
                    {" "}
                    [{tierMessage.badge}]
                  </span>
                )}
              </span>
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
