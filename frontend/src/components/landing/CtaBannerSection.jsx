import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function CtaBannerSection({ onAnalyzeClick }) {
  return (
    <section className="landing-cta-banner-section" aria-labelledby="cta-banner-title">
      <div className="landing-cta-banner">
        <div>
          <h2 id="cta-banner-title" className="landing-cta-title">
            Not sure about a message?
          </h2>
          <p className="landing-cta-subtext">
            Start with a simple check. Take your time before you respond.
          </p>
        </div>

        <button
          type="button"
          onClick={onAnalyzeClick}
          className="btn-cta-banner"
          aria-label="Analyze a message now"
        >
          <span>Analyze a message</span>
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
