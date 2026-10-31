import React, { useState } from 'react';
import { ArrowUpRight, Menu, X, ChevronDown, ShieldAlert, PhoneCall, Link2, CreditCard, HelpCircle } from 'lucide-react';

export default function LandingNavbar({
  onAnalyzeClick,
  onNavigateSection,
  onNavigateGuided,
  onNavigateCheckLink,
  onNavigateSubscriptions,
  onNavigateScamGuide,
  onNavigateReport
}) {
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
        {/* Brand Logo */}
        <a href="/" className="landing-brand" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <div className="landing-brand-logo" aria-hidden="true">C</div>
          <div className="landing-brand-text">
            <span className="landing-brand-name">ClearPay</span>
            <span className="landing-brand-tagline">Payment Safety Assistant</span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <ul className="landing-nav-links desktop-only">
          <li>
            <a href="#how-it-works" onClick={handleNavClick('how-it-works')} className="landing-nav-link">
              How it works
            </a>
          </li>
          <li>
            <a href="#detection-scope" onClick={handleNavClick('detection-scope')} className="landing-nav-link">
              What We Detect
            </a>
          </li>
          <li>
            <a
              href="/scam-guide"
              onClick={handleLinkClick(onNavigateScamGuide)}
              className="landing-nav-link"
            >
              Scam Guide
            </a>
          </li>
          <li>
            <a
              href="/report"
              onClick={handleLinkClick(onNavigateReport)}
              className="landing-nav-link"
              style={{ color: '#dc2626', fontWeight: 700 }}
            >
              Report (1930)
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
              <span>More Tools</span>
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
                  <span>Check a link / URL</span>
                </a>
                <a
                  href="/subscriptions"
                  onClick={handleLinkClick(onNavigateSubscriptions)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', color: '#334155', textDecoration: 'none', fontWeight: 500 }}
                  className="dropdown-item"
                >
                  <CreditCard size={16} color="#7c3aed" />
                  <span>Subscriptions & Invoices</span>
                </a>
                <a
                  href="/guided-help"
                  onClick={handleLinkClick(onNavigateGuided)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
                  className="dropdown-item"
                >
                  <HelpCircle size={16} color="#2563eb" />
                  <span>I'm Not Sure (Guided)</span>
                </a>
              </div>
            )}
          </li>
        </ul>

        {/* Right Action & Mobile Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={onAnalyzeClick}
            className="landing-nav-cta desktop-only"
            aria-label="Analyze a message now"
          >
            <span>Analyze a message</span>
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
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'grid', gap: '10px' }}>
            <li>
              <button
                type="button"
                onClick={onAnalyzeClick}
                className="landing-nav-cta"
                style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
              >
                <span>Analyze a message</span>
                <ArrowUpRight size={16} />
              </button>
            </li>
            <li>
              <a href="/scam-guide" onClick={handleLinkClick(onNavigateScamGuide)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', fontSize: '15px', fontWeight: 600, color: '#0f172a', textDecoration: 'none' }}>
                <ShieldAlert size={18} color="#2563eb" />
                <span>Indian Scam Tactics Guide</span>
              </a>
            </li>
            <li>
              <a href="/report" onClick={handleLinkClick(onNavigateReport)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', fontSize: '15px', fontWeight: 700, color: '#dc2626', textDecoration: 'none' }}>
                <PhoneCall size={18} color="#dc2626" />
                <span>Helpline 1930 & Reporting</span>
              </a>
            </li>
            <li>
              <a href="/check-link" onClick={handleLinkClick(onNavigateCheckLink)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', fontSize: '15px', fontWeight: 500, color: '#334155', textDecoration: 'none' }}>
                <Link2 size={18} color="#475569" />
                <span>Inspect Link / URL</span>
              </a>
            </li>
            <li>
              <a href="/subscriptions" onClick={handleLinkClick(onNavigateSubscriptions)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', fontSize: '15px', fontWeight: 500, color: '#334155', textDecoration: 'none' }}>
                <CreditCard size={18} color="#475569" />
                <span>Subscriptions & Invoices</span>
              </a>
            </li>
            <li>
              <a href="/guided-help" onClick={handleLinkClick(onNavigateGuided)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', fontSize: '15px', fontWeight: 600, color: '#2563eb', textDecoration: 'none' }}>
                <HelpCircle size={18} color="#2563eb" />
                <span>I'm Not Sure (Guided)</span>
              </a>
            </li>
            <li>
              <a href="#detection-scope" onClick={handleNavClick('detection-scope')} style={{ display: 'block', padding: '8px 0', fontSize: '14px', color: '#64748b', textDecoration: 'none' }}>
                What ClearPay Can & Cannot Detect
              </a>
            </li>
            <li>
              <a href="#how-it-works" onClick={handleNavClick('how-it-works')} style={{ display: 'block', padding: '8px 0', fontSize: '14px', color: '#64748b', textDecoration: 'none' }}>
                How it works
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
