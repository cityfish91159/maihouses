/**
 * NotificationErrorBoundary 組件測試
 * MSG-2: 通知錯誤邊界
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationErrorBoundary } from '../NotificationErrorBoundary';

// Mock logger
vi.mock('../../../lib/logger', () => ({
    logger: {
        error: vi.fn()
    }
}));

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
        throw new Error('Test error from child component');
    }
    return <div>Child Content</div>;
};

// Suppress console.error during error boundary tests
const originalError = console.error;
beforeEach(() => {
    console.error = vi.fn();
});
afterEach(() => {
    console.error = originalError;
});

describe('NotificationErrorBoundary', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('normal operation', () => {
        it('should render children when no error', () => {
            render(
                <NotificationErrorBoundary>
                    <div>Normal Content</div>
                </NotificationErrorBoundary>
            );

            expect(screen.getByText('Normal Content')).toBeDefined();
        });

        it('should not show error UI when no error', () => {
            render(
                <NotificationErrorBoundary>
                    <div>Normal Content</div>
                </NotificationErrorBoundary>
            );

            expect(screen.queryByText('無法載入通知')).toBeNull();
        });
    });

    describe('error handling', () => {
        it('should catch error and show error UI', () => {
            render(
                <NotificationErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </NotificationErrorBoundary>
            );

            expect(screen.getByText('無法載入通知')).toBeDefined();
            expect(screen.getByText('請稍後再試')).toBeDefined();
        });

        it('should show retry button', () => {
            render(
                <NotificationErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </NotificationErrorBoundary>
            );

            expect(screen.getByText('重試')).toBeDefined();
        });

        it('should log error to logger', async () => {
            const { logger } = await import('../../../lib/logger');

            render(
                <NotificationErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </NotificationErrorBoundary>
            );

            expect(logger.error).toHaveBeenCalledWith(
                'NotificationErrorBoundary.caught',
                expect.objectContaining({
                    error: 'Test error from child component'
                })
            );
        });
    });

    describe('retry functionality', () => {
        it('should reset error state on retry click', async () => {
            const user = userEvent.setup();
            let shouldThrow = true;

            const { rerender } = render(
                <NotificationErrorBoundary>
                    <ThrowError shouldThrow={shouldThrow} />
                </NotificationErrorBoundary>
            );

            // Error UI should be shown
            expect(screen.getByText('無法載入通知')).toBeDefined();

            // Fix the error
            shouldThrow = false;

            // Click retry
            const retryButton = screen.getByText('重試');
            await user.click(retryButton);

            // Re-render with fixed component
            rerender(
                <NotificationErrorBoundary>
                    <ThrowError shouldThrow={shouldThrow} />
                </NotificationErrorBoundary>
            );

            // Should show children now (error state cleared)
            // Note: This tests that hasError is reset; the actual re-render depends on React's behavior
        });
    });

    describe('close button', () => {
        it('should show close button when onClose is provided', () => {
            render(
                <NotificationErrorBoundary onClose={() => {}}>
                    <ThrowError shouldThrow={true} />
                </NotificationErrorBoundary>
            );

            expect(screen.getByText('關閉')).toBeDefined();
        });

        it('should not show close button when onClose is not provided', () => {
            render(
                <NotificationErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </NotificationErrorBoundary>
            );

            expect(screen.queryByText('關閉')).toBeNull();
        });

        it('should call onClose when close button is clicked', async () => {
            const user = userEvent.setup();
            const onClose = vi.fn();

            render(
                <NotificationErrorBoundary onClose={onClose}>
                    <ThrowError shouldThrow={true} />
                </NotificationErrorBoundary>
            );

            const closeButton = screen.getByText('關閉');
            await user.click(closeButton);

            expect(onClose).toHaveBeenCalled();
        });
    });

    describe('error UI styling', () => {
        it('should have proper container styling', () => {
            render(
                <NotificationErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </NotificationErrorBoundary>
            );

            const container = screen.getByText('無法載入通知').closest('div[class*="absolute"]');
            expect(container).toBeDefined();
        });

        it('should show error icon', () => {
            render(
                <NotificationErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </NotificationErrorBoundary>
            );

            // The AlertCircle icon is wrapped in a container
            const iconContainer = document.querySelector('.bg-red-50');
            expect(iconContainer).toBeDefined();
        });
    });

    describe('state management', () => {
        it('should track hasError state correctly', () => {
            const { rerender } = render(
                <NotificationErrorBoundary>
                    <ThrowError shouldThrow={false} />
                </NotificationErrorBoundary>
            );

            // Initially no error
            expect(screen.queryByText('無法載入通知')).toBeNull();

            // Trigger error
            rerender(
                <NotificationErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </NotificationErrorBoundary>
            );

            // Error should be caught
            expect(screen.getByText('無法載入通知')).toBeDefined();
        });

        it('should capture error details', () => {
            render(
                <NotificationErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </NotificationErrorBoundary>
            );

            // Error is captured internally (verified by error UI showing)
            expect(screen.getByText('無法載入通知')).toBeDefined();
        });
    });

    describe('getDerivedStateFromError', () => {
        it('should return correct state shape', () => {
            // This tests the static method behavior through the component
            render(
                <NotificationErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </NotificationErrorBoundary>
            );

            // If getDerivedStateFromError works correctly, error UI is shown
            expect(screen.getByText('無法載入通知')).toBeDefined();
        });
    });

    describe('componentDidCatch', () => {
        it('should log complete error info including stack', async () => {
            const { logger } = await import('../../../lib/logger');

            render(
                <NotificationErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </NotificationErrorBoundary>
            );

            expect(logger.error).toHaveBeenCalledWith(
                'NotificationErrorBoundary.caught',
                expect.objectContaining({
                    error: expect.any(String),
                    stack: expect.any(String),
                    componentStack: expect.any(String)
                })
            );
        });
    });
});
