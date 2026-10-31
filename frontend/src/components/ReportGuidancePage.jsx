import React, { useState } from 'react';
import {
  ShieldAlert,
  PhoneCall,
  ExternalLink,
  Clock,
  CheckSquare,
  Building2,
  Radio,
  Copy,
  Check,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import '../styles/reportGuide.css';

const REPORTING_PORTALS = [
  {
    id: 'helpline_1930',
    title: 'Citizen Financial Fraud Helpline 1930',
    desc: 'Managed by Indian Cyber Crime Coordination Centre (I4C), MHA. Calling 1930 initiates immediate coordination between your bank and beneficiary banks to freeze stolen funds before withdrawal.',
    link: 'tel:1930',
    linkText: 'Call 1930 (Free)',
    icon: <PhoneCall size={22} />,
    urgent: true
  },
  {
    id: 'cybercrime_portal',
    title: 'National Cyber Crime Portal',
    desc: 'Official government portal under Ministry of Home Affairs to file formal financial cybercrime complaints. Generates an official FIR acknowledgment accepted by banks and courts.',
    link: 'https://cybercrime.gov.in',
    linkText: 'Visit cybercrime.gov.in',
    icon: <ShieldAlert size={22} />
  },
  {
    id: 'chakshu_portal',
    title: 'Chakshu Portal (DoT Sanchar Saathi)',
    desc: 'Department of Telecommunications portal to report fraudulent calls, scam SMS, and WhatsApp messages. Leads to telecom-level disconnection of scammer SIM cards and IMEI blacklisting.',
    link: 'https://sancharsaathi.gov.in/sfc/',
    linkText: 'Report on Chakshu',
    icon: <Radio size={22} />
  },
  {
    id: 'rbi_ombudsman',
    title: 'RBI Complaint Management System (CMS)',
    desc: 'Escalate to the Reserve Bank of India Ombudsman if your bank does not resolve unauthorized debit complaints within 30 days under RBI limited liability circular.',
    link: 'https://cms.rbi.org.in',
    linkText: 'Escalate to RBI CMS',
    icon: <Building2 size={22} />
  }
];

const CHECKLIST_STEPS = [
  {
    step: 1,
    title: 'Freeze Your Cards & UPI Immediately',
    desc: 'Open your banking app or call your bank\'s 24x7 emergency helpline to freeze the affected debit card, credit card, and disable UPI access on that bank account.'
  },
  {
    step: 2,
    title: 'Dial 1930 within the Golden Hour (1-2 hrs)',
    desc: 'Provide your name, phone number, bank name, account number, transaction UTR number, and recipient UPI ID or account number. Note down the complaint reference number generated.'
  },
  {
    step: 3,
    title: 'Register Formal Complaint on cybercrime.gov.in',
    desc: 'Within 24 hours, visit cybercrime.gov.in and click "Report Financial Fraud". Attach transaction proofs, SMS screenshots, and bank statements to generate an official complaint PDF.'
  },
  {
    step: 4,
    title: 'Submit Dispute Form to Home Bank Branch',
    desc: 'Visit your home branch within 3 working days. Submit a written dispute letter along with the cybercrime acknowledgment to qualify for RBI zero / limited liability protection.'
  },
  {
    step: 5,
    title: 'Report Scammer Numbers on DoT Chakshu',
    desc: 'Report the scammer\'s mobile number, SMS headers, or WhatsApp profile on the DoT Chakshu portal to disable their SIM cards across India.'
  }
];

const EVIDENCE_ITEMS = [
  'Bank Account Statement showing unauthorized debit with 12-digit UTR number',
  'Date, exact time, and exact amount of each transaction',
  'UPI ID / beneficiary account number where funds were transferred',
  'Screenshots of SMS, WhatsApp, or Telegram conversations (showing sender number)',
  'Call log showing incoming and outgoing call duration with the scammer',
  'Links, website URLs, or APK file names sent by the scammer',
  'Your 1930 acknowledgment SMS or cybercrime.gov.in complaint number'
];

export default function ReportGuidancePage({ onNavigateHome, onNavigateScamGuide, onNavigateAnalyze }) {
  const [copied, setCopied] = useState(false);

  const handleCopyChecklist = () => {
    const text = [
      'CRITICAL EVIDENCE CHECKLIST FOR REPORTING FINANCIAL CYBERCRIME IN INDIA:',
      '------------------------------------------------------------------------',
      ...EVIDENCE_ITEMS.map((item, i) => `${i + 1}. ${item}`),
      '\nIMPORTANT PORTALS:',
      '- Helpline: 1930 (Citizen Financial Cyber Fraud Reporting)',
      '- Cybercrime Portal: https://cybercrime.gov.in',
      '- Chakshu SIM Disconnection: https://sancharsaathi.gov.in/sfc/',
      '- RBI Ombudsman: https://cms.rbi.org.in'
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // Fallback
    });
  };

  return (
    <div className="reportguide-page">
      {/* Top Header */}
      <header className="reportguide-header">
        <div className="reportguide-nav">
          <div className="reportguide-brand">
            <div className="reportguide-brand-logo">1930</div>
            <div>
              <span className="reportguide-brand-title">Financial Cybercrime Reporting</span>
              <span className="reportguide-brand-subtitle">Official Indian Law Enforcement & Banking Recourse</span>
            </div>
          </div>
          <button
            type="button"
            className="reportguide-back-btn"
            onClick={onNavigateHome}
          >
            <ArrowLeft size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            Back to Assistant
          </button>
        </div>
      </header>

      <main className="reportguide-container">
        {/* Emergency Call Hero Banner */}
        <div className="reportguide-emergency-card">
          <span className="reportguide-emergency-badge">Emergency Response</span>
          <h1 className="reportguide-emergency-title">Lost Money to an Online Scam? Act Immediately.</h1>
          <p className="reportguide-emergency-desc">
            The Government of India runs the <strong>Citizen Financial Cyber Fraud Reporting and Management System (CFCFRMS)</strong>.
            Calling helpline <strong>1930</strong> immediately sends real-time freeze alerts to the recipient bank, wallet, or payment aggregator before fraudsters can withdraw your funds.
          </p>
          <div className="reportguide-emergency-actions">
            <a href="tel:1930" className="reportguide-call-btn">
              <PhoneCall size={20} />
              <span>Call Helpline 1930</span>
            </a>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="reportguide-portal-btn"
            >
              <span>National Cyber Crime Portal</span>
              <ExternalLink size={16} />
            </a>
          </div>
        </div>

        {/* Golden Hour Protocol */}
        <div className="reportguide-golden-hour">
          <Clock className="reportguide-golden-icon" />
          <div>
            <h2 className="reportguide-golden-title">The "Golden Hour" Protocol (First 1 to 2 Hours)</h2>
            <p className="reportguide-golden-text">
              In financial cyber fraud, the first 1 to 2 hours are known as the Golden Hour. Cybercriminals rapidly move stolen funds across multiple "mule" bank accounts, crypto wallets, and ATM withdrawals. When you call <strong>1930</strong> within this window, the backend system automatically communicates with 250+ banks, UPI providers, and payment gateways to put an immediate lien or hold on the scammer's receiving account.
            </p>
          </div>
        </div>

        {/* 4 Reporting Channels */}
        <h2 className="reportguide-section-title">Official Reporting Portals & Helplines</h2>
        <p className="reportguide-section-subtitle">
          Use these recognized Indian government and regulatory channels to protect your funds and help law enforcement apprehend perpetrators.
        </p>

        <div className="reportguide-portals-grid">
          {REPORTING_PORTALS.map(portal => (
            <div key={portal.id} className="portal-card">
              <div>
                <div className="portal-card-header">
                  <div className="portal-icon-wrap" style={portal.urgent ? { background: '#fee2e2', color: '#dc2626' } : {}}>
                    {portal.icon}
                  </div>
                  <h3 className="portal-title">{portal.title}</h3>
                </div>
                <p className="portal-body">{portal.desc}</p>
              </div>
              <div>
                <a
                  href={portal.link}
                  target={portal.link.startsWith('http') ? '_blank' : '_self'}
                  rel={portal.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="portal-link"
                  style={portal.urgent ? { color: '#dc2626' } : {}}
                >
                  <span>{portal.linkText}</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Step-by-Step Response Checklist */}
        <div className="reportguide-checklist-card">
          <h2 className="reportguide-section-title">Step-by-Step Action Plan If Defrauded</h2>
          <p className="reportguide-section-subtitle">
            Follow this chronological checklist to maximize the probability of recovering funds and limiting liability:
          </p>

          <ol className="checklist-items">
            {CHECKLIST_STEPS.map(item => (
              <li key={item.step} className="checklist-item">
                <span className="checklist-number">{item.step}</span>
                <div>
                  <strong style={{ display: 'block', color: '#0f172a', marginBottom: '3px' }}>{item.title}</strong>
                  <span>{item.desc}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Evidence Checklist with Copy Button */}
        <div className="reportguide-checklist-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <h2 className="reportguide-section-title" style={{ marginBottom: '4px' }}>Essential Evidence Checklist</h2>
              <p className="reportguide-section-subtitle" style={{ marginBottom: 0 }}>
                Gather these documents before calling 1930 or filing at cybercrime.gov.in:
              </p>
            </div>
            <button
              type="button"
              className="reportguide-back-btn"
              onClick={handleCopyChecklist}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {copied ? <Check size={15} color="#16a34a" /> : <Copy size={15} />}
              <span>{copied ? 'Checklist Copied!' : 'Copy Evidence Checklist'}</span>
            </button>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px' }}>
            {EVIDENCE_ITEMS.map((evidence, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: '#334155' }}>
                <CheckSquare size={17} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{evidence}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Links to Scam Guide & Analyzer */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '24px' }}>
          <button
            type="button"
            className="reportguide-back-btn"
            style={{ background: '#2563eb', color: '#ffffff', borderColor: '#1d4ed8', padding: '10px 18px' }}
            onClick={onNavigateScamGuide}
          >
            <span>Browse Indian Scam Guide & Tactics</span>
            <ArrowRight size={14} style={{ display: 'inline', marginLeft: '6px' }} />
          </button>
          <button
            type="button"
            className="reportguide-back-btn"
            style={{ padding: '10px 18px' }}
            onClick={() => onNavigateAnalyze && onNavigateAnalyze()}
          >
            <span>Analyze a Suspicious Message</span>
          </button>
        </div>
      </main>
    </div>
  );
}
