import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Home } from './Home';

describe('Home', () => {
  it('loads and shows todos from API', async () => {
    render(<Home />);
    expect(screen.getByText(/Loading/)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText('todo-list')).toBeInTheDocument();
    });
    expect(screen.getByText('Buy coffee beans')).toBeInTheDocument();
    expect(screen.getByText('Write unit tests')).toBeInTheDocument();
  });
});
