import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#F0EEE9',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif',
          padding: '2rem', gap: '1rem',
        }}>
          <svg width="24" height="24" viewBox="0 0 18 18" fill="none">
            <path d="M16 2L9.5 8.5M16 2L11 16L9.5 8.5M16 2L2 6.5L9.5 8.5"
              stroke="#F0EEE9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p style={{ fontSize: 14, color: '#888780' }}>Something went wrong. Please try again.</p>
          <button
            onClick={() => window.location.href = '/'}
            style={{ marginTop: 8, fontSize: 13, padding: '8px 20px', borderRadius: 6,
              backgroundColor: '#F0EEE9', color: '#0A0A0A', border: 'none', cursor: 'pointer' }}
          >
            Go home
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
