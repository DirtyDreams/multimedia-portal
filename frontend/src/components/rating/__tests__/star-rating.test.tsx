import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StarRating } from '../star-rating';

describe('StarRating', () => {
  it('should render 5 star buttons', () => {
    render(<StarRating value={0} />);

    const starButtons = screen.getAllByRole('button');
    expect(starButtons).toHaveLength(5);
  });

  it('should display filled stars based on value prop', () => {
    render(<StarRating value={3} readonly />);

    const stars = screen.getAllByRole('button');
    // Check first 3 stars are filled (have fill-yellow-500)
    expect(stars[0].querySelector('svg')).toHaveClass('fill-yellow-500');
    expect(stars[1].querySelector('svg')).toHaveClass('fill-yellow-500');
    expect(stars[2].querySelector('svg')).toHaveClass('fill-yellow-500');
  });

  it('should call onChange when star is clicked', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(<StarRating value={0} onChange={handleChange} />);

    const stars = screen.getAllByRole('button');
    await user.click(stars[2]); // Click 3rd star (rating 3)

    expect(handleChange).toHaveBeenCalledWith(3);
  });

  it('should not call onChange when readonly is true', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(<StarRating value={0} onChange={handleChange} readonly />);

    const stars = screen.getAllByRole('button');
    await user.click(stars[2]);

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('should not call onChange when disabled is true', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(<StarRating value={0} onChange={handleChange} disabled />);

    const stars = screen.getAllByRole('button');
    await user.click(stars[2]);

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('should show hovered rating on mouse enter', async () => {
    render(<StarRating value={2} onChange={jest.fn()} />);

    const stars = screen.getAllByRole('button');

    // Hover over 4th star
    fireEvent.mouseEnter(stars[3]);

    // First 4 stars should be highlighted
    expect(stars[3].querySelector('svg')).toHaveClass('text-yellow-400');
  });

  it('should reset to value on mouse leave', async () => {
    render(<StarRating value={2} onChange={jest.fn()} />);

    const stars = screen.getAllByRole('button');

    // Hover over 4th star
    fireEvent.mouseEnter(stars[3]);
    fireEvent.mouseLeave(stars[3]);

    // Should revert to original value (2 stars)
    expect(stars[0].querySelector('svg')).toHaveClass('fill-yellow-500');
    expect(stars[1].querySelector('svg')).toHaveClass('fill-yellow-500');
  });

  it('should render different sizes based on size prop', () => {
    const { rerender, container } = render(<StarRating value={3} size="sm" readonly />);

    let stars = container.querySelectorAll('svg');
    expect(stars[0]).toHaveClass('h-4', 'w-4');

    rerender(<StarRating value={3} size="md" readonly />);
    stars = container.querySelectorAll('svg');
    expect(stars[0]).toHaveClass('h-6', 'w-6');

    rerender(<StarRating value={3} size="lg" readonly />);
    stars = container.querySelectorAll('svg');
    expect(stars[0]).toHaveClass('h-8', 'w-8');
  });

  it('should show value text when showValue is true', () => {
    render(<StarRating value={3.5} showValue />);

    expect(screen.getByText('3.5')).toBeInTheDocument();
  });

  it('should show "No rating" when value is 0 and showValue is true', () => {
    render(<StarRating value={0} showValue />);

    expect(screen.getByText('No rating')).toBeInTheDocument();
  });

  it('should have proper accessibility labels', () => {
    render(<StarRating value={0} />);

    expect(screen.getByLabelText('Rate 1 star')).toBeInTheDocument();
    expect(screen.getByLabelText('Rate 2 stars')).toBeInTheDocument();
    expect(screen.getByLabelText('Rate 3 stars')).toBeInTheDocument();
    expect(screen.getByLabelText('Rate 4 stars')).toBeInTheDocument();
    expect(screen.getByLabelText('Rate 5 stars')).toBeInTheDocument();
  });

  it('should have cursor-pointer when interactive', () => {
    render(<StarRating value={0} onChange={jest.fn()} />);

    const stars = screen.getAllByRole('button');
    expect(stars[0]).toHaveClass('cursor-pointer');
  });

  it('should have cursor-default when readonly', () => {
    render(<StarRating value={3} readonly />);

    const stars = screen.getAllByRole('button');
    expect(stars[0]).toHaveClass('cursor-default');
  });

  it('should apply opacity when disabled', () => {
    const { container } = render(<StarRating value={3} disabled />);

    const stars = container.querySelectorAll('svg');
    expect(stars[0]).toHaveClass('opacity-50');
  });
});
