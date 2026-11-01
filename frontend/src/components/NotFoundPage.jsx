import React from 'react';
import { Home } from 'lucide-react';
import Logo from './common/Logo';

export default function NotFoundPage({ onNavigateHome }) {
  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        backgroundColor: '#f8fafc'
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '40px 32px',
          textAlign: 'center',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)'
        }}
      >
        {/* Symbol-Only Logo for 404 screen */}
        <div style={{ marginBottom: '24px' }}>
          <Logo variant="symbol" size={56} onClick={onNavigateHome} />
        </div>

        <span
          style={{
            display: 'inline-block',
            fontSize: '12px',
            fontWeight: 700,
            color: '#2563eb',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            padding: '3px 10px',
            borderRadius: '12px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '12px'
          }}
        >
          404 • Page Not Found
        </span>

        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>
          This safety check does not exist
        </h1>

        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.5, margin: '0 0 28px' }}>
          The page or tool link you followed is not recognized. Return to the ClearPay homepage to safely check a message, link, or QR code.
        </p>

        <button
          type="button"
          onClick={onNavigateHome}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.15s ease'
          }}
        >
          <Home size={16} />
          <span>Back to ClearPay Home</span>
        </button>
      </div>
    </div>
  );
}
