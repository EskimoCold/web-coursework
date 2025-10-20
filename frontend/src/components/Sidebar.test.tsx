import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { Sidebar } from './Sidebar';

describe('Sidebar', () => {
  it('renders nav items and active state', () => {
    const onSelect = vi.fn();
    render(<Sidebar active="Категории" onSelect={onSelect} />);

    // All items present
    for (const name of ['Главная', 'Аналитика', 'Категории', 'Настройки']) {
      expect(screen.getByRole('button', { name })).toBeVisible();
    }

    // Active “Категории”
    const active = screen.getByRole('button', { name: 'Категории' });
    expect(active).toHaveAttribute('aria-current', 'page');
  });

  it('invokes onSelect when a nav item is clicked', () => {
    const onSelect = vi.fn();
    render(<Sidebar active="Категории" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Главная' }));
    expect(onSelect).toHaveBeenCalledWith('Главная');
  });

  it('has exit button', () => {
    render(<Sidebar active="Категории" onSelect={() => {}} />);
    expect(screen.getByLabelText('Выход')).toBeInTheDocument();
  });
});
