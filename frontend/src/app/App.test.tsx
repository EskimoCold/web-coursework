import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import App from './App';

vi.mock('../pages/Home', () => ({ Home: () => <div data-testid="home" /> }));

describe('App', () => {
  it('renders title and Home', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Mock Frontend' })).toBeInTheDocument();
    expect(screen.getByTestId('home')).toBeInTheDocument();
  });
});
