import { Component, ReactNode } from "react";
import { trackEvent } from "../services/analytics";
import { logger } from "../lib/logger";

interface Props {
  children: ReactNode;
}
type State = { hasError: boolean };

export default class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(err: unknown) {
    logger.error("[ErrorBoundary] Uncaught error", { error: err });
    try {
      // [NASA TypeScript Safety] 使用 instanceof 類型守衛取代 as Error
      const message = err instanceof Error ? err.message : String(err);
      trackEvent("error_boundary", "*", message);
    } catch {}
  }

  override render() {
    return this.state.hasError ? (
      <div className="rounded-2xl bg-white p-4 text-red-600 shadow-md">
        區塊錯誤，請重試。
      </div>
    ) : (
      this.props.children
    );
  }
}
