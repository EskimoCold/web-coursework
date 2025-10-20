import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import App from './App';

describe('App', () => {
  it('mounts with sidebar and header', () => {
    render(<App />);
    expect(screen.getByLabelText('sidebar')).toBeInTheDocument();
    expect(screen.getByText('Категории')).toBeVisible();
    expect(screen.getByLabelText('content-placeholder')).toBeInTheDocument();
  });
});
