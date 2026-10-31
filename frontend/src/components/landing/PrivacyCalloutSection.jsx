import React from 'react';
import { Lock, Server, Database, EyeOff } from 'lucide-react';

export default function PrivacyCalloutSection() {
  const pillars = [
    {
      icon: <Server size={20} color="#2563eb" />,
      title: 'Encrypted HTTPS In-Transit',
      desc: 'Messages are transmitted over secure TLS/HTTPS channels directly to our stateless analysis service.'
    },
    {
      icon: <Database size={20} color="#16a34a" />,
      title: 'Volatile RAM Processing Only',
      desc: 'Analysis runs strictly in temporary memory. ClearPay does not persist, database, or sell your submitted text.'
    },
    {
      icon: <EyeOff size={20} color="#d97706" />,
      title: 'Zero Credential Ingestion',
      desc: 'We never request or store bank logins, debit cards, OTPs, or UPI PINs. Always strip personal identifiers.'
    },
    {
      icon: <Lock size={20} color="#7c3aed" />,
      title: 'Local-Only Analysis History',
      desc: 'Your past scans are stored 100% on your device in your browser\'s localStorage. Nothing is synced to cloud servers.'
    }
  ];

  return (
    <section id="privacy" className="landing-privacy-section" aria-labelledby="privacy-heading">
      <div className="landing-privacy-card" style={{ maxWidth: '1100px', margin: '0 auto', padding: '36px' }}>
        <div style={{ marginBottom: '24px' }}>
          <div className="landing-section-eyebrow" style={{ color: '#2563eb' }}>DATA PRIVACY & INTEGRITY</div>
          <h2 id="privacy-heading" className="landing-privacy-title" style={{ fontSize: '28px', margin: '0 0 10px' }}>
            Transparent Privacy Architecture
          </h2>
          <p className="landing-privacy-desc" style={{ maxWidth: '800px', fontSize: '15px' }}>
            A security tool must earn your trust through architectural transparency. Here is exactly how your data travels and is processed when you use ClearPay:
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '20px' }}>
          {pillars.map((item, idx) => (
            <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                {item.icon}
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>{item.title}</h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.45, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
