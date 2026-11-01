import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * ClearPay Unified Logo Component
 *
 * Uses the official brand image with the 3D security shield, credit card with gold chip,
 * verified green checkmark, and ClearPay wordmark with blue swoosh.
 *
 * Variations:
 *  - 'horizontal': Shield Emblem + ClearPay Wordmark side-by-side (Desktop nav, headers)
 *  - 'symbol': Standalone Shield Emblem (Mobile drawer, loading screens, 404 page, icons)
 *  - 'full': Full brand logo (Hero, presentations)
 *  - 'favicon': Compact 32x32 icon
 *
 * Themes:
 *  - 'light': Default on white/light backgrounds
 *  - 'dark': Crisp presentation on dark backgrounds (e.g. footer)
 */

export function ClearPaySymbol({ size = 36, className = '', style = {} }) {
  return (
    <img
      src="/logo-symbol.png"
      alt="ClearPay Shield Emblem"
      width={size}
      height={size}
      className={`clearpay-symbol-img ${className}`}
      style={{
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style
      }}
      loading="eager"
    />
  );
}

export default function Logo({
  variant = 'horizontal', // 'horizontal' | 'symbol' | 'full' | 'favicon'
  theme = 'light',        // 'light' | 'dark'
  size = 'md',            // 'sm' | 'md' | 'lg' | 'xl' | number
  showTagline = true,
  taglineText,
  className = '',
  style = {},
  onClick
}) {
  const { t } = useTranslation();

  // Size configurations
  const sizeMap = {
    sm: { height: 28, symbol: 28, fullHeight: 60 },
    md: { height: 38, symbol: 36, fullHeight: 80 },
    lg: { height: 48, symbol: 46, fullHeight: 110 },
    xl: { height: 60, symbol: 56, fullHeight: 140 }
  };

  const currentSize = typeof size === 'number'
    ? { height: size, symbol: size, fullHeight: size * 2 }
    : sizeMap[size] || sizeMap.md;

  const isDark = theme === 'dark';
  const resolvedTagline = taglineText || t('common.brand_tagline', 'Payment Safety Assistant');

  // 1. Symbol Only Logo (Shield + Card + Green Checkmark)
  if (variant === 'symbol' || variant === 'favicon') {
    return (
      <div
        className={`clearpay-logo-symbol ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: onClick ? 'pointer' : 'default',
          ...style
        }}
        onClick={onClick}
        role={onClick ? 'button' : 'img'}
        aria-label="ClearPay Symbol"
        tabIndex={onClick ? 0 : undefined}
      >
        <img
          src="/logo-symbol.png"
          alt="ClearPay Security Shield"
          width={currentSize.symbol}
          height={currentSize.symbol}
          style={{ objectFit: 'contain', display: 'block' }}
          loading="eager"
        />
      </div>
    );
  }

  // 2. Full Brand Logo (Original Stacked Orientation)
  if (variant === 'full') {
    return (
      <div
        className={`clearpay-logo-full ${isDark ? 'theme-dark' : 'theme-light'} ${className}`}
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: onClick ? 'pointer' : 'default',
          ...style
        }}
        onClick={onClick}
        role={onClick ? 'button' : 'img'}
        aria-label="ClearPay – Digital Payment Safety Assistant"
      >
        <div
          style={{
            background: isDark ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
            padding: isDark ? '12px 18px' : 0,
            borderRadius: isDark ? '16px' : 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            src="/logo-full.png"
            alt="ClearPay Logo"
            style={{
              height: `${currentSize.fullHeight}px`,
              width: 'auto',
              objectFit: 'contain',
              display: 'block'
            }}
            loading="eager"
          />
        </div>

        {showTagline && (
          <div
            style={{
              marginTop: '6px',
              padding: '4px 12px',
              background: isDark ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff',
              border: `1px solid ${isDark ? 'rgba(96, 165, 250, 0.3)' : '#bfdbfe'}`,
              borderRadius: '12px',
              fontFamily: "system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif",
              fontWeight: 700,
              fontSize: '10px',
              color: isDark ? '#93c5fd' : '#1e40af',
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}
          >
            {resolvedTagline}
          </div>
        )}
      </div>
    );
  }

  // 3. Primary Horizontal Logo (Emblem + Wordmark Lockup)
  return (
    <div
      className={`clearpay-logo-horizontal ${isDark ? 'theme-dark' : 'theme-light'} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        ...style
      }}
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      aria-label="ClearPay – Payment Safety Assistant"
      tabIndex={onClick ? 0 : undefined}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: isDark ? '#ffffff' : 'transparent',
          padding: isDark ? '4px 8px' : 0,
          borderRadius: isDark ? '8px' : 0,
          boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
        }}
      >
        <img
          src="/logo-horizontal.png"
          alt="ClearPay Logo"
          style={{
            height: `${currentSize.height}px`,
            width: 'auto',
            objectFit: 'contain',
            display: 'block'
          }}
          loading="eager"
        />
      </div>

      {showTagline && !isDark && (
        <span
          style={{
            fontFamily: "system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif",
            fontWeight: 700,
            fontSize: '9px',
            color: '#64748b',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            borderLeft: '1px solid #cbd5e1',
            paddingLeft: '10px',
            lineHeight: 1.2
          }}
        >
          {resolvedTagline}
        </span>
      )}
    </div>
  );
}
