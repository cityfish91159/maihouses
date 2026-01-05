import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../../lib/logger';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export class FeedErrorBoundary extends Component<Props, State> {
    public override state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        logger.error('[FeedErrorBoundary] Uncaught error', { error, errorInfo });
    }

    public override render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 text-center">
                    <h2 className="text-xl font-bold text-red-600">Something went wrong</h2>
                    <button
                        className="mt-4 rounded bg-brand-600 px-4 py-2 text-white"
                        onClick={() => this.setState({ hasError: false })}
                    >
                        Try again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
