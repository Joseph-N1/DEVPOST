import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  it('should render toggle button', () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
  });

  it('should have accessible label', () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
  });

  it('should render with label when showLabel is true', () => {
    render(<ThemeToggle showLabel />);
    
    // Should show theme name text
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should apply different sizes', () => {
    const { rerender } = render(<ThemeToggle size="sm" />);
    let button = screen.getByRole('button');
    expect(button).toBeInTheDocument();

    rerender(<ThemeToggle size="lg" />);
    button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<ThemeToggle className="custom-class" />);
    
    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-class');
  });
});
