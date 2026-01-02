import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { ModelSelector } from './ModelSelector';
import { LLMConfigProvider } from '../../contexts/LLMConfigContext';
import type { ReactNode } from 'react';

// Wrapper component for tests
const renderWithProvider = (ui: ReactNode, options?: Parameters<typeof render>[1]) => {
  return render(
    <LLMConfigProvider>{ui}</LLMConfigProvider>,
    options
  );
};

// Mock fetch for Ollama API
const mockOllamaModels = {
  models: [
    { name: 'llama3', size: 4000000000, details: { parameter_size: '8B' } },
    { name: 'mistral', size: 4000000000, details: { parameter_size: '7B' } },
    { name: 'mixtral', size: 26000000000, details: { parameter_size: '8x7B' } },
  ]
};

// Mock fetch for LM Studio API
const mockLMStudioModels = {
  data: [
    { id: 'local-model-1' },
    { id: 'local-model-2' },
  ]
};

describe('ModelSelector', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch for Ollama tests
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOllamaModels),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render label for OpenRouter', () => {
      renderWithProvider(<ModelSelector provider="openrouter" value="anthropic/claude-haiku-4.5" onChange={mockOnChange} />);

      expect(screen.getByLabelText('Model')).toBeInTheDocument();
    });

    it('should render text input for OpenRouter (combobox)', () => {
      renderWithProvider(<ModelSelector provider="openrouter" value="anthropic/claude-haiku-4.5" onChange={mockOnChange} />);

      const input = screen.getByRole('textbox', { name: /model/i });
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Select or type a model ID...');
    });

    it('should render select dropdown for Ollama', async () => {
      renderWithProvider(<ModelSelector provider="ollama" value="llama3" onChange={mockOnChange} />);

      // Wait for models to load
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });

    it('should apply custom className', () => {
      const { container } = renderWithProvider(
        <ModelSelector provider="openrouter" value="anthropic/claude-haiku-4.5" onChange={mockOnChange} className="custom-class" />
      );

      expect(container.querySelector('.model-combobox.custom-class')).toBeInTheDocument();
    });
  });

  describe('OpenRouter Provider', () => {
    it('should show dropdown with recommended models on focus', async () => {
      renderWithProvider(<ModelSelector provider="openrouter" value="" onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      await waitFor(() => {
        // Should show dropdown with recommended models
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('should display recommended models in dropdown', async () => {
      renderWithProvider(<ModelSelector provider="openrouter" value="" onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      await waitFor(() => {
        const listbox = screen.getByRole('listbox');
        const options = within(listbox).getAllByRole('option');
        expect(options.length).toBeGreaterThan(0);
      });
    });

    it('should allow typing custom model ID', () => {
      renderWithProvider(<ModelSelector provider="openrouter" value="" onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'custom/model-id' } });

      expect(mockOnChange).toHaveBeenCalledWith('custom/model-id');
    });

    it('should show hint text when input is empty', () => {
      renderWithProvider(<ModelSelector provider="openrouter" value="" onChange={mockOnChange} />);

      expect(screen.getByText(/Select a recommended model or enter any OpenRouter model ID/i)).toBeInTheDocument();
    });

    it('should have aria-haspopup attribute', () => {
      renderWithProvider(<ModelSelector provider="openrouter" value="" onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-haspopup', 'listbox');
    });
  });

  describe('Ollama Provider', () => {
    it('should render fetched Ollama models', async () => {
      renderWithProvider(<ModelSelector provider="ollama" value="llama3" onChange={mockOnChange} />);

      // Wait for models to load from API
      await waitFor(() => {
        expect(screen.getByRole('option', { name: /llama3/i })).toBeInTheDocument();
      });
      expect(screen.getByRole('option', { name: /mistral/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /mixtral/i })).toBeInTheDocument();
    });

    it('should show loading state while fetching models', () => {
      // Mock a delayed fetch
      global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));

      renderWithProvider(<ModelSelector provider="ollama" value="llama3" onChange={mockOnChange} />);

      expect(screen.getByText(/Connecting to Ollama/i)).toBeInTheDocument();
    });

    it('should show loading spinner', () => {
      global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));

      const { container } = renderWithProvider(<ModelSelector provider="ollama" value="llama3" onChange={mockOnChange} />);

      expect(container.querySelector('.model-loading__spinner')).toBeInTheDocument();
    });

    it('should display model size info', async () => {
      renderWithProvider(<ModelSelector provider="ollama" value="llama3" onChange={mockOnChange} />);

      await waitFor(() => {
        // Model options include size info
        const llama3Option = screen.getByRole('option', { name: /llama3.*4\.0GB/i });
        expect(llama3Option).toBeInTheDocument();
      });
    });

    it('should show error when Ollama is not running', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

      renderWithProvider(<ModelSelector provider="ollama" value="llama3" onChange={mockOnChange} />);

      await waitFor(() => {
        expect(screen.getByText(/Unable to connect to Ollama/i)).toBeInTheDocument();
      });
    });

    it('should show error icon when fetch fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

      const { container } = renderWithProvider(<ModelSelector provider="ollama" value="llama3" onChange={mockOnChange} />);

      await waitFor(() => {
        expect(container.querySelector('.model-error__icon')).toBeInTheDocument();
      });
    });

    it('should show count of available models', async () => {
      renderWithProvider(<ModelSelector provider="ollama" value="llama3" onChange={mockOnChange} />);

      await waitFor(() => {
        expect(screen.getByText(/3 models available/i)).toBeInTheDocument();
      });
    });
  });

  describe('LM Studio Provider', () => {
    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLMStudioModels),
      });
    });

    it('should render fetched LM Studio models', async () => {
      renderWithProvider(<ModelSelector provider="lmstudio" value="local-model-1" onChange={mockOnChange} />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: /local-model-1/i })).toBeInTheDocument();
      });
      expect(screen.getByRole('option', { name: /local-model-2/i })).toBeInTheDocument();
    });

    it('should show loading state while connecting', () => {
      global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));

      renderWithProvider(<ModelSelector provider="lmstudio" value="local-model" onChange={mockOnChange} />);

      expect(screen.getByText(/Connecting to LM Studio/i)).toBeInTheDocument();
    });

    it('should show error when LM Studio is not running', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

      renderWithProvider(<ModelSelector provider="lmstudio" value="local-model" onChange={mockOnChange} />);

      await waitFor(() => {
        expect(screen.getByText(/Unable to connect to LM Studio/i)).toBeInTheDocument();
      });
    });

    it('should show empty state when no models loaded', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      renderWithProvider(<ModelSelector provider="lmstudio" value="" onChange={mockOnChange} />);

      await waitFor(() => {
        expect(screen.getByText(/No models loaded/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should call onChange when model is selected from dropdown (OpenRouter)', async () => {
      renderWithProvider(<ModelSelector provider="openrouter" value="" onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Click on first option
      const options = screen.getAllByRole('option');
      fireEvent.click(options[0]);

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should call onChange when model is selected (Ollama)', async () => {
      renderWithProvider(<ModelSelector provider="ollama" value="llama3" onChange={mockOnChange} />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'mistral' } });

      expect(mockOnChange).toHaveBeenCalledWith('mistral');
    });

    it('should call onChange when typing in input (OpenRouter)', () => {
      renderWithProvider(<ModelSelector provider="openrouter" value="" onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test/model' } });

      expect(mockOnChange).toHaveBeenCalledWith('test/model');
    });
  });

  describe('Disabled State', () => {
    it('should disable input when disabled prop is true (OpenRouter)', () => {
      renderWithProvider(<ModelSelector provider="openrouter" value="anthropic/claude-haiku-4.5" onChange={mockOnChange} disabled />);

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('should disable select when disabled prop is true (Ollama)', async () => {
      renderWithProvider(<ModelSelector provider="ollama" value="llama3" onChange={mockOnChange} disabled />);

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toBeDisabled();
      });
    });
  });

  describe('Provider Switching', () => {
    it('should update UI when provider changes from OpenRouter to Ollama', async () => {
      const { rerender } = renderWithProvider(
        <ModelSelector provider="openrouter" value="" onChange={mockOnChange} />
      );

      // OpenRouter shows text input
      expect(screen.getByRole('textbox')).toBeInTheDocument();

      rerender(
        <LLMConfigProvider>
          <ModelSelector provider="ollama" value="llama3" onChange={mockOnChange} />
        </LLMConfigProvider>
      );

      // Ollama shows select dropdown after loading
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper id on input element (OpenRouter)', () => {
      renderWithProvider(<ModelSelector provider="openrouter" value="" onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'model-input');
    });

    it('should have label associated with input (OpenRouter)', () => {
      renderWithProvider(<ModelSelector provider="openrouter" value="" onChange={mockOnChange} />);

      const label = screen.getByText('Model');
      expect(label).toHaveAttribute('for', 'model-input');
    });

    it('should have aria-describedby for status (OpenRouter)', () => {
      renderWithProvider(<ModelSelector provider="openrouter" value="" onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'model-status');
    });

    it('should have aria-expanded attribute (OpenRouter)', () => {
      renderWithProvider(<ModelSelector provider="openrouter" value="" onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });

    it('should set aria-expanded to true when dropdown is open', async () => {
      renderWithProvider(<ModelSelector provider="openrouter" value="" onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should have proper id on select element (Ollama)', async () => {
      renderWithProvider(<ModelSelector provider="ollama" value="llama3" onChange={mockOnChange} />);

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toHaveAttribute('id', 'model-select');
      });
    });

    it('should have label associated with select (Ollama)', async () => {
      renderWithProvider(<ModelSelector provider="ollama" value="llama3" onChange={mockOnChange} />);

      await waitFor(() => {
        const label = screen.getByText('Model');
        expect(label).toHaveAttribute('for', 'model-select');
      });
    });
  });

  describe('Model Options', () => {
    it('should have correct value attributes for Ollama models', async () => {
      renderWithProvider(<ModelSelector provider="ollama" value="llama3" onChange={mockOnChange} />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: /llama3/i })).toHaveValue('llama3');
        expect(screen.getByRole('option', { name: /mistral/i })).toHaveValue('mistral');
        expect(screen.getByRole('option', { name: /mixtral/i })).toHaveValue('mixtral');
      });
    });

    it('should have correct value attributes for LM Studio models', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLMStudioModels),
      });

      renderWithProvider(<ModelSelector provider="lmstudio" value="local-model-1" onChange={mockOnChange} />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: /local-model-1/i })).toHaveValue('local-model-1');
        expect(screen.getByRole('option', { name: /local-model-2/i })).toHaveValue('local-model-2');
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty state for Ollama with no models', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ models: [] }),
      });

      renderWithProvider(<ModelSelector provider="ollama" value="" onChange={mockOnChange} />);

      await waitFor(() => {
        expect(screen.getByText(/No models installed/i)).toBeInTheDocument();
      });
    });

    it('should suggest ollama pull command when no models', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ models: [] }),
      });

      renderWithProvider(<ModelSelector provider="ollama" value="" onChange={mockOnChange} />);

      await waitFor(() => {
        expect(screen.getByText(/ollama pull/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined value gracefully', () => {
      renderWithProvider(<ModelSelector provider="openrouter" value={undefined as unknown as string} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect((input as HTMLInputElement).value).toBe('');
    });

    it('should handle empty string value', () => {
      renderWithProvider(<ModelSelector provider="openrouter" value="" onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      expect((input as HTMLInputElement).value).toBe('');
    });

    it('should handle rapid provider switches', async () => {
      const { rerender } = renderWithProvider(
        <ModelSelector provider="openrouter" value="" onChange={mockOnChange} />
      );

      rerender(
        <LLMConfigProvider>
          <ModelSelector provider="ollama" value="llama3" onChange={mockOnChange} />
        </LLMConfigProvider>
      );
      rerender(
        <LLMConfigProvider>
          <ModelSelector provider="lmstudio" value="local-model" onChange={mockOnChange} />
        </LLMConfigProvider>
      );
      rerender(
        <LLMConfigProvider>
          <ModelSelector provider="openrouter" value="" onChange={mockOnChange} />
        </LLMConfigProvider>
      );

      // Should end up showing OpenRouter combobox
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });
});
