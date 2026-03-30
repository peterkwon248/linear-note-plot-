'use client'

import React from 'react'
import { Warning } from "@phosphor-icons/react/dist/ssr/Warning"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[200px] w-full flex-col items-center justify-center gap-4 rounded-lg border border-border bg-background p-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <Warning className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-note font-medium text-foreground">Something went wrong</p>
            <p className="text-2xs text-muted-foreground">
              An unexpected error occurred while rendering this content.
            </p>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="max-w-full overflow-auto rounded border border-border bg-muted px-3 py-2 text-left text-2xs text-muted-foreground">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            className="rounded-md border border-border bg-secondary px-3 py-1.5 text-2xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
