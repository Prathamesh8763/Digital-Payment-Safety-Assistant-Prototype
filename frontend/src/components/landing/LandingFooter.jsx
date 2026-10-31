import React, { useState } from 'react';
import { PhoneCall, ShieldCheck, Lock, Info, X } from 'lucide-react';

const CURRENT_YEAR = 2026;

export default function LandingFooter({
  onNavigateSection,
  onNavigateAnalyze,
  onNavigateCheckLink,
  onNavigateSubscriptions,
  onNavigateGuided,
  onNavigateScamGuide,
  onNavigateReport
}) {
  const [activeModal, setActiveModal] = useState(null); // 'privacy' | 'terms' | 'about' | null

  const handleNavClick = (sectionId) => (e) => {
    e.preventDefault();
    if (onNavigateSection) {
      onNavigateSection(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLink = (callback) => (e) => {
    e.preventDefault();
    if (callback) callback();
  };

  return (
    <footer className="landing-footer" style={{ backgroundColor: '#0f172a', color: '#f8fafc', padding: '64px 24px 32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Main 4-Column Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '36px', marginBottom: '48px' }}>
          
          {/* Col 1: Brand & Mission */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: '32px', height: '32px', background: '#2563eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>
                C
              </div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>ClearPay</span>
            </div>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '16px' }}>
              An open, educational digital safety companion helping users identify financial fraud cues before sending money or sharing secret codes.
            </p>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Built for privacy. Stateless architecture with zero message persistence.
            </div>
          </div>

          {/* Col 2: Safety Tools */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
              Safety Tools
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px', fontSize: '13.5px' }}>
              <li>
                <a href="/analyze" onClick={handleLink(onNavigateAnalyze)} style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                  Analyze Suspicious Message
                </a>
              </li>
              <li>
                <a href="/check-link" onClick={handleLink(onNavigateCheckLink)} style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                  Inspect Link & QR Code
                </a>
              </li>
              <li>
                <a href="/subscriptions" onClick={handleLink(onNavigateSubscriptions)} style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                  Subscriptions & Invoices
                </a>
              </li>
              <li>
                <a href="/guided-help" onClick={handleLink(onNavigateGuided)} style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                  "I'm Not Sure" Guided Check
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Education & Detection */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
              Knowledge & Scope
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px', fontSize: '13.5px' }}>
              <li>
                <a href="/scam-guide" onClick={handleLink(onNavigateScamGuide)} style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                  Indian Scam Tactics Hub
                </a>
              </li>
              <li>
                <a href="#detection-scope" onClick={handleNavClick('detection-scope')} style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                  What We Can & Cannot Detect
                </a>
              </li>
              <li>
                <a href="#how-it-works" onClick={handleNavClick('how-it-works')} style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                  How Analysis Engine Works
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveModal('about')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#cbd5e1', fontSize: '13.5px', cursor: 'pointer', textAlign: 'left' }}
                >
                  About ClearPay & Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Emergency Recourse (1930) & Legal */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
              Emergency Fraud Recourse
            </h4>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fca5a5', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                <PhoneCall size={16} />
                <span>Helpline 1930</span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#fecaca', lineHeight: 1.4 }}>
                Citizen Financial Cyber Fraud Reporting System. Dial within 1–2 hours to request an immediate account freeze.
              </p>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px', fontSize: '13px' }}>
              <li>
                <a href="/report" onClick={handleLink(onNavigateReport)} style={{ color: '#fca5a5', textDecoration: 'none', fontWeight: 600 }}>
                  Reporting Guide & Checklist →
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveModal('privacy')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', fontSize: '13px', cursor: 'pointer', textAlign: 'left' }}
                >
                  Stateless Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveModal('terms')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', fontSize: '13px', cursor: 'pointer', textAlign: 'left' }}
                >
                  Terms & Limitation of Liability
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Line */}
        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', fontSize: '12.5px', color: '#64748b' }}>
          <div>
            © {CURRENT_YEAR} ClearPay. Educational assistance only. Not a financial institution.
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ color: '#94a3b8' }}>Always verify with your bank through official phone numbers</span>
          </div>
        </div>

      </div>

      {/* Modal: Privacy Policy */}
      {activeModal === 'privacy' && (
        <div className="v8-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#ffffff', color: '#0f172a', borderRadius: '16px', maxWidth: '600px', width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '28px', position: 'relative' }}>
            <button type="button" onClick={() => setActiveModal(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
              <X size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Lock size={20} color="#2563eb" />
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Stateless Privacy Policy</h3>
            </div>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5 }}>
              ClearPay is architected around the principle of minimal data ingestion and zero persistent message storage:
            </p>
            <ul style={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.6, paddingLeft: '20px' }}>
              <li><strong>Secure Transit:</strong> When you submit a message or link, it travels over encrypted TLS/HTTPS to our backend.</li>
              <li><strong>Volatile Memory Only:</strong> The analysis runs entirely in transient memory (RAM). The server does not write message content or credentials to disk or databases.</li>
              <li><strong>Zero Credential Logging:</strong> Passwords, OTPs, CVVs, and UPI PINs are actively sanitized and filtered by our privacy logger before any internal metrics are logged.</li>
              <li><strong>Client-Side History:</strong> Your past scans remain in your browser's local storage (`localStorage`). They are never uploaded or synced to external cloud accounts.</li>
            </ul>
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button type="button" onClick={() => setActiveModal(null)} className="v8-primary-btn">I Understand</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Terms & Limitations */}
      {activeModal === 'terms' && (
        <div className="v8-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#ffffff', color: '#0f172a', borderRadius: '16px', maxWidth: '600px', width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '28px', position: 'relative' }}>
            <button type="button" onClick={() => setActiveModal(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
              <X size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Info size={20} color="#d97706" />
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Terms & Limitations</h3>
            </div>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5 }}>
              ClearPay is an automated educational tool. By using this service, you acknowledge the following boundaries:
            </p>
            <ul style={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.6, paddingLeft: '20px' }}>
              <li><strong>Guidance, Not a Guarantee:</strong> A "Low Risk" result indicates that checked heuristics found no overt red flags. It is not an absolute warranty that a sender is legitimate.</li>
              <li><strong>No Financial Execution:</strong> ClearPay does not process payments, access bank accounts, or reverse unauthorized transactions.</li>
              <li><strong>User Responsibility:</strong> Users must verify all sensitive transactions directly with their official banking application or verified toll-free customer support.</li>
              <li><strong>Emergency Protocol:</strong> If fraud has occurred, users must immediately contact the National Cybercrime Helpline 1930 and their bank's fraud department.</li>
            </ul>
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button type="button" onClick={() => setActiveModal(null)} className="v8-primary-btn">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: About & Contact */}
      {activeModal === 'about' && (
        <div className="v8-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#ffffff', color: '#0f172a', borderRadius: '16px', maxWidth: '600px', width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '28px', position: 'relative' }}>
            <button type="button" onClick={() => setActiveModal(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
              <X size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <ShieldCheck size={20} color="#2563eb" />
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>About ClearPay</h3>
            </div>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5 }}>
              ClearPay is developed as an open prototype to combat rapid escalation of digital payment fraud, UPI collect traps, and fake screenshot scams in India.
            </p>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', margin: '14px 0', fontSize: '13px', color: '#334155' }}>
              <strong>Feedback & Research Contact:</strong><br />
              Have feedback, detected a false negative, or wish to report a novel scam pattern? Use the built-in "Report Issue" button on any result screen or open an issue on our GitHub repository.
            </div>
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button type="button" onClick={() => setActiveModal(null)} className="v8-primary-btn">Close</button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
