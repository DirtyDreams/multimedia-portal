import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CommentSection } from '../comment-section';

// Mock child components
jest.mock('../comment-list', () => ({
  CommentList: ({ contentType, contentId }: { contentType: string; contentId: string }) => (
    <div data-testid="comment-list">
      CommentList for {contentType}/{contentId}
    </div>
  ),
}));

jest.mock('../add-comment-form', () => ({
  AddCommentForm: ({
    contentType,
    contentId,
  }: {
    contentType: string;
    contentId: string;
  }) => (
    <div data-testid="add-comment-form">
      AddCommentForm for {contentType}/{contentId}
    </div>
  ),
}));

describe('CommentSection', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const renderWithQueryClient = (ui: React.ReactElement) => {
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
  };

  it('should render with default title "Comments"', () => {
    renderWithQueryClient(<CommentSection contentType="article" contentId="1" />);

    expect(screen.getByText('Comments')).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    renderWithQueryClient(
      <CommentSection contentType="article" contentId="1" title="Discussion" />
    );

    expect(screen.getByText('Discussion')).toBeInTheDocument();
  });

  it('should render MessageSquare icon', () => {
    const { container } = renderWithQueryClient(
      <CommentSection contentType="article" contentId="1" />
    );

    // Check for the icon by its class or SVG element
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should render AddCommentForm with correct props', () => {
    renderWithQueryClient(<CommentSection contentType="blog_post" contentId="123" />);

    const form = screen.getByTestId('add-comment-form');
    expect(form).toBeInTheDocument();
    expect(form).toHaveTextContent('AddCommentForm for blog_post/123');
  });

  it('should render CommentList with correct props', () => {
    renderWithQueryClient(<CommentSection contentType="wiki_page" contentId="456" />);

    const list = screen.getByTestId('comment-list');
    expect(list).toBeInTheDocument();
    expect(list).toHaveTextContent('CommentList for wiki_page/456');
  });

  it('should have proper structure with border and spacing', () => {
    const { container } = renderWithQueryClient(
      <CommentSection contentType="article" contentId="1" />
    );

    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('mt-12', 'border-t', 'border-border', 'pt-8');
  });

  it('should render both form and list sections', () => {
    renderWithQueryClient(<CommentSection contentType="story" contentId="789" />);

    expect(screen.getByTestId('add-comment-form')).toBeInTheDocument();
    expect(screen.getByTestId('comment-list')).toBeInTheDocument();
  });
});
