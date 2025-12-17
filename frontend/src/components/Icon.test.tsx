import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Icon } from './Icon';

describe('Icon', () => {
  it('renders with source', () => {
    render(<Icon source="test-icon.png" size={24} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'test-icon.png');
    expect(img).toHaveStyle({ width: '24px', height: '24px' });
  });

  it('renders with default source when source is not provided', () => {
    render(<Icon size={32} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'sample.png');
    expect(img).toHaveStyle({ width: '32px', height: '32px' });
  });

  it('applies className', () => {
    render(<Icon source="test.png" size={16} className="custom-class" />);
    const img = screen.getByRole('img');
    expect(img).toHaveClass('custom-class');
  });

  it('applies custom style', () => {
    render(<Icon source="test.png" size={20} style={{ opacity: 0.5 }} />);
    const img = screen.getByRole('img');
    expect(img).toHaveStyle({ width: '20px', height: '20px', opacity: '0.5' });
  });
});

