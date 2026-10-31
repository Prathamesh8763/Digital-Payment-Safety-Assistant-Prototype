import React, { useState } from 'react';
import { ArrowRight, Check, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';

const DEMO_SCENARIOS = [
  {
    id: 'kyc_threat',
    label: 'KYC Account Panic',
    message: 'Your bank account will be blocked today. Verify now to avoid losing access. Share the 6-digit code we just sent you.',
    risk_level: 'HIGH RISK',
    theme: 'high',
    title: 'Slow down — this message has warning signs',
    signals: [
      { num: '1', color: 'orange', text: 'Creates artificial urgency and threats' },
      { num: '2', color: 'rose', text: 'Requests a secret verification code / OTP' },
      { num: '✓', color: 'green', text: 'Action: Never share codes. Contact bank on official helpline.' }
    ]
  },
  {
    id: 'upi_collect',
    label: 'UPI Collect Scam',
    message: 'Buyer sent you a PhonePe collect request for ₹4,500. Accept the request and enter your UPI PIN to claim payment.',
    risk_level: 'HIGH RISK',
    theme: 'high',
    title: 'Deceptive collect request detected',
    signals: [
      { num: '1', color: 'orange', text: 'Demands entering UPI PIN to receive money' },
      { num: '2', color: 'rose', text: 'Rule: PIN is ONLY for paying, never for receiving' },
      { num: '✓', color: 'green', text: 'Action: Decline the request in your UPI app immediately.' }
    ]
  },
  {
    id: 'official_alert',
    label: 'Legitimate Bank Alert',
    message: 'Dear Customer, your account ending 4821 was debited by INR 350.00 on 24-Oct at Supermart. Avail Bal: INR 14,250.00. Call 1800-xxx if unauthorized.',
    risk_level: 'LOW RISK',
    theme: 'low',
    title: 'Standard informational bank alert',
    signals: [
      { num: '1', color: 'green', text: 'Standard transactional debit confirmation' },
      { num: '2', color: 'green', text: 'No pressure, no suspicious links, no credential request' },
      { num: '✓', color: 'green', text: 'Note: Always monitor statements; automated tools cannot guarantee safety.' }
    ]
  }
];

export default function HeroDemoCard({ onAnalyzeWithDemo }) {
  const [activeScenarioId, setActiveScenarioId] = useState('kyc_threat');
  const activeScenario = DEMO_SCENARIOS.find(s => s.id === activeScenarioId) || DEMO_SCENARIOS[0];

  const handleTestInAnalyzer = () => {
    if (onAnalyzeWithDemo) {
      onAnalyzeWithDemo(activeScenario.message);
    }
  };

  return (
    <div className="hero-demo-card" aria-label="Interactive demonstration of message safety check">
      {/* Header with Interactive Pill */}
      <div className="hero-demo-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={16} color="#2563eb" />
          <span className="hero-demo-title">Interactive Simulation</span>
        </div>
        <span className="hero-demo-badge" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
          <span className="hero-demo-dot" style={{ background: '#2563eb' }} aria-hidden="true"></span>
          LIVE DEMO
        </span>
      </div>

      {/* Interactive Scenario Selector Tabs */}
      <div style={{ marginBottom: '12px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
          Choose a scenario to test:
        </span>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {DEMO_SCENARIOS.map(s => {
            const isSelected = s.id === activeScenarioId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveScenarioId(s.id)}
                style={{
                  background: isSelected ? '#1e293b' : '#f1f5f9',
                  color: isSelected ? '#ffffff' : '#475569',
                  border: isSelected ? '1px solid #0f172a' : '1px solid #e2e8f0',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11.5px',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="hero-demo-box-label">SIMULATED MESSAGE CONTENT</div>
      <div className="hero-demo-textbox" style={{ minHeight: '68px' }}>
        "{activeScenario.message}"
      </div>

      <div className="hero-demo-result" style={activeScenario.theme === 'low' ? { background: '#f0fdf4', border: '1px solid #bbf7d0' } : {}}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span
            className="hero-demo-risk-pill"
            style={activeScenario.theme === 'low' ? { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' } : {}}
          >
            {activeScenario.theme === 'low' ? <ShieldCheck size={12} style={{ display: 'inline', marginRight: '4px' }} /> : <AlertTriangle size={12} style={{ display: 'inline', marginRight: '4px' }} />}
            {activeScenario.risk_level}
          </span>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Heuristics Result</span>
        </div>

        <div className="hero-demo-result-title" style={activeScenario.theme === 'low' ? { color: '#14532d' } : {}}>
          {activeScenario.title}
        </div>

        <ul className="hero-demo-signals">
          {activeScenario.signals.map((sig, idx) => (
            <li key={idx} className="hero-demo-signal-item">
              <span className={`hero-demo-number-badge ${sig.color}`} aria-hidden="true">
                {sig.num === '✓' ? <Check size={12} strokeWidth={3} /> : sig.num}
              </span>
              <span style={activeScenario.theme === 'low' ? { color: '#166534' } : {}}>{sig.text}</span>
            </li>
          ))}
        </ul>

        {/* CTA to test in live analyzer */}
        <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: activeScenario.theme === 'low' ? '1px solid #dcfce7' : '1px solid #fecdd3' }}>
          <button
            type="button"
            onClick={handleTestInAnalyzer}
            className="hero-demo-action-btn"
            style={{ width: '100%', justifyContent: 'center' }}
            aria-label="Test this message in the live analyzer"
          >
            <span>Test this in Live Scanner</span>
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>

        <p className="hero-demo-disclaimer" style={{ marginTop: '8px' }}>
          Interactive educational example. Automated tools provide guidance, not a guarantee of safety.
        </p>
      </div>
    </div>
  );
}
