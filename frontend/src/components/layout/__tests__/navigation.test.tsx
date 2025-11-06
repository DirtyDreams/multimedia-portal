import { render, screen } from '@testing-library/react';
import { Navigation } from '../navigation';

// Mock usePathname
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/blog'),
}));

const { usePathname } = require('next/navigation');

describe('Navigation', () => {
  beforeEach(() => {
    usePathname.mockReturnValue('/blog');
  });

  it('should render all navigation items in desktop mode', () => {
    render(<Navigation />);

    expect(screen.getByRole('link', { name: /blog/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /articles/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /wiki/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /gallery/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /stories/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /authors/i })).toBeInTheDocument();
  });

  it('should render all navigation items in mobile mode', () => {
    render(<Navigation mobile={true} />);

    expect(screen.getByRole('link', { name: /blog/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /articles/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /wiki/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /gallery/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /stories/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /authors/i })).toBeInTheDocument();
  });

  it('should highlight active link based on current pathname', () => {
    usePathname.mockReturnValue('/blog');
    render(<Navigation />);

    const blogLink = screen.getByRole('link', { name: /blog/i });
    const articlesLink = screen.getByRole('link', { name: /articles/i });

    // Active link should have specific classes (bg-zinc-100 for light mode)
    expect(blogLink).toHaveClass('bg-zinc-100');
    expect(articlesLink).not.toHaveClass('bg-zinc-100');
  });

  it('should have correct href attributes for all links', () => {
    render(<Navigation />);

    expect(screen.getByRole('link', { name: /blog/i })).toHaveAttribute('href', '/blog');
    expect(screen.getByRole('link', { name: /articles/i })).toHaveAttribute('href', '/articles');
    expect(screen.getByRole('link', { name: /wiki/i })).toHaveAttribute('href', '/wiki');
    expect(screen.getByRole('link', { name: /gallery/i })).toHaveAttribute('href', '/gallery');
    expect(screen.getByRole('link', { name: /stories/i })).toHaveAttribute('href', '/stories');
    expect(screen.getByRole('link', { name: /authors/i })).toHaveAttribute('href', '/authors');
  });

  it('should apply mobile layout classes when mobile prop is true', () => {
    const { container } = render(<Navigation mobile={true} />);

    // Mobile nav should have flex-col class
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('flex-col');
  });

  it('should apply desktop layout classes when mobile prop is false', () => {
    const { container } = render(<Navigation mobile={false} />);

    // Desktop nav should have flex items-center class
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('flex');
    expect(nav).toHaveClass('items-center');
  });

  it('should update active state when pathname changes', () => {
    const { rerender } = render(<Navigation />);

    // Initially /blog is active
    usePathname.mockReturnValue('/blog');
    rerender(<Navigation />);
    expect(screen.getByRole('link', { name: /blog/i })).toHaveClass('bg-zinc-100');

    // Change to /articles
    usePathname.mockReturnValue('/articles');
    rerender(<Navigation />);
    expect(screen.getByRole('link', { name: /articles/i })).toHaveClass('bg-zinc-100');
    expect(screen.getByRole('link', { name: /blog/i })).not.toHaveClass('bg-zinc-100');
  });
});
