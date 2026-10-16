import React from 'react';
import { AlertTriangle, AlertCircle, ShieldCheck, HelpCircle } from 'lucide-react';

/**
 * Accessible Badge / Risk Indicator component.
 * Ensures non-color status cues with paired icons and semantic text.
 */
export default function Badge({
  level = 'LOW', // 'HIGH' | 'MEDIUM' | 'LOW' | 'UNABLE_TO_ASSESS' | 'UNKNOWN'
  label,
  showIcon = true,
  className = '',
  size = 'md'
}) {
  const normalizedLevel = String(level).toUpperCase();

  const getDetails = () => {
    switch (normalizedLevel) {
      case 'HIGH':
        return {
          icon: AlertCircle,
          defaultLabel: 'HIGH RISK',
          colorClass: 'HIGH',
          ariaText: 'High risk scam indicators detected'
        };
      case 'MEDIUM':
        return {
          icon: AlertTriangle,
          defaultLabel: 'MEDIUM RISK',
          colorClass: 'MEDIUM',
          ariaText: 'Suspicious elements detected; exercise high caution'
        };
      case 'LOW':
        return {
          icon: ShieldCheck,
          defaultLabel: 'LOW RISK',
          colorClass: 'LOW',
          ariaText: 'No common scam indicators detected (normal caution still advised)'
        };
      case 'UNABLE_TO_ASSESS':
      case 'UNKNOWN':
      default:
        return {
          icon: HelpCircle,
          defaultLabel: 'UNABLE TO ASSESS',
          colorClass: 'UNKNOWN',
          ariaText: 'Assessment indeterminate or insufficient context'
        };
    }
  };

  const { icon: Icon, defaultLabel, colorClass, ariaText } = getDetails();
  const displayLabel = label || defaultLabel;

  return (
    <span
      className={`risk-meter ${colorClass} ${className}`}
      role="status"
      aria-label={`${displayLabel}: ${ariaText}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: size === 'sm' ? '0.15rem 0.4rem' : '0.25rem 0.6rem',
        fontSize: size === 'sm' ? 'var(--font-size-xs)' : 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-bold)',
        borderRadius: 'var(--radius-sm)'
      }}
    >
      {showIcon && <Icon size={size === 'sm' ? 14 : 16} aria-hidden="true" />}
      <span>{displayLabel}</span>
    </span>
  );
}
