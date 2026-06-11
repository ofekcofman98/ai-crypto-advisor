import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SelectionGrid from './SelectionGrid';

const STRING_OPTIONS = ['BTC', 'ETH', 'SOL'];
const OBJECT_OPTIONS = [
  { id: 'HODLER', name: 'HODLer', desc: 'Long-term believer' },
  { id: 'DAY_TRADER', name: 'Day Trader', desc: 'Fast-paced scalper' },
];

describe('SelectionGrid', () => {
  describe('string options', () => {
    it('renders all string options as buttons', () => {
      render(
        <SelectionGrid options={STRING_OPTIONS} selectedValues={[]} onSelect={vi.fn()} />
      );
      expect(screen.getByText('BTC')).toBeInTheDocument();
      expect(screen.getByText('ETH')).toBeInTheDocument();
      expect(screen.getByText('SOL')).toBeInTheDocument();
    });

    it('calls onSelect with the correct id when a button is clicked', () => {
      const onSelect = vi.fn();
      render(
        <SelectionGrid options={STRING_OPTIONS} selectedValues={[]} onSelect={onSelect} />
      );
      fireEvent.click(screen.getByText('ETH'));
      expect(onSelect).toHaveBeenCalledOnce();
      expect(onSelect).toHaveBeenCalledWith('ETH');
    });

    it('shows CheckCircle2 for selected string values', () => {
      render(
        <SelectionGrid options={STRING_OPTIONS} selectedValues={['BTC']} onSelect={vi.fn()} />
      );
      const btcButton = screen.getByText('BTC').closest('button');
      expect(btcButton?.querySelector('svg')).toBeTruthy();
    });

    it('does not show CheckCircle2 for unselected values', () => {
      render(
        <SelectionGrid options={['ETH']} selectedValues={[]} onSelect={vi.fn()} />
      );
      const ethButton = screen.getByText('ETH').closest('button');
      expect(ethButton?.querySelector('svg')).toBeFalsy();
    });
  });

  describe('object options', () => {
    it('renders name and description for object options', () => {
      render(
        <SelectionGrid options={OBJECT_OPTIONS} selectedValues="" onSelect={vi.fn()} />
      );
      expect(screen.getByText('HODLer')).toBeInTheDocument();
      expect(screen.getByText('Long-term believer')).toBeInTheDocument();
      expect(screen.getByText('Day Trader')).toBeInTheDocument();
    });

    it('calls onSelect with the option id for object options', () => {
      const onSelect = vi.fn();
      render(
        <SelectionGrid options={OBJECT_OPTIONS} selectedValues="" onSelect={onSelect} />
      );
      fireEvent.click(screen.getByText('HODLer'));
      expect(onSelect).toHaveBeenCalledWith('HODLER');
    });

    it('marks a single selected object option correctly', () => {
      render(
        <SelectionGrid options={OBJECT_OPTIONS} selectedValues="HODLER" onSelect={vi.fn()} />
      );
      const hodlerButton = screen.getByText('HODLer').closest('button');
      expect(hodlerButton?.querySelector('svg')).toBeTruthy();
    });
  });

  describe('accentColor prop', () => {
    it('applies secondary accent classes when accentColor is secondary', () => {
      render(
        <SelectionGrid
          options={['ETH']}
          selectedValues={['ETH']}
          onSelect={vi.fn()}
          accentColor="secondary"
        />
      );
      const btn = screen.getByText('ETH').closest('button');
      expect(btn?.className).toContain('border-secondary');
    });

    it('applies warning accent classes when accentColor is warning', () => {
      render(
        <SelectionGrid
          options={['SOL']}
          selectedValues={['SOL']}
          onSelect={vi.fn()}
          accentColor="warning"
        />
      );
      const btn = screen.getByText('SOL').closest('button');
      expect(btn?.className).toContain('border-warning');
    });
  });
});
