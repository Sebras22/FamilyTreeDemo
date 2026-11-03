import { Component, type ErrorInfo } from 'react'
import { useLocation } from 'react-router-dom'
import ErrorPage from '@/shared/ui/ErrorPage'
import type { ChildrenProps } from '@/interfaces/components/ChildrenProps'
import type { RouteErrorBoundaryProps } from '@/interfaces/components/RouteErrorBoundaryProps'
import type { RouteErrorBoundaryState } from '@/interfaces/state/RouteErrorBoundaryState'

class Boundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erreur d\'affichage :', error, info.componentStack)
  }

  componentDidUpdate(prev: RouteErrorBoundaryProps) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return <ErrorPage status={500} details={import.meta.env.DEV ? this.state.error.message : undefined} hardNavigation />
    }
    return this.props.children
  }
}

export default function RouteErrorBoundary({ children }: ChildrenProps) {
  const { pathname } = useLocation()
  return <Boundary resetKey={pathname}>{children}</Boundary>
}
