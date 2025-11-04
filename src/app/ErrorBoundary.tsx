import { Component, type ReactNode } from 'react'
import { trackEvent } from '../services/uag'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }
  
  static getDerivedStateFromError(): State {
    return { hasError: true }
  }
  
  componentDidCatch(err: unknown) {
    console.error(err)
    try {
      trackEvent('error_boundary', '*', String((err as Error).message || err))
    } catch {}
  }
  
  render() {
    return this.state.hasError ? (
      <div className="p-4 rounded-[var(--r-lg)] bg-white shadow-[var(--shadow-card)] text-[var(--danger)]">
        區塊錯誤，請重試。
      </div>
    ) : (
      this.props.children
    )
  }
}
