import React from 'react';
import { ArrowRight, Check } from 'lucide-react';

const DEMO_MESSAGE = "Your account will be blocked today. Verify now to avoid losing access. Share the code we sent you.";

export default function HeroDemoCard({ onAnalyzeWithDemo }) {
  const handleReviewClick = () => {
    if (onAnalyzeWithDemo) {
      onAnalyzeWithDemo(DEMO_MESSAGE);
    }
  };

  return (
    <div className="hero-demo-card" aria-label="Interactive demonstration of message safety check">
      <div className="hero-demo-header">
        <span className="hero-demo-title">Message safety check</span>
        <span className="hero-demo-badge">
          <span className="hero-demo-dot" aria-hidden="true"></span>
          DEMO
        </span>
      </div>

      <div className="hero-demo-box-label">MESSAGE TO CHECK</div>
      <div className="hero-demo-textbox">
        {DEMO_MESSAGE}
      </div>

      <button
        type="button"
        onClick={handleReviewClick}
        className="hero-demo-action-btn"
        aria-label="Review warning signs for this demo message"
      >
        <span>Review warning signs</span>
        <ArrowRight size={16} aria-hidden="true" />
      </button>

      <div className="hero-demo-result">
        <span className="hero-demo-risk-pill">HIGH RISK</span>
        <div className="hero-demo-result-title">
          Slow down — this message has warning signs
        </div>

        <ul className="hero-demo-signals">
          <li className="hero-demo-signal-item">
            <span className="hero-demo-number-badge orange" aria-hidden="true">1</span>
            <span>Creates urgency and pressure</span>
          </li>
          <li className="hero-demo-signal-item">
            <span className="hero-demo-number-badge rose" aria-hidden="true">2</span>
            <span>Requests a sensitive verification code</span>
          </li>
          <li className="hero-demo-signal-item">
            <span className="hero-demo-number-badge green" aria-hidden="true">
              <Check size={12} strokeWidth={3} />
            </span>
            <span>Verify independently using an official channel</span>
          </li>
        </ul>

        <p className="hero-demo-disclaimer">
          Educational example only. Not a guarantee of safety or fraud status.
        </p>
      </div>
    </div>
  );
}
