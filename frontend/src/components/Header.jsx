import React from 'react';
import { ShieldCheck, Lock, Globe } from 'lucide-react';

export default function Header({ language, onLanguageChange }) {
  return (
    <header className="app-header">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'white', padding: '0.3rem 0.6rem', borderRadius: '20px', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}>
          <Globe size={15} style={{ color: 'var(--primary)' }} />
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
        <ShieldCheck className="app-logo" />
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
        <Lock size={20} />
        <div>
          <strong>Privacy by Design:</strong> We never ask for or store your UPI PIN, OTP, card CVV, passwords, or bank account numbers.
        </div>
      </div>
    </header>
  );
}
