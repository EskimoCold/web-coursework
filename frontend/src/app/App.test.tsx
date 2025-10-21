import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import App from './App';

describe('App', () => {
  it('mounts with sidebar and header', () => {
    render(<App />);

    // Sidebar exists
    expect(screen.getByLabelText('sidebar')).toBeInTheDocument();

    // Header H1 shows current section (Категории)
    const h1 = screen.getByRole('heading', { level: 1, name: 'Категории' });
    expect(h1).toBeVisible();

    // Active nav item is 'Категории'
    const activeBtn = screen.getByRole('button', { name: 'Категории' });
    expect(activeBtn).toHaveAttribute('aria-current', 'page');

    // Content placeholder present
    expect(screen.getByLabelText('content-placeholder')).toBeInTheDocument();
  });
});
