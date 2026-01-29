import { render, screen, fireEvent, act } from '@testing-library/react';
import { FeedPostCard } from '../FeedPostCard';
import { STRINGS } from '../../../constants/strings';

describe('FeedPostCard', () => {
  const mockPost = {
    id: '1',
    author: 'Test User',
    authorId: 'user-1',
    title: 'Test Post Title',
    time: new Date().toISOString(),
    content: 'Test content',
    likes: 5,
    comments: 2,
    type: 'resident' as const,
  };

  it('renders post content correctly', () => {
    render(<FeedPostCard post={mockPost} />);
    expect(screen.getByText('Test User')).toBeDefined();
    expect(screen.getByText('Test content')).toBeDefined();
  });

  it('renders agent badge for agent posts', () => {
    const agentPost = { ...mockPost, type: 'agent' as const };
    render(<FeedPostCard post={agentPost} />);
    expect(screen.getByText(STRINGS.FEED.POST.BADGE_AGENT)).toBeDefined();
  });

  it('renders official badge for official posts', () => {
    const officialPost = { ...mockPost, type: 'official' as const };
    render(<FeedPostCard post={officialPost} />);
    expect(screen.getByText(STRINGS.FEED.POST.BADGE_OFFICIAL)).toBeDefined();
  });

  it('calls onLike when like button is clicked', async () => {
    const handleLike = vi.fn();
    render(<FeedPostCard post={mockPost} onLike={handleLike} />);

    const likeBtn = screen.getByText(STRINGS.FEED.POST.LIKE_BTN);

    // Wrap in act to handle internal state updates
    await act(() => {
      fireEvent.click(likeBtn);
    });

    expect(handleLike).toHaveBeenCalledWith('1');
  });

  it('calls onReply when reply button is clicked', () => {
    const handleReply = vi.fn();
    render(<FeedPostCard post={mockPost} onReply={handleReply} />);

    const replyBtn = screen.getByText(STRINGS.FEED.POST.REPLY_BTN);
    fireEvent.click(replyBtn);

    expect(handleReply).toHaveBeenCalledWith('1');
  });

  it('shows liked state correctly', () => {
    render(<FeedPostCard post={mockPost} isLiked={true} />);
    expect(screen.getByText(STRINGS.FEED.POST.LIKED_BTN)).toBeDefined();
  });
});
