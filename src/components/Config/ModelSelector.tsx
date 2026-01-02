import { useMemo, useState, useEffect, useCallback } from "react";
import { useLLMConfig } from "../../contexts";
import { LLM_PROVIDERS } from "../../utils/constants";
import type { LLMProvider } from "../../types";

interface RecommendedModel {
  id: string;
  name: string;
}

interface FetchedModel {
  id: string;
  name: string;
  size?: string;
}

interface ModelInfo {
  name: string;
  contextLength?: number;
  promptPrice?: number;
  completionPrice?: number;
}

const OPENROUTER_RECOMMENDED_MODELS: RecommendedModel[] = [
  { id: "nvidia/nemotron-3-nano-30b-a3b", name: "Nvidia Nemotron 3 Nano 30B" },
  {
    id: "google/gemini-3-flash-preview",
    name: "Google Gemini 3 Flash Preview",
  },
  { id: "openai/gpt-oss-120b", name: "OpenAI GPT-OSS 120B" },
  { id: "deepcogito/cogito-v2.1-671b", name: "DeepCogito Cogito v2.1 671B" },
  { id: "minimax/minimax-m2.1", name: "MiniMax M2.1" },
  { id: "anthropic/claude-haiku-4.5", name: "Anthropic Claude Haiku 4.5" },
  { id: "openai/gpt-5-mini", name: "OpenAI GPT-5 Mini" },
];

function isValidOpenRouterModelFormat(modelId: string): boolean {
  if (!modelId || typeof modelId !== "string") return false;
  return /^[a-z0-9_-]+\/[a-z0-9._-]+$/i.test(modelId.trim());
}

function formatPrice(price: number): string {
  if (price === 0) return "Free";
  if (price < 0.000001) return "<$0.01/M";
  const perMillion = price * 1000000;
  if (perMillion < 0.01) return "<$0.01/M";
  if (perMillion < 1) return `$${perMillion.toFixed(2)}/M`;
  return `$${perMillion.toFixed(2)}/M`;
}

