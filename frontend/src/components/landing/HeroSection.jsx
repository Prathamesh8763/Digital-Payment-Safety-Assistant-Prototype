import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import HeroDemoCard from './HeroDemoCard';

export default function HeroSection({ onAnalyzeClick, onHowItWorksClick, onAnalyzeWithDemo }) {
  const { t } = useTranslation();

  const handleHowItWorksClick = (e) => {
    e.preventDefault();
    if (onHowItWorksClick) {
      onHowItWorksClick();
    } else {
      const el = document.getElementById('how-it-works');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="landing-hero" aria-labelledby="hero-main-title">
      <div className="landing-hero-glow" aria-hidden="true" />
      <div className="landing-hero-container">
        {/* Left Column: Headline and CTAs */}
        <div className="landing-hero-left">
          <div className="landing-hero-eyebrow">
            {t('landing.hero_eyebrow', 'YOUR DIGITAL SAFETY COMPANION')}
          </div>

          <h1 id="hero-main-title" className="landing-hero-title">
            {t('landing.hero_title', 'Pause before you pay. Know before you trust.')}
          </h1>

          <p className="landing-hero-desc">
            {t('landing.hero_subhead', 'Suspicious SMS, payment requests, and urgent messages can feel convincing. Get a clear, practical second opinion before you act.')}
          </p>

          <div className="landing-hero-ctas">
            <button
              type="button"
              onClick={onAnalyzeClick}
              className="btn-hero-primary"
            >
              <span>{t('landing.check_message_btn', 'Check a message')}</span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>

            <a
              href="#how-it-works"
              onClick={handleHowItWorksClick}
              className="btn-hero-secondary"
            >
              {t('landing.how_it_works_btn', 'How it works')}
            </a>
          </div>

          <div className="landing-hero-privacy-note">
            <CheckCircle2 size={18} aria-hidden="true" />
            <span>{t('common.privacy_badge', 'Built around privacy. No bank login or payment details needed.')}</span>
          </div>
        </div>

        {/* Right Column: Hero Demo Card */}
        <div className="landing-hero-right">
          <HeroDemoCard onAnalyzeWithDemo={onAnalyzeWithDemo} />
        </div>
      </div>
    </section>
  );
}
