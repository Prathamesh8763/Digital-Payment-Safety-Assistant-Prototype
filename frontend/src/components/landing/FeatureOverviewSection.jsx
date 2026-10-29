import React from 'react';
import { ArrowRight, Check, CreditCard } from 'lucide-react';

export default function FeatureOverviewSection({ onExploreClick }) {
  const cards = [
    {
      icon: 'Aa',
      iconClass: 'blue',
      tag: 'START HERE',
      title: 'Suspicious messages',
      desc: 'Paste an SMS, chat, or payment request to review common scam warning signs.',
      mode: 'text'
    },
    {
      icon: '!',
      iconClass: 'amber',
      tag: 'SPOT PRESSURE',
      title: 'Unexpected urgency',
      desc: 'Understand why threats, countdowns, and "act now" language deserve a pause.',
      mode: 'guided'
    },
    {
      icon: <Check size={20} strokeWidth={3} />,
      iconClass: 'green',
      tag: 'TAKE CONTROL',
      title: 'Safer next steps',
      desc: 'Get practical suggestions for verifying requests through channels you trust.',
      mode: 'text'
    },
    {
      icon: <CreditCard size={20} strokeWidth={2.5} />,
      iconClass: 'purple',
      tag: 'RECURRING SAFETY',
      title: 'Subscriptions & Invoices',
      desc: 'Detect fake renewal notices, check payment gateways, and manage auto-debits.',
      mode: 'subscriptions'
    }
  ];

  return (
    <section id="learn" className="landing-overview-section" aria-labelledby="overview-title">
      <div className="landing-section-eyebrow">A LITTLE MORE CONFIDENCE</div>
      <h2 id="overview-title" className="landing-section-title">
        Make sense of the message<br />before you make a move.
      </h2>
      <p className="landing-section-subtitle">
        Simple guidance for the moments when something doesn't feel right.
      </p>

      <div className="landing-cards-grid">
        {cards.map((card, idx) => (
          <div key={idx} className="landing-feature-card">
            <div className={`landing-card-icon-wrap ${card.iconClass}`} aria-hidden="true">
              {card.icon}
            </div>
            <span className="landing-card-tag">{card.tag}</span>
            <h3 className="landing-card-title">{card.title}</h3>
            <p className="landing-card-desc">{card.desc}</p>
            <button
              type="button"
              onClick={() => onExploreClick && onExploreClick(card.mode)}
              className="landing-card-link"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <span>Explore</span>
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
