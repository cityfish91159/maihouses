import { Component, type ReactNode } from 'react'
import { trackEvent } from '../services/uag'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false }
  
  static getDerivedStateFromError(): State {
    return { hasError: true }
  }
  
  override componentDidCatch(err: unknown) {
    console.error(err)
    try {
      trackEvent('error_boundary', '*', String((err as Error).message || err))
    } catch {}
  }
  
  override render() {
    return this.state.hasError ? (
      <div className="rounded-[var(--r-lg)] bg-white p-4 text-[var(--danger)] shadow-[var(--shadow-card)]">
        區塊錯誤，請重試。
      </div>
    ) : (
      this.props.children
    )
  }
}
