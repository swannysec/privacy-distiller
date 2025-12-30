import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TipsModal } from './TipsModal';

describe('TipsModal', () => {
  it('should render modal with title', () => {
    const onClose = vi.fn();
    render(<TipsModal onClose={onClose} />);

    expect(screen.getByText(/Tips for Best Results/i)).toBeInTheDocument();
  });

  it('should render all tip items', () => {
    const onClose = vi.fn();
    const { container } = render(<TipsModal onClose={onClose} />);

    // Check for all 5 tip sections by their headings
    const tipTitles = container.querySelectorAll('.tip-item__title');
    expect(tipTitles).toHaveLength(5);

    const titleTexts = Array.from(tipTitles).map(el => el.textContent);
    expect(titleTexts).toContain('🔄 Comparing Documents');
    expect(titleTexts).toContain('🎯 Find Your Model');
    expect(titleTexts).toContain('⭐ Gemini 3 Flash');
    expect(titleTexts).toContain('🔍 Stringent Analysis');
    expect(titleTexts).toContain('📊 ChatGPT Models');
  });

  it('should render tip content', () => {
    const onClose = vi.fn();
    render(<TipsModal onClose={onClose} />);

    // Check for specific tip content
    expect(
      screen.getByText(/use the same model for consistency/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Gemini 3 Flash is very consistent/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/gpt-oss:120b and Nemotron 3 are more variable/i)
    ).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<TipsModal onClose={onClose} />);

    const closeButton = screen.getByLabelText(/close tips/i);
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Got It button is clicked', () => {
    const onClose = vi.fn();
    render(<TipsModal onClose={onClose} />);

    const gotItButton = screen.getByRole('button', { name: /got it/i });
    fireEvent.click(gotItButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should stop propagation on modal click', () => {
    const onClose = vi.fn();
    const { container } = render(<TipsModal onClose={onClose} />);

    const modal = container.querySelector('.modal');
    fireEvent.click(modal);

    // onClose should not be called because stopPropagation prevents it
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should render with custom className', () => {
    const onClose = vi.fn();
    const { container } = render(
      <TipsModal onClose={onClose} className="custom-class" />
    );

    const modal = container.querySelector('.modal.custom-class');
    expect(modal).toBeInTheDocument();
  });

  it('should have proper ARIA attributes', () => {
    const onClose = vi.fn();
    render(<TipsModal onClose={onClose} />);

    const closeButton = screen.getByLabelText(/close tips/i);
    expect(closeButton).toHaveAttribute('type', 'button');
    expect(closeButton).toHaveAttribute('aria-label', 'Close tips');
  });

  it('should render intro text', () => {
    const onClose = vi.fn();
    render(<TipsModal onClose={onClose} />);

    expect(
      screen.getByText(/Get the most out of your privacy policy analysis/i)
    ).toBeInTheDocument();
  });

  it('should have proper semantic structure', () => {
    const onClose = vi.fn();
    const { container } = render(<TipsModal onClose={onClose} />);

    expect(container.querySelector('.modal__header')).toBeInTheDocument();
    expect(container.querySelector('.modal__body')).toBeInTheDocument();
    expect(container.querySelector('.modal__footer')).toBeInTheDocument();
    expect(container.querySelector('.tips-content')).toBeInTheDocument();
    expect(container.querySelector('.tips-list')).toBeInTheDocument();
  });
});
