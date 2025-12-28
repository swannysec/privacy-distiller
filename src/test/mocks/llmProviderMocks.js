import { vi } from 'vitest';

/**
 * Mock LLM Provider implementations for testing
 */

export const createMockLLMProvider = (overrides = {}) => {
  return {
    name: 'MockProvider',
    isConfigured: vi.fn().mockReturnValue(true),
    validateConfig: vi.fn().mockReturnValue({ isValid: true }),
    analyzePolicy: vi.fn().mockResolvedValue({
      summary: {
        brief: 'Test brief summary',
        detailed: 'Test detailed summary',
        full: 'Test full summary',
      },
      risks: [
        {
          category: 'Data Collection',
          severity: 'high',
          description: 'Test risk description',
          impact: 'Test impact',
        },
      ],
      keyTerms: [
        {
          term: 'Test Term',
          definition: 'Test definition',
        },
      ],
    }),
    ...overrides,
  };
};

export const createFailingLLMProvider = (errorMessage = 'API Error') => {
  return {
    name: 'FailingProvider',
    isConfigured: vi.fn().mockReturnValue(true),
    validateConfig: vi.fn().mockReturnValue({ isValid: true }),
    analyzePolicy: vi.fn().mockRejectedValue(new Error(errorMessage)),
  };
};

export const createSlowLLMProvider = (delay = 1000) => {
  return {
    name: 'SlowProvider',
    isConfigured: vi.fn().mockReturnValue(true),
    validateConfig: vi.fn().mockReturnValue({ isValid: true }),
    analyzePolicy: vi.fn().mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                summary: { brief: 'Slow response', detailed: '', full: '' },
                risks: [],
                keyTerms: [],
              }),
            delay
          )
        )
    ),
  };
};

export const mockOpenRouterResponse = {
  id: 'chatcmpl-123',
  object: 'chat.completion',
  created: 1677652288,
  model: 'gpt-3.5-turbo',
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: JSON.stringify({
          summary: {
            brief: 'Brief summary from OpenRouter',
            detailed: 'Detailed summary from OpenRouter',
            full: 'Full summary from OpenRouter',
          },
          risks: [
            {
              category: 'Data Collection',
              severity: 'high',
              description: 'Extensive data collection',
              impact: 'Privacy concerns',
            },
          ],
          keyTerms: [
            {
              term: 'Personal Data',
              definition: 'Information that identifies you',
            },
          ],
        }),
      },
      finish_reason: 'stop',
    },
  ],
  usage: {
    prompt_tokens: 100,
    completion_tokens: 200,
    total_tokens: 300,
  },
};

export const mockOllamaResponse = {
  model: 'llama2',
  created_at: '2024-01-01T00:00:00Z',
  message: {
    role: 'assistant',
    content: JSON.stringify({
      summary: {
        brief: 'Brief summary from Ollama',
        detailed: 'Detailed summary from Ollama',
        full: 'Full summary from Ollama',
      },
      risks: [],
      keyTerms: [],
    }),
  },
  done: true,
};

export const mockLMStudioResponse = {
  id: 'lmstudio-123',
  object: 'chat.completion',
  created: 1677652288,
  model: 'local-model',
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: JSON.stringify({
          summary: {
            brief: 'Brief summary from LM Studio',
            detailed: 'Detailed summary from LM Studio',
            full: 'Full summary from LM Studio',
          },
          risks: [],
          keyTerms: [],
        }),
      },
      finish_reason: 'stop',
    },
  ],
};
