import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Counter } from './Counter';

describe('Counter', () => {
  it('increments and decrements', async () => {
    render(<Counter />);
    const inc = screen.getByLabelText('increment');
    const dec = screen.getByLabelText('decrement');
    const value = screen.getByTestId('count');

    await userEvent.click(inc);
    expect(value).toHaveTextContent('1');

    await userEvent.click(dec);
    expect(value).toHaveTextContent('0');
  });
});
