import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, Menu, X, ChevronDown, ShieldAlert, PhoneCall, Link2, CreditCard, HelpCircle } from 'lucide-react';
import LanguageSelector from '../LanguageSelector';
import Logo from '../common/Logo';

export default function LandingNavbar({
  onAnalyzeClick,
  onNavigateSection,
  onNavigateGuided,
  onNavigateCheckLink,
  onNavigateSubscriptions,
  onNavigateScamGuide,
  onNavigateReport
}) {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);

  const handleNavClick = (sectionId) => (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    setToolsDropdownOpen(false);
    if (onNavigateSection) {
      onNavigateSection(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLinkClick = (callback) => (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    setToolsDropdownOpen(false);
    if (callback) callback();
  };

  return (
    <header className="landing-header">
      <nav className="landing-nav-container" aria-label="Main Navigation">
        {/* Brand Logo - Primary Horizontal */}
        <a href="/" className="landing-brand" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label="ClearPay Home">
          <Logo variant="horizontal" size="md" />
        </a>

        {/* Desktop Navigation Links */}
        <ul className="landing-nav-links desktop-only">
          <li>
            <a href="#how-it-works" onClick={handleNavClick('how-it-works')} className="landing-nav-link">
              {t('common.nav_how_it_works', 'How it works')}
            </a>
          </li>
          <li>
            <a href="#detection-scope" onClick={handleNavClick('detection-scope')} className="landing-nav-link">
              {t('common.nav_what_we_detect', 'What We Detect')}
            </a>
          </li>
          <li>
            <a
              href="/scam-guide"
              onClick={handleLinkClick(onNavigateScamGuide)}
              className="landing-nav-link"
            >
              {t('common.nav_scam_guide', 'Scam Guide')}
            </a>
          </li>
          <li>
            <a
              href="/report"
              onClick={handleLinkClick(onNavigateReport)}
              className="landing-nav-link"
              style={{ color: '#dc2626', fontWeight: 700 }}
            >
              {t('common.nav_report_1930', 'Report (1930)')}
            </a>
          </li>

          {/* Tools Dropdown */}
          <li style={{ position: 'relative' }}>
            <button
              type="button"
              className="landing-nav-link"
              onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
              onBlur={() => setTimeout(() => setToolsDropdownOpen(false), 200)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', font: 'inherit' }}
              aria-expanded={toolsDropdownOpen}
              aria-haspopup="true"
            >
              <span>{t('common.nav_more_tools', 'More Tools')}</span>
              <ChevronDown size={14} style={{ transform: toolsDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
            </button>

            {toolsDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                  padding: '8px',
                  minWidth: '220px',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <a
                  href="/check-link"
                  onClick={handleLinkClick(onNavigateCheckLink)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', color: '#334155', textDecoration: 'none', fontWeight: 500 }}
                  className="dropdown-item"
                >
                  <Link2 size={16} color="#2563eb" />
                  <span>{t('common.nav_link_qr_check', 'Check a link / URL')}</span>
                </a>
                <a
                  href="/subscriptions"
                  onClick={handleLinkClick(onNavigateSubscriptions)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', color: '#334155', textDecoration: 'none', fontWeight: 500 }}
                  className="dropdown-item"
                >
                  <CreditCard size={16} color="#7c3aed" />
                  <span>{t('common.nav_subscriptions', 'Subscriptions & Invoices')}</span>
                </a>
                <a
                  href="/guided-help"
                  onClick={handleLinkClick(onNavigateGuided)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
                  className="dropdown-item"
                >
                  <HelpCircle size={16} color="#2563eb" />
                  <span>{t('common.nav_guided_help', "I'm Not Sure (Guided)")}</span>
                </a>
              </div>
            )}
          </li>
        </ul>

        {/* Right Action & Mobile Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Centralized Language Selector */}
          <LanguageSelector className="desktop-only" />

          <button
            type="button"
            onClick={onAnalyzeClick}
            className="landing-nav-cta desktop-only"
            aria-label="Analyze a message now"
          >
            <span>{t('common.nav_analyze_btn', 'Analyze a message')}</span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </button>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            style={{
              background: 'none',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              color: '#0f172a',
              display: 'none'
            }}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          className="mobile-nav-drawer"
          style={{
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            padding: '16px 24px 24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}
        >
          {/* Mobile Navigation Header: Symbol-Only Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Logo variant="symbol" size={32} />
              <span style={{ fontWeight: 800, fontSize: '17px', color: '#0f172a' }}>ClearPay</span>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: '#64748b' }}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mobile Language Selector */}
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
            <LanguageSelector style={{ width: '100%', justifyContent: 'center' }} />
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'grid', gap: '10px' }}>
            <li>
              <button
                type="button"
                onClick={onAnalyzeClick}
                className="landing-nav-cta"
                style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
              >
                <span>{t('common.nav_analyze_btn', 'Analyze a message')}</span>
                <ArrowUpRight size={16} />
              </button>
            </li>
            <li>
              <a href="/scam-guide" onClick={handleLinkClick(onNavigateScamGuide)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', fontSize: '15px', fontWeight: 600, color: '#0f172a', textDecoration: 'none' }}>
                <ShieldAlert size={18} color="#2563eb" />
                <span>{t('common.nav_scam_guide', 'Indian Scam Tactics Guide')}</span>
              </a>
            </li>
            <li>
              <a href="/report" onClick={handleLinkClick(onNavigateReport)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', fontSize: '15px', fontWeight: 700, color: '#dc2626', textDecoration: 'none' }}>
                <PhoneCall size={18} color="#dc2626" />
                <span>{t('common.nav_report_1930', 'Helpline 1930 & Reporting')}</span>
              </a>
            </li>
            <li>
              <a href="/check-link" onClick={handleLinkClick(onNavigateCheckLink)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', fontSize: '15px', fontWeight: 500, color: '#334155', textDecoration: 'none' }}>
                <Link2 size={18} color="#475569" />
                <span>{t('common.nav_link_qr_check', 'Inspect Link / URL')}</span>
              </a>
            </li>
            <li>
              <a href="/subscriptions" onClick={handleLinkClick(onNavigateSubscriptions)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', fontSize: '15px', fontWeight: 500, color: '#334155', textDecoration: 'none' }}>
                <CreditCard size={18} color="#475569" />
                <span>{t('common.nav_subscriptions', 'Subscriptions & Invoices')}</span>
              </a>
            </li>
            <li>
              <a href="/guided-help" onClick={handleLinkClick(onNavigateGuided)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', fontSize: '15px', fontWeight: 600, color: '#2563eb', textDecoration: 'none' }}>
                <HelpCircle size={18} color="#2563eb" />
                <span>{t('common.nav_guided_help', "I'm Not Sure (Guided)")}</span>
              </a>
            </li>
            <li>
              <a href="#detection-scope" onClick={handleNavClick('detection-scope')} style={{ display: 'block', padding: '8px 0', fontSize: '14px', color: '#64748b', textDecoration: 'none' }}>
                {t('common.nav_what_we_detect', 'What ClearPay Can & Cannot Detect')}
              </a>
            </li>
            <li>
              <a href="#how-it-works" onClick={handleNavClick('how-it-works')} style={{ display: 'block', padding: '8px 0', fontSize: '14px', color: '#64748b', textDecoration: 'none' }}>
                {t('common.nav_how_it_works', 'How it works')}
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
