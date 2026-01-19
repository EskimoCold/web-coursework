import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Layout } from './Layout';

describe('Layout', () => {
  it('renders children and basic regions', () => {
    render(
      <Layout>
        <div>children</div>
      </Layout>,
    );
    expect(screen.getByText('children')).toBeVisible();
    expect(screen.getByLabelText('main-layout')).toBeInTheDocument();
  });
});