interface ModelSelectorProps {
  provider: LLMProvider;
  value: string;
  onChange: (model: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ModelSelector({
  provider,
  value,
  onChange,
  disabled = false,
  className = "",
}: ModelSelectorProps) {
  const { config } = useLLMConfig();

  const [inputValue, setInputValue] = useState(value || "");
  const [, setIsCustom] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [fetchedModels, setFetchedModels] = useState<FetchedModel[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [validationStatus, setValidationStatus] = useState<
    "valid" | "invalid" | "checking" | null
  >(null);

  useEffect(() => {
    setInputValue(value || "");
    if (provider === "openrouter") {
      const isRecommended = OPENROUTER_RECOMMENDED_MODELS.some(
        (m) => m.id === value,
      );
      setIsCustom(!isRecommended && value !== "");
    }
  }, [value, provider]);

  useEffect(() => {
    if (provider !== "ollama" && provider !== "lmstudio") {
      setFetchedModels([]);
      setFetchError(null);
      return;
    }

    const fetchModels = async () => {
      setFetchLoading(true);
      setFetchError(null);
      setFetchedModels([]);

      const baseUrl =
        config.baseUrl || LLM_PROVIDERS[provider.toUpperCase()]?.baseUrl;

      try {
        if (provider === "ollama") {
          const response = await fetch(`${baseUrl}/api/tags`);
          if (!response.ok) {
            throw new Error("Cannot connect to Ollama");
          }
          const data = await response.json();
          const models = (data.models || []).map((model: any) => ({
            id: model.name,
            name: model.name,
            size: model.size ? `${(model.size / 1e9).toFixed(1)}GB` : undefined,
          }));
          setFetchedModels(models);

          if (
            models.length > 0 &&
            (!value || !models.find((m: FetchedModel) => m.id === value))
          ) {
            onChange(models[0].id);
          }
        } else if (provider === "lmstudio") {
          const response = await fetch(`${baseUrl}/models`);
          if (!response.ok) {
            throw new Error("Cannot connect to LM Studio");
          }
          const data = await response.json();
          const models = (data.data || []).map((model: any) => ({
            id: model.id,
            name: model.id,
          }));
          setFetchedModels(models);

          if (
            models.length > 0 &&
            (!value || !models.find((m: FetchedModel) => m.id === value))
          ) {
            onChange(models[0].id);
          }
        }
      } catch (err) {
        console.error(`Failed to fetch ${provider} models:`, err);
        setFetchError(
          `Unable to connect to ${provider === "ollama" ? "Ollama" : "LM Studio"}. Is it running?`,
        );
      } finally {
        setFetchLoading(false);
      }
    };

    fetchModels();
  }, [provider, onChange, value, config.baseUrl]);

  useEffect(() => {
    if (provider !== "openrouter" || !inputValue || !config.apiKey) {
      setModelInfo(null);
      setValidationStatus(null);
      return;
    }

    if (!inputValue.trim()) {
      setValidationStatus(null);
      return;
    }

    if (!isValidOpenRouterModelFormat(inputValue)) {
      setValidationStatus("invalid");
      setModelInfo(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setValidationStatus("checking");

      try {
        const response = await fetch("https://openrouter.ai/api/v1/models", {
          headers: { Authorization: `Bearer ${config.apiKey}` },
        });

        if (!response.ok) {
          setValidationStatus("invalid");
          setModelInfo(null);
          return;
        }

        const data = await response.json();
        const model = data.data?.find((m: any) => m.id === inputValue.trim());

        if (model) {
          setValidationStatus("valid");
          setModelInfo({
            name: model.name || model.id,
            contextLength: model.context_length,
            promptPrice: model.pricing?.prompt,
            completionPrice: model.pricing?.completion,
          });
        } else {
          setValidationStatus("invalid");
          setModelInfo(null);
        }
      } catch (err) {
        console.error("Failed to validate model:", err);
        setValidationStatus(null);
        setModelInfo(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [provider, inputValue, config.apiKey]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      setIsCustom(true);
      setShowDropdown(true);
      onChange(newValue);
    },
    [onChange],
  );

  const handleSelectModel = useCallback(
    (modelId: string) => {
      setInputValue(modelId);
      setIsCustom(false);
      setShowDropdown(false);
      onChange(modelId);
    },
    [onChange],
  );

  const handleFocus = useCallback(() => {
    if (provider === "openrouter") {
      setShowDropdown(true);
    }
  }, [provider]);

  const handleBlur = useCallback(() => {
    setTimeout(() => setShowDropdown(false), 200);
  }, []);

  const availableModels = useMemo(() => {
    if (provider === "openrouter") {
      return OPENROUTER_RECOMMENDED_MODELS;
    }
    return fetchedModels;
  }, [provider, fetchedModels]);

  const filteredModels = useMemo(() => {
    if (provider !== "openrouter") {
      return availableModels;
    }
    if (!inputValue) {
      return availableModels;
    }
    const exactMatch = availableModels.find((m) => m.id === inputValue);
    if (exactMatch) {
      return availableModels;
    }
    const search = inputValue.toLowerCase();
    const filtered = availableModels.filter(
      (m) =>
        m.id.toLowerCase().includes(search) ||
        m.name.toLowerCase().includes(search),
    );
    return filtered.length > 0 ? filtered : availableModels;
  }, [availableModels, inputValue, provider]);

  if (provider === "ollama" || provider === "lmstudio") {
    return (
      <div className={`input-group ${className}`}>
        <label htmlFor="model-select" className="input-label">
          Model
        </label>

        {fetchLoading ? (
          <div className="model-loading">
            <span className="model-loading__spinner"></span>
            <span>
              Connecting to {provider === "ollama" ? "Ollama" : "LM Studio"}...
            </span>
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
              {provider === "ollama"
                ? "No models installed. Run `ollama pull llama3.2` to download a model."
                : "No models loaded. Load a model in LM Studio first."}
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
                  {model.name}
                  {model.size ? ` (${model.size})` : ""}
                </option>
              ))}
            </select>
            <p className="input-hint">
              {fetchedModels.length} model
              {fetchedModels.length !== 1 ? "s" : ""} available
            </p>
          </>
        )}
      </div>
    );
  }

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
            validationStatus === "invalid" ? "input-field--error" : ""
          } ${validationStatus === "valid" ? "input-field--valid" : ""}`}
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

        <span className="model-combobox__status" aria-hidden="true">
          {validationStatus === "checking" && "⏳"}
          {validationStatus === "valid" && "✓"}
          {validationStatus === "invalid" && "✗"}
        </span>

        {showDropdown && filteredModels.length > 0 && (
          <ul className="model-combobox__dropdown" role="listbox">
            {filteredModels.map((model) => (
              <li
                key={model.id}
                className={`model-combobox__option ${model.id === value ? "model-combobox__option--selected" : ""}`}
                role="option"
                aria-selected={model.id === value}
                onClick={() => handleSelectModel(model.id)}
              >
                <span className="model-combobox__option-name">
                  {model.name}
                </span>
                <span className="model-combobox__option-id">{model.id}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div id="model-status">
        {validationStatus === "invalid" && (
          <p className="input-error">
            Invalid model ID. Use format: provider/model-name
          </p>
        )}

        {validationStatus === "valid" && modelInfo && (
          <div className="model-info">
            <span className="model-info__pricing">
              💰 Input: {formatPrice(modelInfo.promptPrice || 0)} · Output:{" "}
              {formatPrice(modelInfo.completionPrice || 0)}
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

        {validationStatus === "checking" && (
          <p className="input-hint">Validating model...</p>
        )}
      </div>
    </div>
  );
}
