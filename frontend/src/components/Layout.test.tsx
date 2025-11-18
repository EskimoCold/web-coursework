import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Layout } from './Layout';

describe('Layout', () => {
  it('renders header title and basic regions', () => {
    render(
      <Layout title="Категории">
        <div>children</div>
      </Layout>,
    );
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('Категории')).toBeVisible();
    expect(screen.getByLabelText('main-layout')).toBeInTheDocument();
  });
});
