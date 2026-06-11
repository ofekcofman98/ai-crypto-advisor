import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CardGrid from './CardGrid';

describe('CardGrid', () => {
  it('renders all children inside the wrapper', () => {
    render(
      <CardGrid>
        <div data-testid="card-a">Card A</div>
        <div data-testid="card-b">Card B</div>
        <div data-testid="card-c">Card C</div>
      </CardGrid>,
    );

    expect(screen.getByTestId('card-a')).toBeInTheDocument();
    expect(screen.getByTestId('card-b')).toBeInTheDocument();
    expect(screen.getByTestId('card-c')).toBeInTheDocument();
  });

  it('wrapper element carries the "grid" Tailwind class', () => {
    const { container } = render(
      <CardGrid>
        <div>Child</div>
      </CardGrid>,
    );

    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain('grid');
  });

  it('applies the two-column responsive layout class', () => {
    const { container } = render(
      <CardGrid>
        <div>Child</div>
      </CardGrid>,
    );

    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain('md:grid-cols-2');
  });

  it('children are direct descendants of the grid wrapper', () => {
    const { container } = render(
      <CardGrid>
        <div data-testid="child-1">One</div>
        <div data-testid="child-2">Two</div>
      </CardGrid>,
    );

    const wrapper = container.firstElementChild;
    expect(wrapper?.children).toHaveLength(2);
  });
});
