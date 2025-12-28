import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModelSelector } from './ModelSelector';

describe('ModelSelector', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render label', () => {
      render(<ModelSelector provider="openrouter" value="anthropic/claude-3.5-sonnet" onChange={mockOnChange} />);

      expect(screen.getByLabelText('Model')).toBeInTheDocument();
    });

    it('should render select dropdown', () => {
      render(<ModelSelector provider="openrouter" value="anthropic/claude-3.5-sonnet" onChange={mockOnChange} />);

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('should render dropdown icon', () => {
      const { container } = render(
        <ModelSelector provider="openrouter" value="anthropic/claude-3.5-sonnet" onChange={mockOnChange} />
      );

      const icon = container.querySelector('.model-selector__icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveTextContent('▼');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <ModelSelector provider="openrouter" value="anthropic/claude-3.5-sonnet" onChange={mockOnChange} className="custom-class" />
      );

      expect(container.querySelector('.model-selector.custom-class')).toBeInTheDocument();
    });
  });

  describe('OpenRouter Provider', () => {
    it('should render all OpenRouter models', () => {
      render(<ModelSelector provider="openrouter" value="anthropic/claude-3.5-sonnet" onChange={mockOnChange} />);

      expect(screen.getByRole('option', { name: /Claude 3.5 Sonnet/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /GPT-4 Turbo/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /^GPT-4$/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Gemini Pro/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Llama 3 70B/i })).toBeInTheDocument();
    });

    it('should display description for selected model', () => {
      render(<ModelSelector provider="openrouter" value="anthropic/claude-3.5-sonnet" onChange={mockOnChange} />);

      expect(screen.getByText('Best for analysis and reasoning')).toBeInTheDocument();
    });

    it('should show OpenRouter pricing note', () => {
      render(<ModelSelector provider="openrouter" value="anthropic/claude-3.5-sonnet" onChange={mockOnChange} />);

      expect(screen.getByText(/Different models have different pricing/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /OpenRouter's pricing/i })).toBeInTheDocument();
    });

    it('should have link with correct href', () => {
      render(<ModelSelector provider="openrouter" value="anthropic/claude-3.5-sonnet" onChange={mockOnChange} />);

      const link = screen.getByRole('link', { name: /OpenRouter's pricing/i });
      expect(link).toHaveAttribute('href', 'https://openrouter.ai/docs#models');
    });
  });

  describe('Ollama Provider', () => {
    it('should render all Ollama models', () => {
      render(<ModelSelector provider="ollama" value="llama3" onChange={mockOnChange} />);

      expect(screen.getByRole('option', { name: /Llama 3/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Mistral/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Mixtral 8x7B/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Phi-3/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Gemma/i })).toBeInTheDocument();
    });

    it('should display description for selected Ollama model', () => {
      render(<ModelSelector provider="ollama" value="llama3" onChange={mockOnChange} />);

      expect(screen.getByText("Meta's latest open model")).toBeInTheDocument();
    });

    it('should show Ollama pull command note', () => {
      render(<ModelSelector provider="ollama" value="llama3" onChange={mockOnChange} />);

      expect(screen.getByText(/Make sure the selected model is downloaded/i)).toBeInTheDocument();
      expect(screen.getByText(/ollama pull llama3/i)).toBeInTheDocument();
    });

    it('should show pull command for currently selected model', () => {
      render(<ModelSelector provider="ollama" value="mistral" onChange={mockOnChange} />);

      expect(screen.getByText(/ollama pull mistral/i)).toBeInTheDocument();
    });
  });

  describe('LM Studio Provider', () => {
    it('should render LM Studio model option', () => {
      render(<ModelSelector provider="lmstudio" value="local-model" onChange={mockOnChange} />);

      expect(screen.getByRole('option', { name: /Local Model/i })).toBeInTheDocument();
    });

    it('should display description for LM Studio model', () => {
      render(<ModelSelector provider="lmstudio" value="local-model" onChange={mockOnChange} />);

      expect(screen.getByText('Currently loaded model')).toBeInTheDocument();
    });

    it('should show LM Studio note', () => {
      render(<ModelSelector provider="lmstudio" value="local-model" onChange={mockOnChange} />);

      expect(screen.getByText(/whichever model is currently loaded in LM Studio/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onChange when model is selected', () => {
      render(<ModelSelector provider="openrouter" value="anthropic/claude-3.5-sonnet" onChange={mockOnChange} />);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'openai/gpt-4-turbo' } });

      expect(mockOnChange).toHaveBeenCalledWith('openai/gpt-4-turbo');
    });

    it('should update selected value in dropdown', () => {
      render(<ModelSelector provider="openrouter" value="anthropic/claude-3.5-sonnet" onChange={mockOnChange} />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('anthropic/claude-3.5-sonnet');

      fireEvent.change(select, { target: { value: 'openai/gpt-4' } });

      expect(mockOnChange).toHaveBeenCalledWith('openai/gpt-4');
    });

    it('should update description when model changes', () => {
      const { rerender } = render(
        <ModelSelector provider="openrouter" value="anthropic/claude-3.5-sonnet" onChange={mockOnChange} />
      );

      expect(screen.getByText('Best for analysis and reasoning')).toBeInTheDocument();

      rerender(<ModelSelector provider="openrouter" value="openai/gpt-4-turbo" onChange={mockOnChange} />);

      expect(screen.getByText('Fast and capable')).toBeInTheDocument();
      expect(screen.queryByText('Best for analysis and reasoning')).not.toBeInTheDocument();
    });

    // Note: HTML select elements fire change events even when disabled.
    // The disabled attribute prevents user interaction, not programmatic changes in tests.
  });

  describe('Disabled State', () => {
    it('should disable select when disabled prop is true', () => {
      render(<ModelSelector provider="openrouter" value="anthropic/claude-3.5-sonnet" onChange={mockOnChange} disabled />);

      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });

    it('should still render models when disabled', () => {
      render(<ModelSelector provider="openrouter" value="anthropic/claude-3.5-sonnet" onChange={mockOnChange} disabled />);

      expect(screen.getByRole('option', { name: /Claude 3.5 Sonnet/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /^GPT-4$/i })).toBeInTheDocument();
    });
  });

  describe('Provider Switching', () => {
    it('should update available models when provider changes', () => {
      const { rerender } = render(
        <ModelSelector provider="openrouter" value="anthropic/claude-3.5-sonnet" onChange={mockOnChange} />
      );

      expect(screen.getByRole('option', { name: /Claude 3.5 Sonnet/i })).toBeInTheDocument();

      rerender(<ModelSelector provider="ollama" value="llama3" onChange={mockOnChange} />);

      expect(screen.queryByRole('option', { name: /Claude 3.5 Sonnet/i })).not.toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Llama 3/i })).toBeInTheDocument();
    });

    it('should update provider-specific notes when provider changes', () => {
      const { rerender } = render(
        <ModelSelector provider="openrouter" value="anthropic/claude-3.5-sonnet" onChange={mockOnChange} />
      );

      expect(screen.getByText(/Different models have different pricing/i)).toBeInTheDocument();

      rerender(<ModelSelector provider="ollama" value="llama3" onChange={mockOnChange} />);

      expect(screen.queryByText(/Different models have different pricing/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Make sure the selected model is downloaded/i)).toBeInTheDocument();
    });
  });

  describe('Empty Models', () => {
    it('should show "No models available" for unknown provider', () => {
      render(<ModelSelector provider="unknown-provider" value="" onChange={mockOnChange} />);

      expect(screen.getByRole('option', { name: /No models available/i })).toBeInTheDocument();
    });

    it('should not show description when no models available', () => {
      const { container } = render(
        <ModelSelector provider="unknown-provider" value="" onChange={mockOnChange} />
      );

      const description = container.querySelector('#model-description');
      expect(description).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper id on select element', () => {
      render(<ModelSelector provider="openrouter" value="anthropic/claude-3.5-sonnet" onChange={mockOnChange} />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('id', 'model-select');
    });

    it('should have label associated with select', () => {
      render(<ModelSelector provider="openrouter" value="anthropic/claude-3.5-sonnet" onChange={mockOnChange} />);

      const label = screen.getByText('Model');
      expect(label).toHaveAttribute('for', 'model-select');
    });

    it('should have aria-describedby for description', () => {
      render(<ModelSelector provider="openrouter" value="anthropic/claude-3.5-sonnet" onChange={mockOnChange} />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-describedby', 'model-description');
    });

    it('should have description with matching id', () => {
      render(<ModelSelector provider="openrouter" value="anthropic/claude-3.5-sonnet" onChange={mockOnChange} />);

      const description = screen.getByText('Best for analysis and reasoning');
      expect(description).toHaveAttribute('id', 'model-description');
    });

    it('should have aria-hidden on dropdown icon', () => {
      const { container } = render(
        <ModelSelector provider="openrouter" value="anthropic/claude-3.5-sonnet" onChange={mockOnChange} />
      );

      const icon = container.querySelector('.model-selector__icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have target="_blank" and rel="noopener noreferrer" on external links', () => {
      render(<ModelSelector provider="openrouter" value="anthropic/claude-3.5-sonnet" onChange={mockOnChange} />);

      const link = screen.getByRole('link', { name: /OpenRouter's pricing/i });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Model Options', () => {
    it('should have correct value attributes for OpenRouter models', () => {
      render(<ModelSelector provider="openrouter" value="anthropic/claude-3.5-sonnet" onChange={mockOnChange} />);

      expect(screen.getByRole('option', { name: /Claude 3.5 Sonnet/i })).toHaveValue('anthropic/claude-3.5-sonnet');
      expect(screen.getByRole('option', { name: /GPT-4 Turbo/i })).toHaveValue('openai/gpt-4-turbo');
      expect(screen.getByRole('option', { name: /Gemini Pro/i })).toHaveValue('google/gemini-pro');
    });

    it('should have correct value attributes for Ollama models', () => {
      render(<ModelSelector provider="ollama" value="llama3" onChange={mockOnChange} />);

      expect(screen.getByRole('option', { name: /Llama 3/i })).toHaveValue('llama3');
      expect(screen.getByRole('option', { name: /Mistral/i })).toHaveValue('mistral');
      expect(screen.getByRole('option', { name: /Mixtral 8x7B/i })).toHaveValue('mixtral');
    });

    it('should have correct value attribute for LM Studio model', () => {
      render(<ModelSelector provider="lmstudio" value="local-model" onChange={mockOnChange} />);

      expect(screen.getByRole('option', { name: /Local Model/i })).toHaveValue('local-model');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined value gracefully', () => {
      render(<ModelSelector provider="openrouter" value={undefined} onChange={mockOnChange} />);

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    // Note: Empty string and invalid values default to first option in HTML select.
    // This is standard HTML behavior, not a component bug.

    it('should not show description for invalid model', () => {
      const { container } = render(
        <ModelSelector provider="openrouter" value="invalid-model" onChange={mockOnChange} />
      );

      const description = container.querySelector('#model-description');
      expect(description).not.toBeInTheDocument();
    });

    it('should handle rapid provider switches', () => {
      const { rerender } = render(
        <ModelSelector provider="openrouter" value="anthropic/claude-3.5-sonnet" onChange={mockOnChange} />
      );

      rerender(<ModelSelector provider="ollama" value="llama3" onChange={mockOnChange} />);
      rerender(<ModelSelector provider="lmstudio" value="local-model" onChange={mockOnChange} />);
      rerender(<ModelSelector provider="openrouter" value="anthropic/claude-3.5-sonnet" onChange={mockOnChange} />);

      expect(screen.getByRole('option', { name: /Claude 3.5 Sonnet/i })).toBeInTheDocument();
    });
  });
});
