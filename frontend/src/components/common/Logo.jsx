import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * ClearPay Unified SVG Logo Component
 *
 * Variations:
 *  - 'horizontal': Shield Symbol + Wordmark "ClearPay." + Subtitle Tagline (Desktop nav, headers)
 *  - 'symbol': Standalone Shield Security Emblem (Mobile nav, icons, loading, 404)
 *  - 'full': Centered prominent shield + Wordmark + Tagline badge (Hero, presentations)
 *  - 'favicon': High-contrast shield icon (Browser tabs, compact indicators)
 *
 * Themes:
 *  - 'light': Dark navy text for white/light backgrounds
 *  - 'dark': White/light text for dark navy/slate footers
 */

export function ClearPaySymbol({ size = 36, className = '', idPrefix = 'cp' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`clearpay-symbol-svg ${className}`}
      role="img"
      aria-label="ClearPay Security Shield"
    >
      <defs>
        <linearGradient id={`${idPrefix}ShieldLeft`} x1="5.5" y1="3.5" x2="20" y2="37" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id={`${idPrefix}ShieldRight`} x1="34.5" y1="3.5" x2="20" y2="37" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="50%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id={`${idPrefix}Check`} x1="12" y1="20" x2="28" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <filter id={`${idPrefix}Glow`} x="8" y="10" width="24" height="20" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#10b981" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Shield Left Facet */}
      <path d="M20 3.5C13 3.5 5.5 6.5 5.5 15C5.5 25.5 13.5 33.5 20 37V3.5Z" fill={`url(#${idPrefix}ShieldLeft)`} />
      {/* Shield Right Facet */}
      <path d="M20 3.5C27 3.5 34.5 6.5 34.5 15C34.5 25.5 26.5 33.5 20 37V3.5Z" fill={`url(#${idPrefix}ShieldRight)`} />
      {/* Inner Highlight Rim */}
      <path
        d="M20 6C14.8 6 8.2 8.5 8.2 15.5C8.2 24.2 14.8 31.2 20 34.2C25.2 31.2 31.8 24.2 31.8 15.5C31.8 8.5 25.2 6 20 6Z"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.22"
        strokeWidth="1.5"
      />
      {/* Subtle Currency Safety Arc */}
      <path
        d="M15 13.5C17.5 12.2 22.5 12.2 25 13.5"
        stroke="#60a5fa"
        strokeOpacity="0.45"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Emerald Green Safety Checkmark */}
      <path
        d="M12.5 20.5L17.5 25.5L27.5 14"
        stroke={`url(#${idPrefix}Check)`}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${idPrefix}Glow)`}
      />
      <circle cx="27.5" cy="14" r="1.5" fill="#34d399" />
    </svg>
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

  // Size mapping
  const sizeMap = {
    sm: { symbol: 28, height: 32, fontSize: 17, subSize: 7.5 },
    md: { symbol: 36, height: 40, fontSize: 20, subSize: 8.5 },
    lg: { symbol: 46, height: 50, fontSize: 24, subSize: 9.5 },
    xl: { symbol: 60, height: 64, fontSize: 30, subSize: 11 }
  };

  const currentSize = typeof size === 'number'
    ? { symbol: size, height: size, fontSize: size * 0.55, subSize: size * 0.22 }
    : sizeMap[size] || sizeMap.md;

  const isDark = theme === 'dark';
  const resolvedTagline = taglineText || t('common.brand_tagline', 'Payment Safety Assistant');

  // 1. Symbol Only Logo
  if (variant === 'symbol' || variant === 'favicon') {
    return (
      <div
        className={`clearpay-logo-symbol ${className}`}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: onClick ? 'pointer' : 'default', ...style }}
        onClick={onClick}
      >
        <ClearPaySymbol size={currentSize.symbol} idPrefix={`cp-sym-${theme}`} />
      </div>
    );
  }

  // 2. Full Brand Logo (Stacked)
  if (variant === 'full') {
    return (
      <div
        className={`clearpay-logo-full ${isDark ? 'theme-dark' : 'theme-light'} ${className}`}
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          cursor: onClick ? 'pointer' : 'default',
          ...style
        }}
        onClick={onClick}
      >
        <ClearPaySymbol size={currentSize.symbol * 1.4} idPrefix={`cp-full-${theme}`} />
        <div style={{ textAlign: 'center', lineHeight: 1.1 }}>
          <div
            style={{
              fontFamily: "system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif",
              fontWeight: 800,
              fontSize: `${currentSize.fontSize * 1.25}px`,
              letterSpacing: '-0.5px'
            }}
          >
            <span style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Clear</span>
            <span style={{ color: isDark ? '#38bdf8' : '#2563eb' }}>Pay</span>
            <span style={{ color: '#10b981' }}>.</span>
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
                fontSize: `${currentSize.subSize}px`,
                color: isDark ? '#93c5fd' : '#1e40af',
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}
            >
              {resolvedTagline}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. Primary Horizontal Logo (Default)
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
      role="img"
      aria-label="ClearPay – Payment Safety Assistant"
    >
      <ClearPaySymbol size={currentSize.symbol} idPrefix={`cp-h-${theme}`} />
      
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1.15 }}>
        <div
          style={{
            fontFamily: "system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif",
            fontWeight: 800,
            fontSize: `${currentSize.fontSize}px`,
            letterSpacing: '-0.4px',
            display: 'flex',
            alignItems: 'baseline'
          }}
        >
          <span style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Clear</span>
          <span style={{ color: isDark ? '#38bdf8' : '#2563eb' }}>Pay</span>
          <span style={{ color: '#10b981' }}>.</span>
        </div>

        {showTagline && (
          <span
            style={{
              fontFamily: "system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif",
              fontWeight: 700,
              fontSize: `${currentSize.subSize}px`,
              color: isDark ? '#94a3b8' : '#64748b',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              marginTop: '1px'
            }}
          >
            {resolvedTagline}
          </span>
        )}
      </div>
    </div>
  );
}
