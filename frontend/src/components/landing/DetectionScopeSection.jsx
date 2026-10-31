import React from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function DetectionScopeSection({ onNavigateReport }) {
  const canDetect = [
    {
      title: 'Pressure & Urgency Tactics',
      desc: 'Immediate countdowns, threats of electricity disconnection, account blocking, or simulated legal penalties designed to bypass your caution.'
    },
    {
      title: 'Credential & PIN Theft Requests',
      desc: 'Requests for OTPs, UPI PINs, netbanking passwords, CVVs, or ATM PINs under the guise of refunds, KYC, or verification.'
    },
    {
      title: 'UPI Collect & QR Receive Scams',
      desc: 'Tricks where a stranger sends a QR code or UPI collect request claiming it will transfer money into your account.'
    },
    {
      title: 'Fake Payment Proofs & Spoof Apps',
      desc: 'Simulated payment receipts from apps like Paytm Spoof or SMS alerts originating from ordinary 10-digit mobile numbers.'
    },
    {
      title: 'Remote Screen-Sharing Demands',
      desc: 'Instructions to install AnyDesk, TeamViewer, QuickSupport, or unfamiliar APK files to "resolve" transactions.'
    },
    {
      title: 'Unverified & Typosquatted Domains',
      desc: 'Deceptive domain structures imitating major banks or government portals without legitimate registration.'
    }
  ];

  const cannotDetect = [
    {
      title: 'Live Bank Balances & Settled Funds',
      desc: 'ClearPay has no connection to your bank ledger. We cannot verify whether money has actually entered or left your bank account.'
    },
    {
      title: 'Telecom-Level Caller ID Spoofing',
      desc: 'Scammers can spoof display numbers using VoIP. We cannot verify whether an incoming phone call is genuine without official bank callback.'
    },
    {
      title: 'Transactions Executed Under Duress',
      desc: 'If you have already confirmed a payment or entered your UPI PIN in your official app, ClearPay cannot undo the transfer.'
    },
    {
      title: 'Zero-Day Targeted Phishing Links',
      desc: 'Brand new malicious domains registered minutes ago may not yet appear in threat directories or blacklists.'
    },
    {
      title: 'Law Enforcement Beneficiary Holds',
      desc: 'To freeze accounts or retrieve stolen money, you must contact Helpline 1930 or file on cybercrime.gov.in directly.'
    }
  ];

  return (
    <section id="detection-scope" className="landing-overview-section" style={{ backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div className="landing-section-eyebrow">TRANSPARENCY & SYSTEM LIMITS</div>
        <h2 className="landing-section-title">
          What ClearPay Can and Cannot Detect
        </h2>
        <p className="landing-section-subtitle">
          We believe in complete honesty. Digital safety requires knowing what automated heuristics can spot, and when you must contact your bank directly.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginTop: '36px' }}>
          
          {/* Card 1: What We Detect */}
          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>What ClearPay Can Spot</h3>
                <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 700 }}>VERIFIABLE HEURISTICS</span>
              </div>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '14px' }}>
              {canDetect.map((item, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: '#334155', lineHeight: 1.45 }}>
                  <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: '3px' }} />
                  <div>
                    <strong style={{ color: '#0f172a', display: 'block', marginBottom: '2px' }}>{item.title}</strong>
                    <span>{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Card 2: What We Cannot Detect */}
          <div style={{ background: '#fef2f2', border: '1px solid #fecdd3', borderRadius: '16px', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <XCircle size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#991b1b' }}>What ClearPay Cannot Spot</h3>
                <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 700 }}>SYSTEM BOUNDARIES</span>
              </div>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '14px' }}>
              {cannotDetect.map((item, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: '#7f1d1d', lineHeight: 1.45 }}>
                  <XCircle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: '3px' }} />
                  <div>
                    <strong style={{ color: '#991b1b', display: 'block', marginBottom: '2px' }}>{item.title}</strong>
                    <span>{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Clear Disclaimer Callout */}
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '18px 22px', marginTop: '28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: '280px' }}>
            <AlertCircle size={24} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '13.5px', color: '#1e3a8a', lineHeight: 1.5 }}>
              <strong>The Core Safety Rule:</strong> No automated scam detector can promise 100% security. A "Low Risk" result means no common suspicious indicators were identified—it is <strong>NOT proof that a communication is authentic</strong>. If a request involves money or account credentials, always confirm with your bank directly.
            </div>
          </div>
          {onNavigateReport && (
            <button
              type="button"
              onClick={onNavigateReport}
              style={{ background: '#ffffff', color: '#dc2626', border: '1px solid #fecdd3', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', alignSelf: 'center' }}
            >
              Report Suspected Fraud (1930) →
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
