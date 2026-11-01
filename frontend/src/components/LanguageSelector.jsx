import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function LanguageSelector({ className = '', style = {}, showLabel = true }) {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language || 'en';

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
  };

  return (
    <div
      className={`clearpay-lang-selector ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        background: '#ffffff',
        padding: '0.25rem 0.65rem',
        borderRadius: '20px',
        border: '1.5px solid #cbd5e1',
        fontSize: '0.82rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        ...style
      }}
    >
      <Globe size={14} style={{ color: '#4f46e5', flexShrink: 0 }} aria-hidden="true" />
      {showLabel && (
        <label
          htmlFor="clearpay-lang-dropdown"
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}
        >
          {t('common.language_label', 'Language')}:
        </label>
      )}
      <select
        id="clearpay-lang-dropdown"
        value={currentLang}
        onChange={handleLanguageChange}
        style={{
          border: 'none',
          background: 'transparent',
          fontWeight: 700,
          color: '#312e81',
          outline: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: '0.84rem'
        }}
        aria-label="Select interface language"
      >
        <option value="en">English</option>
        <option value="hi">हिंदी (Hindi)</option>
        <option value="hinglish">Hinglish</option>
      </select>
    </div>
  );
}
