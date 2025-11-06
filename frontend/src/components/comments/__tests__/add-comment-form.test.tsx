import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddCommentForm } from '../add-comment-form';

// Mock the useAuth hook
jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

const { useAuth } = require('@/hooks/use-auth');

describe('AddCommentForm', () => {
  const mockOnCommentAdded = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    Storage.prototype.getItem = jest.fn(() => 'mock-token');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should show login prompt when user is not authenticated', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    render(
      <AddCommentForm
        contentType="article"
        contentId="1"
        onCommentAdded={mockOnCommentAdded}
      />
    );

    expect(screen.getByText(/please/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login');
  });

  it('should render form when user is authenticated', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com' },
    });

    render(
      <AddCommentForm
        contentType="article"
        contentId="1"
        onCommentAdded={mockOnCommentAdded}
      />
    );

    expect(screen.getByPlaceholderText(/write a comment/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /post comment/i })).toBeInTheDocument();
  });

  it('should display character count', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com' },
    });

    const user = userEvent.setup();

    render(
      <AddCommentForm
        contentType="article"
        contentId="1"
        onCommentAdded={mockOnCommentAdded}
      />
    );

    const textarea = screen.getByPlaceholderText(/write a comment/i);

    await user.type(textarea, 'Hello');

    expect(screen.getByText('5 / 5000')).toBeInTheDocument();
  });

  it('should show warning when approaching character limit', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com' },
    });

    const longText = 'a'.repeat(4600);

    render(
      <AddCommentForm
        contentType="article"
        contentId="1"
        onCommentAdded={mockOnCommentAdded}
      />
    );

    const textarea = screen.getByPlaceholderText(/write a comment/i);
    // Use fireEvent.change for large text to avoid timeout
    fireEvent.change(textarea, { target: { value: longText } });

    // Character count should be yellow (warning color)
    const charCount = screen.getByText(/4600 \/ 5000/);
    expect(charCount).toHaveClass('text-yellow-500');
  });

  it('should disable submit button when content is empty', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com' },
    });

    render(
      <AddCommentForm
        contentType="article"
        contentId="1"
        onCommentAdded={mockOnCommentAdded}
      />
    );

    const submitButton = screen.getByRole('button', { name: /post comment/i });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when content is provided', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com' },
    });

    const user = userEvent.setup();

    render(
      <AddCommentForm
        contentType="article"
        contentId="1"
        onCommentAdded={mockOnCommentAdded}
      />
    );

    const textarea = screen.getByPlaceholderText(/write a comment/i);
    await user.type(textarea, 'This is a test comment');

    const submitButton = screen.getByRole('button', { name: /post comment/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('should submit comment successfully', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com' },
    });

    const mockComment = { id: '1', content: 'Test comment', userId: '1' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockComment,
    });

    const user = userEvent.setup();

    render(
      <AddCommentForm
        contentType="article"
        contentId="1"
        onCommentAdded={mockOnCommentAdded}
      />
    );

    const textarea = screen.getByPlaceholderText(/write a comment/i);
    await user.type(textarea, 'Test comment');

    const submitButton = screen.getByRole('button', { name: /post comment/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnCommentAdded).toHaveBeenCalledWith(mockComment);
    });

    // Form should be reset
    expect(textarea).toHaveValue('');
  });

  it('should show error message on failed submission', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com' },
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Failed to post comment' }),
    });

    const user = userEvent.setup();

    render(
      <AddCommentForm
        contentType="article"
        contentId="1"
        onCommentAdded={mockOnCommentAdded}
      />
    );

    const textarea = screen.getByPlaceholderText(/write a comment/i);
    await user.type(textarea, 'Test comment');

    const submitButton = screen.getByRole('button', { name: /post comment/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to post comment/i)).toBeInTheDocument();
    });
  });

  it('should show "Reply" button text when parentId is provided', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com' },
    });

    render(
      <AddCommentForm
        contentType="article"
        contentId="1"
        parentId="parent-1"
        onCommentAdded={mockOnCommentAdded}
      />
    );

    // Button should say "Reply" instead of "Post Comment"
    expect(screen.getByRole('button', { name: /reply/i })).toBeInTheDocument();
  });

  it('should render cancel button when onCancel is provided', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com' },
    });

    render(
      <AddCommentForm
        contentType="article"
        contentId="1"
        onCommentAdded={mockOnCommentAdded}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com' },
    });

    const user = userEvent.setup();

    render(
      <AddCommentForm
        contentType="article"
        contentId="1"
        onCommentAdded={mockOnCommentAdded}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should use custom placeholder when provided', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com' },
    });

    render(
      <AddCommentForm
        contentType="article"
        contentId="1"
        onCommentAdded={mockOnCommentAdded}
        placeholder="Reply to this comment..."
      />
    );

    expect(screen.getByPlaceholderText('Reply to this comment...')).toBeInTheDocument();
  });

  it('should validate empty comment', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com' },
    });

    render(
      <AddCommentForm
        contentType="article"
        contentId="1"
        onCommentAdded={mockOnCommentAdded}
      />
    );

    const textarea = screen.getByPlaceholderText(/write a comment/i);
    fireEvent.change(textarea, { target: { value: '   ' } }); // Only whitespace

    const submitButton = screen.getByRole('button', { name: /post comment/i });

    // Submit button should be disabled for whitespace-only content
    expect(submitButton).toBeDisabled();
  });
});
