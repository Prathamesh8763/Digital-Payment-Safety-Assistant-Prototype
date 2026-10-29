import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CreditCard,
  RotateCcw,
  FileText,
  CheckCircle2,
  Lock,
  RefreshCw,
  ArrowRight,
  Clock,
  Smartphone,
  Info,
  DollarSign
} from 'lucide-react';
import apiClient from '../services/apiClient';
import '../styles/subscriptionSafety.css';

const SAMPLE_INVOICES = [
  {
    title: 'Geek Squad $499 Renewal Scam',
    text: 'INVOICE #GS-89211: Thank you for renewing your Geek Squad 3-Year Total Protection. Amount: $499.00 has been debited via auto-debit. If you did not authorize this charge, call our cancellation helpline immediately at +1-888-555-0199.'
  },
  {
    title: 'Netflix Account On Hold',
    text: 'Netflix Notice: We were unable to process your monthly payment of $19.99. Your membership will be suspended within 24 hours. Click here to confirm your payment details: https://netflix-billing-renew.info/update'
  },
  {
    title: 'PayPal Unauthorized Invoice',
    text: 'PayPal: You sent a payment of $680.00 USD to Bitcoin Exchange Inc. If you did not make this transaction, call our fraud department right now at 1-800-555-0144 to dispute this charge.'
  },
  {
    title: 'Norton LifeLock Auto-Renew',
    text: 'Norton LifeLock: Your annual cybersecurity subscription renewed today for $349.99. Payment method: Auto-renewal credit card. To cancel or request a refund within 24 hours, contact customer desk at +1-877-555-0182.'
  }
];

const CANCELLATION_GUIDES = [
  {
    id: 'upi',
    title: 'UPI AutoPay (Google Pay, PhonePe, Paytm)',
    icon: <Smartphone size={22} />,
    tag: 'India Instant Payments',
    steps: [
      'Open your UPI app (Google Pay, PhonePe, Paytm, or BHIM).',
      'Go to your Profile / Settings and select "Autopay" or "Automatic Payments" (or "UPI Mandates").',
      'Locate the active mandate/merchant in the list.',
      'Tap "Pause" or "Cancel Autopay" (or "Revoke Mandate").',
      'Enter your UPI PIN to authenticate the cancellation.',
      'Take a screenshot of the cancellation confirmation for your records.'
    ],
    tip: 'Important: Uninstalling an app does NOT cancel its active UPI AutoPay mandate. You must cancel the mandate inside your UPI app.'
  },
  {
    id: 'cards',
    title: 'Card e-Mandates & Standing Instructions',
    icon: <CreditCard size={22} />,
    tag: 'Visa, Mastercard & RuPay',
    steps: [
      'Log into your NetBanking portal or Mobile Banking app.',
      'Navigate to Cards → Debit / Credit Cards → "Manage Subscriptions" or "e-Mandates" (SI Hub).',
      'Under RBI guidelines, all recurring card mandates appear in your bank portal.',
      'Find the recurring merchant and click "Cancel Mandate" or "Modify Limit".',
      'Confirm using the SMS OTP sent to your registered mobile number.',
      'The bank will immediately revoke recurring billing permissions for that merchant.'
    ],
    tip: 'RBI rules require banks to send a pre-debit notification SMS at least 24 hours before any recurring charge above ₹15,000.'
  },
  {
    id: 'playstore',
    title: 'Google Play Store Subscriptions',
    icon: <RefreshCw size={22} />,
    tag: 'Android Apps & In-App Purchases',
    steps: [
      'Open the Google Play Store app on your Android device.',
      'Tap your profile icon in the top right corner.',
      'Tap "Payments & subscriptions" → then tap "Subscriptions".',
      'Select the subscription you want to cancel.',
      'Tap "Cancel subscription" at the bottom.',
      'Follow the on-screen instructions to select a reason and confirm.'
    ],
    tip: 'Your subscription remains active until the end of the current billing cycle without renewing.'
  },
  {
    id: 'apple',
    title: 'Apple App Store Subscriptions',
    icon: <Lock size={22} />,
    tag: 'iOS, iPhone, iPad & Mac',
    steps: [
      'Open the "Settings" app on your iPhone or iPad.',
      'Tap your Name / Apple ID banner at the top of the screen.',
      'Tap "Subscriptions".',
      'Tap the active subscription you want to end.',
      'Tap "Cancel Subscription" (or "Cancel Free Trial").',
      'Confirm cancellation when prompted.'
    ],
    tip: 'If canceling a free trial, cancel at least 24 hours before the trial ends so Apple does not process the initial renewal.'
  },
  {
    id: 'paypal',
    title: 'PayPal Pre-approved & Recurring Billing',
    icon: <DollarSign size={22} />,
    tag: 'Global Digital Wallets',
    steps: [
      'Log in to your PayPal account in a web browser.',
      'Go to "Settings" (gear icon) → click "Payments".',
      'Click on "Automatic payments" or "Manage Pre-approved Payments".',
      'Select the merchant in the left-hand column.',
      'Click "Cancel" next to the Status header.',
      'Follow the prompt to verify and confirm cancellation.'
    ],
    tip: 'Canceling automatic billing terminates future recurring charges immediately.'
  }
];

