import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Accessible LoadingSpinner
 * Announces loading state to screen readers via aria-live="polite".
 */
export default function LoadingSpinner({
  size = 20,
  label = 'Loading...',
  inline = false,
  className = ''
}) {
  const content = (
    <div
      role="status"
      aria-live="polite"
      className={`loading-spinner-container ${inline ? 'inline' : ''} ${className}`}
      style={{
        display: inline ? 'inline-flex' : 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem'
      }}
    >
      <Loader2
        size={size}
        className="spin-animation"
        style={{
          animation: 'spin 1s linear infinite'
        }}
        aria-hidden="true"
      />
      <span className={inline ? '' : 'sr-only'}>{label}</span>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  return content;
}
