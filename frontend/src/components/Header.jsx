import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Lock, ArrowLeft } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

export default function Header({ onNavigateHome }) {
  const { t } = useTranslation();

  return (
    <header className="app-header">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        {onNavigateHome ? (
          <button
            type="button"
            onClick={onNavigateHome}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'white',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '0.35rem 0.85rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--color-primary-600)',
              cursor: 'pointer'
            }}
            aria-label="Back to landing page"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            <span>{t('common.nav_home', 'Home')}</span>
          </button>
        ) : <div />}

        <LanguageSelector />
      </div>

      <div className="app-title-row">
        <ShieldCheck className="app-logo" aria-hidden="true" />
        <h1 className="app-title">{t('common.brand_name', 'ClearPay')} – {t('common.brand_tagline', 'Payment Safety Assistant')}</h1>
      </div>
      <p className="app-subtitle">
        {t('landing.hero_subhead', 'Help yourself and family members spot payment scams, pause before acting, and learn safe digital payment habits.')}
      </p>

      <div className="privacy-banner" role="status">
        <Lock size={20} aria-hidden="true" />
        <div>
          <strong>Privacy by Design:</strong> We never ask for or store your UPI PIN, OTP, card CVV, passwords, or bank account numbers.
        </div>
      </div>
    </header>
  );
}
