import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  describe('rendering', () => {
    it('should render children', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should render without title or subtitle', () => {
      render(<Card>Content only</Card>);
      expect(screen.getByText('Content only')).toBeInTheDocument();
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });
  });

  describe('title', () => {
    it('should render with title', () => {
      render(<Card title="Card Title">Content</Card>);
      expect(screen.getByRole('heading', { name: 'Card Title' })).toBeInTheDocument();
    });

    it('should render title as h3 element', () => {
      render(<Card title="Test Title">Content</Card>);
      const title = screen.getByRole('heading', { name: 'Test Title' });
      expect(title.tagName).toBe('H3');
    });

    it('should apply card__title class to title', () => {
      render(<Card title="Test Title">Content</Card>);
      const title = screen.getByRole('heading', { name: 'Test Title' });
      expect(title.className).toContain('card__title');
    });
  });

  describe('subtitle', () => {
    it('should render with subtitle', () => {
      render(<Card subtitle="Card subtitle">Content</Card>);
      expect(screen.getByText('Card subtitle')).toBeInTheDocument();
    });

    it('should render subtitle as paragraph', () => {
      render(<Card subtitle="Test subtitle">Content</Card>);
      const subtitle = screen.getByText('Test subtitle');
      expect(subtitle.tagName).toBe('P');
    });

    it('should apply card__subtitle class to subtitle', () => {
      render(<Card subtitle="Test subtitle">Content</Card>);
      const subtitle = screen.getByText('Test subtitle');
      expect(subtitle.className).toContain('card__subtitle');
    });
  });

  describe('header', () => {
    it('should not render header when no title or subtitle', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.querySelector('.card__header')).not.toBeInTheDocument();
    });

    it('should render header with title only', () => {
      const { container } = render(<Card title="Title">Content</Card>);
      const header = container.querySelector('.card__header');
      expect(header).toBeInTheDocument();
      expect(header.children).toHaveLength(1);
      expect(header.querySelector('.card__title')).toBeInTheDocument();
    });

    it('should render header with subtitle only', () => {
      const { container } = render(<Card subtitle="Subtitle">Content</Card>);
      const header = container.querySelector('.card__header');
      expect(header).toBeInTheDocument();
      expect(header.children).toHaveLength(1);
      expect(header.querySelector('.card__subtitle')).toBeInTheDocument();
    });

    it('should render header with both title and subtitle', () => {
      const { container } = render(
        <Card title="Title" subtitle="Subtitle">
          Content
        </Card>
      );
      const header = container.querySelector('.card__header');
      expect(header).toBeInTheDocument();
      expect(header.children).toHaveLength(2);
      expect(header.querySelector('.card__title')).toBeInTheDocument();
      expect(header.querySelector('.card__subtitle')).toBeInTheDocument();
    });
  });

  describe('content', () => {
    it('should wrap children in card__content', () => {
      const { container } = render(<Card>Test content</Card>);
      const content = container.querySelector('.card__content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveTextContent('Test content');
    });

    it('should render complex children', () => {
      render(
        <Card>
          <p>Paragraph 1</p>
          <p>Paragraph 2</p>
        </Card>
      );
      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
    });

    it('should render React components as children', () => {
      const CustomComponent = () => <div>Custom Component</div>;
      render(
        <Card>
          <CustomComponent />
        </Card>
      );
      expect(screen.getByText('Custom Component')).toBeInTheDocument();
    });
  });

  describe('className', () => {
    it('should apply base card class', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.querySelector('.card');
      expect(card).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<Card className="custom-card">Content</Card>);
      const card = container.querySelector('.card');
      expect(card.className).toContain('card');
      expect(card.className).toContain('custom-card');
    });

    it('should handle empty className', () => {
      const { container } = render(<Card className="">Content</Card>);
      const card = container.querySelector('.card');
      expect(card.className).toBe('card ');
    });
  });

  describe('additional props', () => {
    it('should forward additional props to card element', () => {
      const { container } = render(
        <Card data-testid="custom-card" data-custom="value">
          Content
        </Card>
      );
      const card = screen.getByTestId('custom-card');
      expect(card).toHaveAttribute('data-custom', 'value');
    });

    it('should support id attribute', () => {
      const { container } = render(<Card id="my-card">Content</Card>);
      const card = container.querySelector('#my-card');
      expect(card).toBeInTheDocument();
    });

    it('should support role attribute', () => {
      render(<Card role="region">Content</Card>);
      const card = screen.getByRole('region');
      expect(card).toBeInTheDocument();
    });
  });

  describe('component structure', () => {
    it('should render with correct structure (no header)', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.querySelector('.card');
      expect(card.children).toHaveLength(1);
      expect(card.querySelector('.card__content')).toBeInTheDocument();
    });

    it('should render with correct structure (with header)', () => {
      const { container } = render(<Card title="Title">Content</Card>);
      const card = container.querySelector('.card');
      expect(card.children).toHaveLength(2);
      expect(card.children[0]).toBe(card.querySelector('.card__header'));
      expect(card.children[1]).toBe(card.querySelector('.card__content'));
    });

    it('should maintain structure with all props', () => {
      const { container } = render(
        <Card title="Title" subtitle="Subtitle" className="custom">
          <div>Content</div>
        </Card>
      );
      const card = container.querySelector('.card');
      const header = card.querySelector('.card__header');
      const content = card.querySelector('.card__content');

      expect(card.children).toHaveLength(2);
      expect(header).toBeInTheDocument();
      expect(content).toBeInTheDocument();
      expect(header.querySelector('.card__title')).toHaveTextContent('Title');
      expect(header.querySelector('.card__subtitle')).toHaveTextContent('Subtitle');
      expect(content).toHaveTextContent('Content');
    });
  });

  describe('empty states', () => {
    it('should render with empty children', () => {
      const { container } = render(<Card></Card>);
      const content = container.querySelector('.card__content');
      expect(content).toBeInTheDocument();
      expect(content).toBeEmptyDOMElement();
    });

    it('should render with null children', () => {
      const { container } = render(<Card>{null}</Card>);
      const content = container.querySelector('.card__content');
      expect(content).toBeInTheDocument();
    });

    it('should render with undefined children', () => {
      const { container } = render(<Card>{undefined}</Card>);
      const content = container.querySelector('.card__content');
      expect(content).toBeInTheDocument();
    });

    it('should handle empty title', () => {
      render(<Card title="">Content</Card>);
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should handle empty subtitle', () => {
      const { container } = render(<Card subtitle="">Content</Card>);
      expect(container.querySelector('.card__subtitle')).not.toBeInTheDocument();
    });
  });

  describe('multiple cards', () => {
    it('should render multiple cards independently', () => {
      render(
        <>
          <Card title="Card 1">Content 1</Card>
          <Card title="Card 2">Content 2</Card>
          <Card title="Card 3">Content 3</Card>
        </>
      );

      expect(screen.getByRole('heading', { name: 'Card 1' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Card 2' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Card 3' })).toBeInTheDocument();
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
      expect(screen.getByText('Content 3')).toBeInTheDocument();
    });
  });
});
