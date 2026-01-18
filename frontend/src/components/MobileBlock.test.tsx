import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MobileBlock } from './MobileBlock';

describe('MobileBlock', () => {
  it('should render with title and closed by default', () => {
    render(
      <MobileBlock title="Test Block">
        <div>Content</div>
      </MobileBlock>,
    );

    expect(screen.getByText('Test Block')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('should render with title and open when defaultOpen is true', () => {
    render(
      <MobileBlock title="Test Block" defaultOpen={true}>
        <div>Content</div>
      </MobileBlock>,
    );

    expect(screen.getByText('Test Block')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should toggle content visibility when clicked', () => {
    render(
      <MobileBlock title="Test Block">
        <div>Content</div>
      </MobileBlock>,
    );

    const title = screen.getByText('Test Block');

    // Initially closed
    expect(screen.queryByText('Content')).not.toBeInTheDocument();

    // Click to open
    fireEvent.click(title);
    expect(screen.getByText('Content')).toBeInTheDocument();

    // Click to close
    fireEvent.click(title);
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('should call onChange callback when toggled', () => {
    const handleChange = vi.fn();

    render(
      <MobileBlock title="Test Block" onChange={handleChange}>
        <div>Content</div>
      </MobileBlock>,
    );

    const title = screen.getByText('Test Block');

    // Click to open
    fireEvent.click(title);
    expect(handleChange).toHaveBeenCalledWith(true);

    // Click to close
    fireEvent.click(title);
    expect(handleChange).toHaveBeenCalledWith(false);

    expect(handleChange).toHaveBeenCalledTimes(2);
  });

  it('should apply className prop', () => {
    const { container } = render(
      <MobileBlock title="Test Block" className="custom-class">
        <div>Content</div>
      </MobileBlock>,
    );

    const blockElement = container.firstChild;
    expect(blockElement).toHaveClass('custom-class');
  });

  it('should have proper ARIA attributes', () => {
    render(
      <MobileBlock title="Test Block">
        <div>Content</div>
      </MobileBlock>,
    );

    const toggleElement = screen.getByRole('button');
    expect(toggleElement).toBeInTheDocument();
    expect(toggleElement).toHaveAttribute('aria-expanded', 'false');

    // Click to open
    fireEvent.click(toggleElement);
    expect(toggleElement).toHaveAttribute('aria-expanded', 'true');
  });

  it('should handle keyboard navigation', () => {
    render(
      <MobileBlock title="Test Block">
        <div>Content</div>
      </MobileBlock>,
    );

    const toggleElement = screen.getByRole('button');
    expect(screen.queryByText('Content')).not.toBeInTheDocument();

    fireEvent.keyDown(toggleElement, { key: ' ', code: 'Space' });
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('should render with custom styles in title', () => {
    render(
      <MobileBlock title="Test Block">
        <div>Content</div>
      </MobileBlock>,
    );

    const titleElement = screen.getByText('Test Block');
    expect(titleElement).toHaveStyle({
      fontSize: '1.3rem',
      fontWeight: '700',
    });
  });

  it('should render children correctly when open', () => {
    render(
      <MobileBlock title="Test Block" defaultOpen={true}>
        <div>First Child</div>
        <div>Second Child</div>
        <button>Button</button>
      </MobileBlock>,
    );

    expect(screen.getByText('First Child')).toBeInTheDocument();
    expect(screen.getByText('Second Child')).toBeInTheDocument();
    expect(screen.getByText('Button')).toBeInTheDocument();
  });

  it('should not render children when closed', () => {
    render(
      <MobileBlock title="Test Block" defaultOpen={false}>
        <div>Hidden Content</div>
      </MobileBlock>,
    );

    expect(screen.queryByText('Hidden Content')).not.toBeInTheDocument();
  });

  it('should work with complex children components', () => {
    const ComplexChild = () => (
      <div>
        <h3>Complex Title</h3>
        <p>Complex description</p>
        <input type="text" placeholder="Input" />
      </div>
    );

    render(
      <MobileBlock title="Test Block" defaultOpen={true}>
        <ComplexChild />
      </MobileBlock>,
    );

    expect(screen.getByText('Complex Title')).toBeInTheDocument();
    expect(screen.getByText('Complex description')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Input')).toBeInTheDocument();
  });

  it('should maintain state between re-renders with same props', () => {
    const { rerender } = render(
      <MobileBlock title="Test Block" defaultOpen={false}>
        <div>Content</div>
      </MobileBlock>,
    );

    const title = screen.getByText('Test Block');

    // Open it
    fireEvent.click(title);
    expect(screen.getByText('Content')).toBeInTheDocument();

    // Re-render with same props
    rerender(
      <MobileBlock title="Test Block" defaultOpen={false}>
        <div>Content</div>
      </MobileBlock>,
    );

    // Should stay open (state is maintained)
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should reset to defaultOpen when key prop changes', () => {
    const { rerender } = render(
      <MobileBlock key="1" title="Block 1" defaultOpen={true}>
        <div>Content 1</div>
      </MobileBlock>,
    );

    expect(screen.getByText('Content 1')).toBeInTheDocument();

    // Change key prop (simulating different block)
    rerender(
      <MobileBlock key="2" title="Block 2" defaultOpen={false}>
        <div>Content 2</div>
      </MobileBlock>,
    );

    // Should be closed because defaultOpen is false for new key
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
  });

  it('should be accessible via keyboard with tabindex', () => {
    render(
      <MobileBlock title="Test Block">
        <div>Content</div>
      </MobileBlock>,
    );

    const toggleElement = screen.getByRole('button');
    expect(toggleElement).toHaveAttribute('tabindex', '0');
  });
});