export default function SubscriptionSafetyPage({ onNavigateHome, onNavigateCheckLink, onNavigateAnalyze }) {
  const [activeTab, setActiveTab] = useState('invoice'); // 'invoice' | 'directory' | 'cancellation' | 'calculator'

  // Tab 1: Invoice Scanner State
  const [invoiceText, setInvoiceText] = useState('');
  const [analyzingInvoice, setAnalyzingInvoice] = useState(false);
  const [invoiceResult, setInvoiceResult] = useState(null);
  const [invoiceError, setInvoiceError] = useState('');

  // Tab 2: Directory State
  const [directoryData, setDirectoryData] = useState({
    gateways: [],
    subscriptions: [],
    banks: []
  });
  const [dirSearch, setDirSearch] = useState('');
  const [dirCategory, setDirCategory] = useState('all'); // 'all' | 'gateways' | 'subscriptions' | 'banks'
  const [loadingDir, setLoadingDir] = useState(false);

  // Tab 4: Calculator State
  const [trialDays, setTrialDays] = useState(7);
  const [monthlyPrice, setMonthlyPrice] = useState(14.99);
  const [noticeDays, setNoticeDays] = useState(2);

  // Load directory on mount
  useEffect(() => {
    async function loadDirectory() {
      setLoadingDir(true);
      try {
        const data = await apiClient.fetchDirectory();
        if (data && data.status === 'success') {
          setDirectoryData({
            gateways: data.gateways || [],
            subscriptions: data.subscriptions || [],
            banks: data.banks || []
          });
        }
      } catch {
        // Fallback static verified entries if server offline
        setDirectoryData({
          gateways: [
            { domain: 'checkout.stripe.com', name: 'Stripe Checkout', category: 'payment_gateway' },
            { domain: 'paypal.com', name: 'PayPal', category: 'payment_gateway' },
            { domain: 'razorpay.com', name: 'Razorpay', category: 'payment_gateway' }
          ],
          subscriptions: [
            { domain: 'netflix.com', name: 'Netflix', category: 'subscription_platform' },
            { domain: 'spotify.com', name: 'Spotify', category: 'subscription_platform' },
            { domain: 'openai.com', name: 'OpenAI ChatGPT Plus', category: 'subscription_platform' },
            { domain: 'youtube.com', name: 'YouTube Premium & Memberships', category: 'subscription_platform' }
          ],
          banks: [
            { domain: 'hdfcbank.com', name: 'HDFC Bank', category: 'bank' },
            { domain: 'sbi.co.in', name: 'State Bank of India', category: 'bank' },
            { domain: 'chase.com', name: 'Chase Bank', category: 'bank' }
          ]
        });
      } finally {
        setLoadingDir(false);
      }
    }
    loadDirectory();
  }, []);

  // Handle invoice scan
  const handleAnalyzeInvoice = async (textToUse) => {
    const text = (textToUse || invoiceText).trim();
    if (!text) {
      setInvoiceError('Please enter the text of the invoice, renewal message, or email.');
      return;
    }

    setAnalyzingInvoice(true);
    setInvoiceError('');
    setInvoiceResult(null);

    try {
      const res = await apiClient.analyzeSubscription({ text });
      setInvoiceResult(res);
    } catch (err) {
      setInvoiceError(err.message || 'Unable to analyze subscription text. Please try again.');
    } finally {
      setAnalyzingInvoice(false);
    }
  };

  // Directory Filter
  const filteredDirectory = () => {
    let items = [];
    if (dirCategory === 'all' || dirCategory === 'gateways') {
      items.push(...directoryData.gateways);
    }
    if (dirCategory === 'all' || dirCategory === 'subscriptions') {
      items.push(...directoryData.subscriptions);
    }
    if (dirCategory === 'all' || dirCategory === 'banks') {
      items.push(...directoryData.banks);
    }

    if (!dirSearch.trim()) return items;

    const query = dirSearch.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.domain.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
  };

  // Calculator calculations
  const yearlyCost = (Number(monthlyPrice) * 12).toFixed(2);
  const cancelDeadlineDay = Math.max(1, Number(trialDays) - Number(noticeDays));

  return (
    <div className="subsafety-page">
      {/* Top Header */}
      <header className="subsafety-header">
        <nav className="subsafety-nav">
          <a
            href="/"
            className="subsafety-brand"
            onClick={(e) => {
              e.preventDefault();
              onNavigateHome();
            }}
          >
            <div className="subsafety-brand-logo">C</div>
            <div>
              <span className="subsafety-brand-title">ClearPay</span>
              <span className="subsafety-brand-subtitle">Subscription Safety Center</span>
            </div>
          </a>

          <button
            type="button"
            onClick={onNavigateHome}
            className="subsafety-back-btn"
          >
            ← Back to home
          </button>
        </nav>
      </header>

      <main className="subsafety-container">
        {/* Hero Section */}
        <div className="subsafety-hero">
          <div className="subsafety-eyebrow">RECURRING PAYMENT PROTECTION</div>
          <h1 className="subsafety-title">Subscription & Recurring Payment Safety Center</h1>
          <p className="subsafety-subtitle">
            Verify legitimate checkout portals, detect fake auto-renewal invoice scams, manage UPI/card auto-debits, and calculate hidden recurring costs before entering billing information.
          </p>

          <div className="subsafety-assurance-banner">
            <ShieldCheck size={20} color="#2563eb" />
            <span>
              <strong>Zero credential exposure:</strong> We never ask for bank accounts, card numbers, or passwords. All tools evaluate public domain structures and message syntax safely.
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="subsafety-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'invoice'}
            className={`subsafety-tab-btn ${activeTab === 'invoice' ? 'active' : ''}`}
            onClick={() => setActiveTab('invoice')}
          >
            <FileText size={18} />
            Fake Invoice & Renewal Scanner
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'directory'}
            className={`subsafety-tab-btn ${activeTab === 'directory' ? 'active' : ''}`}
            onClick={() => setActiveTab('directory')}
          >
            <CheckCircle2 size={18} />
            Verified Merchant Directory
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'cancellation'}
            className={`subsafety-tab-btn ${activeTab === 'cancellation' ? 'active' : ''}`}
            onClick={() => setActiveTab('cancellation')}
          >
            <RotateCcw size={18} />
            Auto-Debit Cancellation Guide
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'calculator'}
            className={`subsafety-tab-btn ${activeTab === 'calculator' ? 'active' : ''}`}
            onClick={() => setActiveTab('calculator')}
          >
            <Clock size={18} />
            Free Trial Trap Calculator
          </button>
        </div>

        {/* TAB 1: Fake Invoice & Renewal Scanner */}
        {activeTab === 'invoice' && (
          <section className="subsafety-card" aria-label="Fake Invoice Scanner">
            <h2 className="subsafety-card-title">Scam Renewal & Fake Invoice Detector</h2>
            <p className="subsafety-card-subtitle">
              Scammers frequently send fake invoices for Geek Squad, Norton, PayPal, or Netflix claiming hundreds of dollars were debited, baiting victims into calling fake call-center numbers. Paste any renewal email or SMS to analyze.
            </p>

            <div className="invoice-sample-pills">
              <span className="sample-label">Try an example:</span>
              {SAMPLE_INVOICES.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="sample-pill-btn"
                  onClick={() => {
                    setInvoiceText(sample.text);
                    handleAnalyzeInvoice(sample.text);
                  }}
                >
                  {sample.title}
                </button>
              ))}
            </div>

            <textarea
              className="invoice-textarea"
              placeholder="Paste email, SMS, or message text regarding a subscription, renewal, or unexpected invoice..."
              value={invoiceText}
              onChange={(e) => setInvoiceText(e.target.value)}
              disabled={analyzingInvoice}
            />

            {invoiceError && (
              <div style={{ color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>
                {invoiceError}
              </div>
            )}

            <button
              type="button"
              className="invoice-submit-btn"
              onClick={() => handleAnalyzeInvoice()}
              disabled={analyzingInvoice || !invoiceText.trim()}
            >
              {analyzingInvoice ? (
                <>Analyzing invoice details...</>
              ) : (
                <>
                  <ShieldCheck size={18} /> Scan Subscription Message
                </>
              )}
            </button>

            {/* Analysis Result */}
            {invoiceResult && (
              <div
                className={`invoice-result-box ${
                  invoiceResult.threat_level === 'scam_impersonation'
                    ? 'danger'
                    : invoiceResult.threat_level === 'suspicious_renewal'
                    ? 'warning'
                    : 'safe'
                }`}
              >
                <div className="invoice-result-header">
                  <div>
                    <span
                      className={`invoice-threat-badge ${
                        invoiceResult.threat_level === 'scam_impersonation'
                          ? 'danger'
                          : invoiceResult.threat_level === 'suspicious_renewal'
                          ? 'warning'
                          : 'safe'
                      }`}
                    >
                      {invoiceResult.threat_level === 'scam_impersonation'
                        ? '🚨 FAKE INVOICE SCAM DETECTED'
                        : invoiceResult.threat_level === 'suspicious_renewal'
                        ? '⚠️ SUSPICIOUS RENEWAL PATTERN'
                        : 'NO IMMEDIATE SCAM INDICATORS DETECTED'}
                    </span>
                    <h3 style={{ margin: '8px 0 4px', fontSize: '17px', color: '#0f172a' }}>
                      {invoiceResult.platform_identified
                        ? `Impersonating / Referencing: ${invoiceResult.platform_identified}`
                        : 'Unspecified Subscription Claim'}
                    </h3>
                  </div>

                  <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                    Confidence: <strong>{invoiceResult.confidence}</strong>
                  </span>
                </div>

                <p style={{ margin: '0 0 12px', fontSize: '14.5px', color: '#334155' }}>
                  {invoiceResult.summary}
                </p>

                {invoiceResult.warning_signals && invoiceResult.warning_signals.length > 0 && (
                  <div>
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                      Deceptive Signals & Indicators Found:
                    </strong>
                    <ul className="signals-list">
                      {invoiceResult.warning_signals.map((signal, idx) => (
                        <li key={idx}>{signal}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {invoiceResult.actionable_steps && (
                  <div className="recommendations-box">
                    <strong style={{ fontSize: '13.5px', color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                      What you should do:
                    </strong>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13.5px', color: '#475569', lineHeight: 1.55 }}>
                      {invoiceResult.actionable_steps.map((step, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {onNavigateAnalyze && (
                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => onNavigateAnalyze(invoiceText)}
                      className="directory-action-link"
                      style={{ fontSize: '13.5px', color: '#2563eb', fontWeight: 600 }}
                    >
                      <span>Analyze full text with Deep Safety Analyzer</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: Verified Merchant Directory */}
        {activeTab === 'directory' && (
          <section className="subsafety-card" aria-label="Verified Directory">
            <h2 className="subsafety-card-title">Verified Financial & Subscription Directory</h2>
            <p className="subsafety-card-subtitle">
              Browse confirmed official domains for 70+ payment gateways, subscription platforms, and financial institutions. Compare any suspicious link with the verified official addresses below.
            </p>

            <div className="directory-controls">
              <input
                type="text"
                className="directory-search-input"
                placeholder="Search by brand name or domain (e.g. Netflix, Stripe, PayPal)..."
                value={dirSearch}
                onChange={(e) => setDirSearch(e.target.value)}
              />

              <div className="directory-filter-pills">
                <button
                  type="button"
                  className={`filter-btn ${dirCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setDirCategory('all')}
                >
                  All ({directoryData.gateways.length + directoryData.subscriptions.length + directoryData.banks.length})
                </button>
                <button
                  type="button"
                  className={`filter-btn ${dirCategory === 'gateways' ? 'active' : ''}`}
                  onClick={() => setDirCategory('gateways')}
                >
                  Gateways ({directoryData.gateways.length})
                </button>
                <button
                  type="button"
                  className={`filter-btn ${dirCategory === 'subscriptions' ? 'active' : ''}`}
                  onClick={() => setDirCategory('subscriptions')}
                >
                  Subscriptions ({directoryData.subscriptions.length})
                </button>
                <button
                  type="button"
                  className={`filter-btn ${dirCategory === 'banks' ? 'active' : ''}`}
                  onClick={() => setDirCategory('banks')}
                >
                  Banks ({directoryData.banks.length})
                </button>
              </div>
            </div>

            {loadingDir ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                Loading verified directory...
              </div>
            ) : (
              <div className="directory-grid">
                {filteredDirectory().map((item, idx) => (
                  <div key={idx} className="directory-card">
                    <div>
                      <div className="directory-card-top">
                        <span className="directory-card-brand">{item.name}</span>
                        <span
                          className={`directory-badge ${
                            item.category === 'payment_gateway'
                              ? 'gateway'
                              : item.category === 'subscription_platform'
                              ? 'subscription'
                              : 'bank'
                          }`}
                        >
                          {item.category === 'payment_gateway'
                            ? 'Gateway'
                            : item.category === 'subscription_platform'
                            ? 'Subscription'
                            : 'Bank'}
                        </span>
                      </div>
                      <div className="directory-domain">https://{item.domain}</div>
                    </div>

                    <button
                      type="button"
                      className="directory-action-link"
                      onClick={() => {
                        if (onNavigateCheckLink) {
                          onNavigateCheckLink();
                        }
                      }}
                    >
                      <span>Inspect with Link Checker</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: Auto-Debit Cancellation Guide */}
        {activeTab === 'cancellation' && (
          <section className="subsafety-card" aria-label="Auto-Debit Cancellation Guide">
            <h2 className="subsafety-card-title">How to Cancel Auto-Debits & Recurring Mandates</h2>
            <p className="subsafety-card-subtitle">
              Many subscription traps exploit the misconception that deleting an app cancels your subscription. Step-by-step instructions to cancel underlying bank mandates and store subscriptions.
            </p>

            <div className="mandate-grid">
              {CANCELLATION_GUIDES.map((guide) => (
                <div key={guide.id} className="mandate-card">
                  <div className="mandate-card-header">
                    <div className="mandate-icon-wrap">{guide.icon}</div>
                    <div>
                      <h3 className="mandate-title">{guide.title}</h3>
                      <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600 }}>
                        {guide.tag}
                      </span>
                    </div>
                  </div>

                  <ol className="mandate-steps">
                    {guide.steps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>

                  <div className="mandate-tip-box">
                    <Info size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                    {guide.tip}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 4: Free Trial Trap Calculator */}
        {activeTab === 'calculator' && (
          <section className="subsafety-card" aria-label="Trial Trap Calculator">
            <h2 className="subsafety-card-title">Free Trial Trap & Recurring Cost Calculator</h2>
            <p className="subsafety-card-subtitle">
              Many predatory services offer "7-Day Free Trials" that automatically renew into high monthly or annual charges without prior authorization alerts. Plan your safety buffer.
            </p>

            <div className="calc-grid">
              <div>
                <div className="calc-input-group">
                  <label className="calc-label">Free Trial Length (Days):</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    className="calc-input"
                    value={trialDays}
                    onChange={(e) => setTrialDays(e.target.value)}
                  />
                </div>

                <div className="calc-input-group">
                  <label className="calc-label">Monthly Renewal Charge ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="calc-input"
                    value={monthlyPrice}
                    onChange={(e) => setMonthlyPrice(e.target.value)}
                  />
                </div>

                <div className="calc-input-group">
                  <label className="calc-label">Safety Buffer for Cancellation (Days Before Trial Ends):</label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    className="calc-input"
                    value={noticeDays}
                    onChange={(e) => setNoticeDays(e.target.value)}
                  />
                  <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Apple & Google require cancellations at least 24 hours prior to prevent next-cycle charges.
                  </span>
                </div>
              </div>

              <div className="calc-summary-card">
                <div>
                  <div className="calc-stat-block">
                    <div className="calc-stat-label">Cancellation Deadline</div>
                    <div className="calc-stat-val" style={{ color: '#2563eb' }}>
                      Day {cancelDeadlineDay}
                    </div>
                    <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                      Set a calendar alert on Day {cancelDeadlineDay} to decide whether to retain or cancel.
                    </span>
                  </div>

                  <div className="calc-stat-block">
                    <div className="calc-stat-label">Projected Yearly Commitment</div>
                    <div className="calc-stat-val" style={{ color: '#0f172a' }}>
                      ${yearlyCost} / year
                    </div>
                    <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                      Assuming auto-renewal occurs after the {trialDays}-day trial period.
                    </span>
                  </div>
                </div>

                <div className="calc-trap-checklist">
                  <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                    🛡️ Trial Safety Best Practices:
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#475569', lineHeight: 1.5 }}>
                    <li>Take a screenshot of the cancellation policy before entering your card details.</li>
                    <li>Use a virtual card with a strict $1 limit if your bank supports it.</li>
                    <li>Immediately cancel auto-renew right after signing up—most services let you keep trial access until expiration.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
