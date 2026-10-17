import React from 'react';
import { Check, CheckCircle2 } from 'lucide-react';

export default function PrivacyCalloutSection() {
  const points = [
    'No bank login required',
    'No payment execution',
    'Verify before you act'
  ];

  return (
    <section id="privacy" className="landing-privacy-section" aria-labelledby="privacy-heading">
      <div className="landing-privacy-card">
        <div className="landing-privacy-big-icon" aria-hidden="true">
          <Check size={36} strokeWidth={3} />
        </div>

        <div>
          <h2 id="privacy-heading" className="landing-privacy-title">
            Your safety matters.<br />So does your privacy.
          </h2>
          <p className="landing-privacy-desc">
            ClearPay is designed to help you assess suspicious messages — not handle your money. Never enter your UPI PIN, OTP, password, or bank login details.
          </p>

          <div className="landing-privacy-checks">
            {points.map((point, idx) => (
              <div key={idx} className="landing-privacy-check-item">
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
