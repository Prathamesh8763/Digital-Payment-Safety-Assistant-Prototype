import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

/**
 * Accessible Alert Banner component.
 * Adheres to Live Region Urgency rules: role="alert" for error/critical, role="status" for info/warning/success.
 */
export default function Alert({
  variant = 'error', // 'error' | 'warning' | 'info' | 'success'
  title,
  children,
  onDismiss,
  className = '',
  action
}) {
  const isCritical = variant === 'error';
  const role = isCritical ? 'alert' : 'status';
  const ariaLive = isCritical ? 'assertive' : 'polite';

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          icon: AlertTriangle,
          bg: 'var(--color-warning-50)',
          border: 'var(--color-warning-200)',
          text: 'var(--color-warning-800)',
          iconColor: 'var(--color-warning-600)'
        };
      case 'success':
        return {
          icon: CheckCircle2,
          bg: 'var(--color-success-50)',
          border: 'var(--color-success-200)',
          text: 'var(--color-success-800)',
          iconColor: 'var(--color-success-600)'
        };
      case 'info':
        return {
          icon: Info,
          bg: 'var(--color-info-50)',
          border: 'var(--color-info-200)',
          text: 'var(--color-info-800)',
          iconColor: 'var(--color-info-600)'
        };
      case 'error':
      default:
        return {
          icon: AlertCircle,
          bg: 'var(--color-danger-50)',
          border: 'var(--color-danger-200)',
          text: 'var(--color-danger-800)',
          iconColor: 'var(--color-danger-600)'
        };
    }
  };

  const { icon: Icon, bg, border, text, iconColor } = getVariantStyles();

  return (
    <div
      role={role}
      aria-live={ariaLive}
      className={`alert-banner ${className}`}
      style={{
        background: bg,
        border: `1px solid ${border}`,
        color: text,
        padding: '0.75rem 1rem',
        borderRadius: 'var(--radius-md)',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        fontSize: 'var(--font-size-sm)',
        lineHeight: 'var(--line-height-normal)'
      }}
    >
      <Icon size={20} style={{ color: iconColor, flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: '0.2rem' }}>{title}</div>}
        <div>{children}</div>
        {action && <div style={{ marginTop: '0.5rem' }}>{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          style={{
            background: 'none',
            border: 'none',
            color: text,
            cursor: 'pointer',
            padding: '2px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.8
          }}
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
