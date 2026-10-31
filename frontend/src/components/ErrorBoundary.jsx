import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';

/**
 * Global ErrorBoundary to catch unhandled rendering exceptions.
 * Renders a calm, non-alarming UI allowing the user to reset state or reload.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log minimal non-sensitive diagnostic info in development
    if (import.meta.env.DEV) {
      console.error('Unhandled UI exception in ErrorBoundary:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container" style={{ paddingTop: '3rem', maxWidth: '600px' }}>
          <Card>
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'var(--color-warning-100)',
                  color: 'var(--color-warning-600)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}
              >
                <AlertCircle size={32} aria-hidden="true" />
              </div>

              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-extrabold)', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                Something went wrong in the interface
              </h2>

              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', lineHeight: 'var(--line-height-relaxed)', marginBottom: '1.5rem' }}>
                The safety assistant encountered an unexpected interface error. Any message or inputs you entered locally remain preserved in your browser.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button variant="secondary" onClick={() => { window.location.href = '/'; }}>
                  Return to Home
                </Button>
                <Button variant="secondary" onClick={this.handleReload}>
                  Reload page
                </Button>
                <Button variant="primary" leftIcon={RotateCcw} onClick={this.handleReset}>
                  Try again
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
