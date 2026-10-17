import React from 'react';
import { ShieldCheck, Lock, Globe, ArrowLeft } from 'lucide-react';

export default function Header({ language, onLanguageChange, onNavigateHome }) {
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
            <span>Home</span>
          </button>
        ) : <div />}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'white', padding: '0.3rem 0.6rem', borderRadius: '20px', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}>
          <Globe size={15} style={{ color: 'var(--primary)' }} aria-hidden="true" />
          <label htmlFor="language-select" style={{ fontWeight: 600, color: '#334155' }}>Language:</label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            style={{ border: 'none', background: 'transparent', fontWeight: 700, color: 'var(--primary)', outline: 'none', cursor: 'pointer' }}
          >
            <option value="en">English</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="hinglish">Hinglish</option>
          </select>
        </div>
      </div>

      <div className="app-title-row">
        <ShieldCheck className="app-logo" aria-hidden="true" />
        <h1 className="app-title">Digital Payment Safety Assistant</h1>
      </div>
      <p className="app-subtitle">
        {language === 'hi' 
          ? 'डिजिटल भुगतान धोखाधड़ी को पहचानें, जल्दबाजी में पैसे भेजने से बचें और सुरक्षित रहने के नियम जानें।'
          : (language === 'hinglish'
            ? 'Digital payment scams ko pehchanein, jaldbaazi me payment karne se bachein aur safe rules jaanein.'
            : 'Help yourself and family members spot payment scams, pause before acting, and learn safe digital payment habits.')}
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
