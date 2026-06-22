import { Component } from 'react'
import { Link } from 'react-router-dom'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', background: '#000', color: '#fff',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '0 24px',
        }}>
          <svg width="36" height="36" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ marginBottom: 20 }}>
            <path d="M16 2L9.5 8.5M16 2L11 16L9.5 8.5M16 2L2 6.5L9.5 8.5"
              stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Something went wrong</h1>
          <p style={{ color: '#9CA3AF', marginBottom: 32 }}>AutoPilot hit an unexpected error.</p>
          <a
            href="/"
            style={{
              backgroundColor: '#22D3EE', color: '#04141A',
              padding: '11px 26px', borderRadius: 980,
              fontWeight: 700, fontSize: 15, textDecoration: 'none',
            }}
          >
            Go home
          </a>
        </div>
      )
    }
    return this.props.children
  }
}
