import React from 'react';

export default function LandingFooter({ onNavigateSection }) {
  const handleNavClick = (sectionId) => (e) => {
    e.preventDefault();
    if (onNavigateSection) {
      onNavigateSection(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="landing-footer">
      <div className="landing-footer-container">
        <div>
          <div className="landing-footer-brand">ClearPay</div>
          <p className="landing-footer-disclaimer">
            Educational guidance only. No tool can guarantee that a message is safe or fraudulent.
          </p>
        </div>

        <ul className="landing-footer-links">
          <li>
            <a href="#how-it-works" onClick={handleNavClick('how-it-works')} className="landing-footer-link">
              How it works
            </a>
          </li>
          <li>
            <a href="#learn" onClick={handleNavClick('learn')} className="landing-footer-link">
              Learn
            </a>
          </li>
          <li>
            <a href="#privacy" onClick={handleNavClick('privacy')} className="landing-footer-link">
              Privacy
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
