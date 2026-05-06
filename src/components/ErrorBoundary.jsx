import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ fontSize: '.82rem', color: 'var(--color-txt2)', lineHeight: 1.7, marginBottom: 20 }}>
              {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
            </p>
            <button
              className="btn btn-p"
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
              style={{ padding: '10px 24px' }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
