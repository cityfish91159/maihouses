/**
 * NotificationDropdown 組件測試
 * MSG-2: 鈴鐺通知下拉選單
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NotificationDropdown } from '../NotificationDropdown';
import type { ConversationListItem } from '../../../types/messaging.types';

// Test data fixtures
const createMockNotification = (overrides: Partial<ConversationListItem> = {}): ConversationListItem => ({
    id: 'conv-123',
    status: 'active',
    unread_count: 3,
    last_message: {
        content: 'Hello, I am interested in the property',
        created_at: new Date().toISOString(),
        sender_type: 'consumer'
    },
    counterpart: {
        name: 'John Doe'
    },
    property: {
        id: 'prop-001',
        title: 'Luxury Apartment in Xinyi District'
    },
    ...overrides
});

describe('NotificationDropdown', () => {
    const defaultProps = {
        notifications: [] as ConversationListItem[],
        isLoading: false,
        onClose: vi.fn(),
        onNotificationClick: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('loading state', () => {
        it('should show loading skeleton when isLoading is true', () => {
            render(<NotificationDropdown {...defaultProps} isLoading={true} />);

            const skeletons = document.querySelectorAll('.animate-pulse');
            expect(skeletons.length).toBeGreaterThan(0);
        });

        it('should not show empty state while loading', () => {
            render(<NotificationDropdown {...defaultProps} isLoading={true} />);

            expect(screen.queryByText('沒有新訊息')).toBeNull();
        });
    });

    describe('empty state', () => {
        it('should show empty state when no notifications', () => {
            render(<NotificationDropdown {...defaultProps} notifications={[]} />);

            expect(screen.getByText('沒有新訊息')).toBeDefined();
            expect(screen.getByText('您目前沒有未讀的私訊')).toBeDefined();
        });

        it('should not show "查看所有訊息" link when empty', () => {
            render(<NotificationDropdown {...defaultProps} notifications={[]} />);

            expect(screen.queryByText('查看所有訊息')).toBeNull();
        });
    });

    describe('notification list', () => {
        it('should render notification items', () => {
            const notifications = [
                createMockNotification({ id: 'conv-1', counterpart: { name: 'Alice' } }),
                createMockNotification({ id: 'conv-2', counterpart: { name: 'Bob' } })
            ];

            render(<NotificationDropdown {...defaultProps} notifications={notifications} />);

            expect(screen.getByText('Alice')).toBeDefined();
            expect(screen.getByText('Bob')).toBeDefined();
        });

        it('should show counterpart initial as avatar', () => {
            const notifications = [createMockNotification({ counterpart: { name: 'Zhang San' } })];

            render(<NotificationDropdown {...defaultProps} notifications={notifications} />);

            expect(screen.getByText('Z')).toBeDefined();
        });

        it('should show message preview truncated', () => {
            const longMessage = 'This is a very long message that should be truncated because it exceeds the maximum length allowed';
            const notifications = [createMockNotification({
                last_message: { content: longMessage, created_at: new Date().toISOString(), sender_type: 'consumer' }
            })];

            render(<NotificationDropdown {...defaultProps} notifications={notifications} />);

            const previewElement = screen.getByText(/This is a very long message/);
            expect(previewElement.textContent).toContain('...');
        });

        it('should show property title', () => {
            const notifications = [createMockNotification({
                property: { id: 'p1', title: 'Beautiful Villa' }
            })];

            render(<NotificationDropdown {...defaultProps} notifications={notifications} />);

            expect(screen.getByText(/Beautiful Villa/)).toBeDefined();
        });

        it('should show unread badge with count', () => {
            const notifications = [createMockNotification({ unread_count: 5 })];

            render(<NotificationDropdown {...defaultProps} notifications={notifications} />);

            expect(screen.getByText('5')).toBeDefined();
        });

        it('should show 99+ for large unread counts', () => {
            const notifications = [createMockNotification({ unread_count: 150 })];

            render(<NotificationDropdown {...defaultProps} notifications={notifications} />);

            expect(screen.getByText('99+')).toBeDefined();
        });

        it('should not show unread badge when count is 0', () => {
            const notifications = [createMockNotification({ unread_count: 0 })];

            render(<NotificationDropdown {...defaultProps} notifications={notifications} />);

            // Check that no badge elements exist with number content
            const badges = document.querySelectorAll('.rounded-full.bg-red-600');
            expect(badges.length).toBe(0);
        });
    });

    describe('relative time formatting', () => {
        it('should show "剛剛" for recent messages', () => {
            const now = new Date();
            const notifications = [createMockNotification({
                last_message: { content: 'Hi', created_at: now.toISOString(), sender_type: 'consumer' }
            })];

            render(<NotificationDropdown {...defaultProps} notifications={notifications} />);

            expect(screen.getByText('剛剛')).toBeDefined();
        });

        it('should show minutes ago', () => {
            const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
            const notifications = [createMockNotification({
                last_message: { content: 'Hi', created_at: tenMinsAgo.toISOString(), sender_type: 'consumer' }
            })];

            render(<NotificationDropdown {...defaultProps} notifications={notifications} />);

            expect(screen.getByText('10 分鐘前')).toBeDefined();
        });

        it('should show hours ago', () => {
            const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
            const notifications = [createMockNotification({
                last_message: { content: 'Hi', created_at: threeHoursAgo.toISOString(), sender_type: 'consumer' }
            })];

            render(<NotificationDropdown {...defaultProps} notifications={notifications} />);

            expect(screen.getByText('3 小時前')).toBeDefined();
        });

        it('should show days ago', () => {
            const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
            const notifications = [createMockNotification({
                last_message: { content: 'Hi', created_at: twoDaysAgo.toISOString(), sender_type: 'consumer' }
            })];

            render(<NotificationDropdown {...defaultProps} notifications={notifications} />);

            expect(screen.getByText('2 天前')).toBeDefined();
        });

        it('should show "尚無訊息" when no last message', () => {
            const notifications = [createMockNotification({ last_message: undefined })];

            render(<NotificationDropdown {...defaultProps} notifications={notifications} />);

            expect(screen.getByText('尚無訊息')).toBeDefined();
        });
    });

    describe('interactions', () => {
        it('should call onNotificationClick when notification is clicked', async () => {
            const user = userEvent.setup();
            const onNotificationClick = vi.fn();
            const notifications = [createMockNotification({ id: 'conv-abc' })];

            render(<NotificationDropdown {...defaultProps} notifications={notifications} onNotificationClick={onNotificationClick} />);

            const notificationButton = screen.getByRole('menuitem');
            await user.click(notificationButton);

            expect(onNotificationClick).toHaveBeenCalledWith('conv-abc');
        });

        it('should call onClose when close button is clicked', async () => {
            const user = userEvent.setup();
            const onClose = vi.fn();

            render(<NotificationDropdown {...defaultProps} onClose={onClose} />);

            const closeButton = screen.getByLabelText('關閉');
            await user.click(closeButton);

            expect(onClose).toHaveBeenCalled();
        });

        it('should call onClose when Escape is pressed', () => {
            const onClose = vi.fn();

            render(<NotificationDropdown {...defaultProps} onClose={onClose} />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(onClose).toHaveBeenCalled();
        });

        it('should stop event propagation on click', () => {
            const notifications = [createMockNotification()];
            const outerClickHandler = vi.fn();

            render(
                <div
                    onClick={outerClickHandler}
                    onKeyDown={(e) => e.key === 'Enter' && outerClickHandler()}
                    role="button"
                    tabIndex={0}
                >
                    <NotificationDropdown {...defaultProps} notifications={notifications} />
                </div>
            );

            const dropdown = screen.getByRole('dialog');
            fireEvent.click(dropdown);

            expect(outerClickHandler).not.toHaveBeenCalled();
        });
    });

    describe('accessibility', () => {
        it('should have correct ARIA attributes', () => {
            const notifications = [createMockNotification()];

            render(<NotificationDropdown {...defaultProps} notifications={notifications} />);

            const dialog = screen.getByRole('dialog');
            expect(dialog.getAttribute('aria-modal')).toBe('true');
            expect(dialog.getAttribute('aria-label')).toBe('通知列表');
        });

        it('should focus close button on mount', async () => {
            render(<NotificationDropdown {...defaultProps} />);

            await waitFor(() => {
                const closeButton = screen.getByLabelText('關閉');
                expect(document.activeElement).toBe(closeButton);
            });
        });

        it('should have menuitem role for notification buttons', () => {
            const notifications = [createMockNotification()];

            render(<NotificationDropdown {...defaultProps} notifications={notifications} />);

            const menuItems = screen.getAllByRole('menuitem');
            expect(menuItems.length).toBe(1);
        });
    });

    describe('max display limit', () => {
        it('should limit displayed notifications to 20', () => {
            const notifications = Array.from({ length: 25 }, (_, i) =>
                createMockNotification({ id: `conv-${i}`, counterpart: { name: `User ${i}` } })
            );

            render(<NotificationDropdown {...defaultProps} notifications={notifications} />);

            const menuItems = screen.getAllByRole('menuitem');
            expect(menuItems.length).toBe(20);
        });

        it('should show remaining count message when exceeded', () => {
            const notifications = Array.from({ length: 25 }, (_, i) =>
                createMockNotification({ id: `conv-${i}` })
            );

            render(<NotificationDropdown {...defaultProps} notifications={notifications} />);

            expect(screen.getByText('還有 5 則未讀訊息')).toBeDefined();
        });
    });

    describe('footer', () => {
        it('should show footer with link when has notifications', () => {
            const notifications = [createMockNotification()];

            render(<NotificationDropdown {...defaultProps} notifications={notifications} />);

            const link = screen.getByText('查看所有訊息');
            expect(link.getAttribute('href')).toBe('/maihouses/chat');
        });
    });
});
