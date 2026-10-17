import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import HeroDemoCard from './HeroDemoCard';

export default function HeroSection({ onAnalyzeClick, onHowItWorksClick, onAnalyzeWithDemo }) {
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
            YOUR DIGITAL SAFETY COMPANION
          </div>

          <h1 id="hero-main-title" className="landing-hero-title">
            Pause before you pay.<br />
            Know before you trust.
          </h1>

          <p className="landing-hero-desc">
            Suspicious SMS, payment requests, and urgent messages can feel convincing. Get a clear, practical second opinion before you act.
          </p>

          <div className="landing-hero-ctas">
            <button
              type="button"
              onClick={onAnalyzeClick}
              className="btn-hero-primary"
            >
              <span>Check a message</span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>

            <a
              href="#how-it-works"
              onClick={handleHowItWorksClick}
              className="btn-hero-secondary"
            >
              How it works
            </a>
          </div>

          <div className="landing-hero-privacy-note">
            <CheckCircle2 size={18} aria-hidden="true" />
            <span>Built around privacy. No bank login or payment details needed.</span>
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
