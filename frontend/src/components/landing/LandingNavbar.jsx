import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function LandingNavbar({ onAnalyzeClick, onNavigateSection }) {
  const handleNavClick = (sectionId) => (e) => {
    e.preventDefault();
    if (onNavigateSection) {
      onNavigateSection(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="landing-header">
      <nav className="landing-nav-container" aria-label="Main Navigation">
        <a href="/" className="landing-brand" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <div className="landing-brand-logo" aria-hidden="true">C</div>
          <div className="landing-brand-text">
            <span className="landing-brand-name">ClearPay</span>
            <span className="landing-brand-tagline">Payment Safety Assistant</span>
          </div>
        </a>

        <ul className="landing-nav-links">
          <li>
            <a href="#how-it-works" onClick={handleNavClick('how-it-works')} className="landing-nav-link">
              How it works
            </a>
          </li>
          <li>
            <a href="#learn" onClick={handleNavClick('learn')} className="landing-nav-link">
              Learn
            </a>
          </li>
          <li>
            <a href="#privacy" onClick={handleNavClick('privacy')} className="landing-nav-link">
              Privacy
            </a>
          </li>
        </ul>

        <button
          type="button"
          onClick={onAnalyzeClick}
          className="landing-nav-cta"
          aria-label="Analyze a message now"
        >
          <span>Analyze a message</span>
          <ArrowUpRight size={16} aria-hidden="true" />
        </button>
      </nav>
    </header>
  );
}
