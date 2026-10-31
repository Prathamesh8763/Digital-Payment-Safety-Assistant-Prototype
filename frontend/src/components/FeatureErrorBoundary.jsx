import React from 'react';
import { AlertTriangle, RotateCcw, ArrowRight } from 'lucide-react';
import Button from './ui/Button';

/**
 * Feature-level Error Boundary to isolate component-level failures
 * (e.g. rendering results, guided questionnaires, history drawers)
 * without crashing the global application or wiping user context.
 */
export default class FeatureErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error(`UI exception in [${this.props.featureName || 'Feature'}]:`, error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div 
          className="feature-error-boundary-box"
          style={{
            background: '#ffffff',
            border: '1.5px solid #fed7aa',
            borderRadius: '16px',
            padding: '2rem 1.5rem',
            margin: '1.5rem auto',
            maxWidth: '680px',
            boxShadow: '0 4px 14px rgba(234, 88, 12, 0.08)',
            textAlign: 'center'
          }}
          role="alert"
          aria-live="assertive"
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: '#ffedd5',
              color: '#ea580c',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}
          >
            <AlertTriangle size={28} aria-hidden="true" />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
            {this.props.title || `Notice: Unable to display ${this.props.featureName || 'this section'}`}
          </h3>

          <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.55, marginBottom: '1.5rem', maxWidth: '520px', marginInline: 'auto' }}>
            {this.props.message || 'An unexpected display issue occurred while rendering these details. Your inputs are safely preserved in this browser session.'}
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="primary" leftIcon={RotateCcw} onClick={this.handleReset}>
              {this.props.resetLabel || 'Try Again'}
            </Button>
            {this.props.onSecondaryAction && (
              <Button variant="secondary" rightIcon={ArrowRight} onClick={this.props.onSecondaryAction}>
                {this.props.secondaryActionLabel || 'Start Over'}
              </Button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
