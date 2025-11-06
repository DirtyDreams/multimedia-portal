import { render, screen } from '@testing-library/react';
import { Footer } from '../footer';

describe('Footer', () => {
  it('should render the footer with correct branding', () => {
    render(<Footer />);

    expect(screen.getByText('Multimedia Portal')).toBeInTheDocument();
    expect(screen.getByText(/Your destination for articles/i)).toBeInTheDocument();
  });

  it('should render all content navigation links', () => {
    render(<Footer />);

    expect(screen.getByRole('link', { name: /blog/i })).toHaveAttribute('href', '/blog');
    expect(screen.getByRole('link', { name: /^articles$/i })).toHaveAttribute('href', '/articles');
    expect(screen.getByRole('link', { name: /wiki/i })).toHaveAttribute('href', '/wiki');
    expect(screen.getByRole('link', { name: /gallery/i })).toHaveAttribute('href', '/gallery');
    expect(screen.getByRole('link', { name: /stories/i })).toHaveAttribute('href', '/stories');
  });

  it('should render all company links', () => {
    render(<Footer />);

    expect(screen.getByRole('link', { name: /about us/i })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: /our authors/i })).toHaveAttribute('href', '/authors');
    expect(screen.getByRole('link', { name: /^contact$/i })).toHaveAttribute('href', '/contact');
    expect(screen.getByRole('link', { name: /privacy policy/i })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: /terms of service/i })).toHaveAttribute('href', '/terms');
  });

  it('should render social media links with correct attributes', () => {
    render(<Footer />);

    const githubLink = screen.getByRole('link', { name: /github/i });
    expect(githubLink).toHaveAttribute('href', 'https://github.com');
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');

    const twitterLink = screen.getByRole('link', { name: /twitter/i });
    expect(twitterLink).toHaveAttribute('href', 'https://twitter.com');
    expect(twitterLink).toHaveAttribute('target', '_blank');

    const linkedinLink = screen.getByRole('link', { name: /linkedin/i });
    expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com');
    expect(linkedinLink).toHaveAttribute('target', '_blank');
  });

  it('should render contact email', () => {
    render(<Footer />);

    const emailLink = screen.getByRole('link', { name: /contact@multimediaportal.com/i });
    expect(emailLink).toHaveAttribute('href', 'mailto:contact@multimediaportal.com');
  });

  it('should render copyright notice with current year', () => {
    render(<Footer />);

    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${currentYear} Multimedia Portal`, 'i'))).toBeInTheDocument();
  });

  it('should render newsletter subscription text', () => {
    render(<Footer />);

    expect(screen.getByText(/subscribe to our newsletter/i)).toBeInTheDocument();
  });
});
