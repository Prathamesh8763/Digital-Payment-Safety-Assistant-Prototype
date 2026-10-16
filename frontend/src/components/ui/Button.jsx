import React from 'react';
import LoadingSpinner from './LoadingSpinner';

/**
 * Accessible Button component adhering to WCAG 2.2 AA touch target standards (>= 44px).
 * Supports variants: primary, secondary, destructive/danger, ghost.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  loadingText,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  onClick,
  className = '',
  ariaLabel,
  style = {},
  ...rest
}) {
  const getVariantClass = () => {
    switch (variant) {
      case 'secondary':
        return 'btn-secondary';
      case 'destructive':
      case 'danger':
        return 'btn-danger';
      case 'ghost':
        return 'btn-ghost';
      case 'primary':
      default:
        return 'btn-primary';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: '0.35rem 0.75rem',
          fontSize: 'var(--font-size-xs)',
          minHeight: '36px'
        };
      case 'lg':
        return {
          padding: '0.85rem 1.75rem',
          fontSize: 'var(--font-size-base)',
          minHeight: '52px'
        };
      case 'md':
      default:
        return {
          minHeight: 'var(--min-touch-target)'
        };
    }
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={`btn ${getVariantClass()} ${className}`}
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      aria-busy={loading ? 'true' : undefined}
      aria-label={ariaLabel}
      style={{ ...getSizeStyles(), ...style }}
      {...rest}
    >
      {loading ? (
        <>
          <LoadingSpinner size={16} inline={true} label={loadingText || 'Processing...'} />
          {loadingText ? <span>{loadingText}</span> : children}
        </>
      ) : (
        <>
          {LeftIcon && <LeftIcon size={size === 'sm' ? 14 : 18} aria-hidden="true" />}
          {children}
          {RightIcon && <RightIcon size={size === 'sm' ? 14 : 18} aria-hidden="true" />}
        </>
      )}
    </button>
  );
}
