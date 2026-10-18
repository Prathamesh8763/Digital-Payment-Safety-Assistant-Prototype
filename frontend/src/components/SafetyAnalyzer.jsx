import React, { useState } from 'react';
import ResultDisplay from './ResultDisplay';
import GuidedCheck from './GuidedCheck';
import HistoryDrawer from './HistoryDrawer';
import Alert from './ui/Alert';
import apiClient from '../services/apiClient';
import '../styles/analyze.css';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  ShieldAlert, 
  ArrowUpRight, 
  ArrowLeftRight, 
  Link as LinkIcon, 
  MessageSquareText, 
  HelpCircle, 
  History as HistoryIcon,
  Globe,
  Compass
} from 'lucide-react';

const HISTORY_STORAGE_KEY = 'payment_safety_assistant_history_v2';

function loadStoredHistory() {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

const MESSAGE_EXAMPLES = [
  {
    label: "Account blocked",
    chipClass: "v6-chip-blue",
    text: "Your UPI account will be blocked today. Verify now to keep your account active. Link: https://secure-upi-help.example"
  },
  {
    label: "Unexpected UPI request",
    chipClass: "v6-chip-yellow",
    text: "A buyer on OLX sent me a collect request and QR code: 'Accept this collect request and enter your UPI PIN to receive ₹3,500 advance payment for the sofa.'"
  },
  {
    label: "Urgent payment demand",
    chipClass: "v6-chip-red",
    text: "Immediate action required! Electricity connection will be cut off tonight at 9:30 PM due to pending bill. Call 9876543210 immediately to settle charges."
  }
];

const LINK_EXAMPLES = [
  {
    label: "Fake bank link",
    chipClass: "v6-chip-red",
    url: "https://fake-bank-verify.example/confirm"
  },
  {
    label: "Shortened link",
    chipClass: "v6-chip-yellow",
    url: "https://bit.ly/bank-urgent-update"
  },
  {
    label: "Official bank link",
    chipClass: "v6-chip-blue",
    url: "https://onlinesbi.sbi/portal"
  },
  {
    label: "APK download link",
    chipClass: "v6-chip-red",
    url: "http://sbi-kyc-verify.top/login.apk"
  }
];

export default function SafetyAnalyzer({ onNavigateHome, onNavigateGuided, initialText = '', initialTab = 'message' }) {
  const [activeTab, setActiveTab] = useState(initialTab === 'url' ? 'link' : (initialTab || 'message')); // 'message' | 'link' | 'guided' | 'history'
  const [language, setLanguage] = useState('en');
  const [messageText, setMessageText] = useState(initialText || '');
  const [urlInput, setUrlInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState(loadStoredHistory);
  const [isExample, setIsExample] = useState(false);

  const saveToHistory = (assessment, type, snippet) => {
    try {
      const newRecord = {
        id: 'hist_' + Date.now(),
        timestamp: new Date().toISOString(),
        type: type,
        risk_level: assessment.risk_level,
        risk_score: assessment.risk_score,
        summary: assessment.summary,
        sample_snippet: snippet ? snippet.slice(0, 120) + (snippet.length > 120 ? '...' : '') : undefined,
        assessment: assessment
      };
      const updated = [newRecord, ...history].slice(0, 30);
      setHistory(updated);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Storage unavailable or blocked
    }
  };

  const handleAnalyzeMessage = async (e) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await apiClient.checkText({ text: messageText.trim(), language });
      setResult(data);
      saveToHistory(data, 'Message Analysis', messageText.trim());
    } catch (err) {
      setError(err.message || 'An error occurred while connecting to the safety assistant service.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeUrl = async (e) => {
    if (e) e.preventDefault();
    if (!urlInput.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await apiClient.checkUrl({ url: urlInput.trim(), language });
      setResult(data);
      saveToHistory(data, 'Link Inspection', urlInput.trim());
    } catch (err) {
      setError(err.message || 'An error occurred while inspecting the link.');
    } finally {
      setLoading(false);
    }
  };

  const handleInspectDetectedUrl = async (targetUrl) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.checkUrl({ url: targetUrl, language });
      setResult(data);
      saveToHistory(data, 'Link Inspection', targetUrl);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Failed to inspect link.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeGuided = async (payload) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await apiClient.checkGuided({ ...payload, language });
      setResult(data);
      saveToHistory(data, 'Guided Check', `Claim: ${payload.sender_claim}, Action: ${payload.requested_action}`);
    } catch (err) {
      setError(err.message || 'An error occurred during guided check.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setIsExample(false);
  };

  // Preview normalized URL
  const getNormalizedPreview = (input) => {
    const trimmed = input.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
  };

  return (
    <div className="v6-analyze-page">
      {/* Top Header */}
      <header className="v6-header">
        <div className="v6-header-inner">
          <div className="v6-brand-logo" onClick={onNavigateHome} role="button" tabIndex={0} aria-label="Go to ClearPay home">
            <div className="v6-brand-icon">C</div>
            <div className="v6-brand-text">
              <span className="v6-brand-name">ClearPay</span>
              <span className="v6-brand-tag">Safety Assistant</span>
            </div>
          </div>

          <nav className="v6-header-nav" aria-label="Main Navigation">
            <a href="#how-it-works" className="v6-nav-link" onClick={(e) => { e.preventDefault(); if (onNavigateHome) onNavigateHome(); }}>
              How it works
            </a>
            <a href="#learn" className="v6-nav-link" onClick={(e) => { e.preventDefault(); if (onNavigateHome) onNavigateHome(); }}>
              Learn
            </a>
            <a href="#privacy" className="v6-nav-link" onClick={(e) => { e.preventDefault(); if (onNavigateHome) onNavigateHome(); }}>
              Privacy
            </a>

            {/* Language Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#f8fafc', padding: '0.25rem 0.6rem', borderRadius: '20px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}>
              <Globe size={14} style={{ color: '#2563eb' }} aria-hidden="true" />
              <select
                id="header-lang-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontWeight: 600, color: '#2563eb', outline: 'none', cursor: 'pointer' }}
                aria-label="Select interface language"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="hinglish">Hinglish</option>
              </select>
            </div>

            {result ? (
              <button 
                type="button" 
                onClick={handleReset} 
                className="v6-back-btn" 
                aria-label="Back to Analyze"
              >
                <ArrowLeft size={14} aria-hidden="true" />
                <span>Back to Analyze</span>
              </button>
            ) : (
              onNavigateHome && (
                <button type="button" onClick={onNavigateHome} className="v6-back-btn" aria-label="Back to home page">
                  <ArrowLeft size={14} aria-hidden="true" />
                  <span>Back to home</span>
                </button>
              )
            )}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      {result ? (
        <main className="v8-result-main" style={{ width: '100%', minHeight: 'calc(100vh - 72px)' }}>
          {error && (
            <div style={{ maxWidth: '1200px', margin: '1rem auto 0', padding: '0 1.5rem' }}>
              <Alert variant="error" onDismiss={() => setError(null)}>
                {error}
              </Alert>
            </div>
          )}
          <ResultDisplay 
            result={result} 
            onReset={handleReset} 
            onInspectUrl={handleInspectDetectedUrl} 
            reviewedText={activeTab === 'link' ? urlInput : messageText}
            isExample={isExample}
          />
          <footer className="v6-footer">
            <div className="v6-footer-inner" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
              <div className="v6-footer-brand">
                <strong>ClearPay</strong>
                <span>· Educational guidance only · No scam checker can promise 100% accuracy.</span>
              </div>
              <div className="v6-footer-links">
                <a href="#privacy" onClick={(e) => { e.preventDefault(); alert("Privacy: ClearPay never collects or stores passwords, PINs, or credentials."); }}>Privacy</a>
                <a href="#help" onClick={(e) => { e.preventDefault(); alert("Help & National Helpline: Dial 1930 to report cyber fraud in India."); }}>Help & FAQ</a>
              </div>
            </div>
          </footer>
        </main>
      ) : (
        <main className="v6-content-container">
          {/* Breadcrumb Navigation */}
          <nav className="v6-breadcrumbs" aria-label="Breadcrumb">
            <a href="/" onClick={(e) => { e.preventDefault(); if (onNavigateHome) onNavigateHome(); }}>Home</a>
            <span>/</span>
            <span style={{ color: '#0f172a', fontWeight: 500 }}>
              {activeTab === 'link' ? 'Inspect a link' : 'Analyze a message'}
            </span>
          </nav>

          {/* Eyebrow & Headline */}
          <div className="v6-eyebrow">
            {activeTab === 'link' ? 'LINK SAFETY CHECK' : 'MESSAGE SAFETY CHECK'}
          </div>
          <h1 className="v6-page-headline">
            {activeTab === 'link' ? 'Inspect a link before you click.' : 'Check a message before you act.'}
          </h1>
          <p className="v6-page-subhead">
            {activeTab === 'link' 
              ? 'Paste an unfamiliar web address or domain name. We will inspect its structure and verified financial directories without visiting the link.'
              : 'Paste a suspicious SMS, chat, email, or payment request. We\'ll help you spot common warning signs and think through a safer next step.'}
          </p>

          {/* Privacy Reassurance Banner */}
          <div className="v6-privacy-banner" role="region" aria-label="Privacy guarantee">
            <div className="v6-privacy-content">
              <div className="v6-privacy-icon">
                <Check size={14} strokeWidth={3} aria-hidden="true" />
              </div>
              <div>
                <div className="v6-privacy-title">Your privacy comes first</div>
                <div className="v6-privacy-desc">
                  Remove names, phone numbers, account details, and other personal information before pasting. We never request or store OTPs, PINs, or passwords.
                </div>
              </div>
            </div>
            <a href="#privacy" className="v6-privacy-link" onClick={(e) => { e.preventDefault(); alert("ClearPay Privacy Guarantee: All safety analyses run without storing your credentials or personal information. Never paste actual passwords or PINs."); }}>
              <span>Privacy details</span>
              <ArrowRight size={14} aria-hidden="true" />
            </a>
          </div>

          {error && (
            <div style={{ marginBottom: '1.5rem' }}>
              <Alert variant="error" onDismiss={() => setError(null)}>
                {error}
              </Alert>
            </div>
          )}

          <div className="v6-main-grid">
            {/* Left Column: Input Form Card */}
            <div className="v6-input-card">
              <div className="v6-card-header">
                <h2 className="v6-card-title">
                  {activeTab === 'message' && 'What message would you like to check?'}
                  {activeTab === 'link' && 'What link would you like to inspect?'}
                  {activeTab === 'guided' && 'Step-by-Step Guided Situation Check'}
                  {activeTab === 'history' && 'Local Analysis History'}
                </h2>
                <p className="v6-card-sub">
                  {activeTab === 'message' && 'Paste the message exactly as received, after removing personal details.'}
                  {activeTab === 'link' && 'Enter the full web address or domain to check against safety rules and directories.'}
                  {activeTab === 'guided' && 'Answer simple questions to evaluate unfamiliar calls or payment demands.'}
                  {activeTab === 'history' && 'Locally saved records from your current browser session.'}
                </p>
              </div>

              {/* Mode Selection Tabs */}
              <div className="v6-mode-tabs" role="tablist" aria-label="Analysis input mode">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'message'}
                  className={`v6-mode-tab ${activeTab === 'message' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('message'); setError(null); }}
                >
                  <MessageSquareText size={15} aria-hidden="true" />
                  <span>Message</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'link'}
                  className={`v6-mode-tab ${activeTab === 'link' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('link'); setError(null); }}
                >
                  <LinkIcon size={15} aria-hidden="true" />
                  <span>Link / URL</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'guided'}
                  className={`v6-mode-tab ${activeTab === 'guided' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('guided'); setError(null); }}
                >
                  <HelpCircle size={15} aria-hidden="true" />
                  <span>"I'm Not Sure"</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'history'}
                  className={`v6-mode-tab ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('history'); setError(null); }}
                >
                  <HistoryIcon size={15} aria-hidden="true" />
                  <span>History ({history.length})</span>
                </button>
              </div>

              {/* Mode 1: Message Text Mode */}
              {activeTab === 'message' && (
                <form onSubmit={handleAnalyzeMessage}>
                  <label htmlFor="v6-message-input" className="v6-input-label">
                    Message text
                  </label>
                  <div className="v6-textarea-wrap">
                    <textarea
                      id="v6-message-input"
                      className="v6-textarea"
                      placeholder={'Paste the suspicious message here...\n\nFor example: "Your bank account will be blocked today. Verify immediately to avoid losing access."'}
                      value={messageText}
                      maxLength={2000}
                      onChange={(e) => { setMessageText(e.target.value); setIsExample(false); }}
                      rows={6}
                      required
                    />
                    <div className="v6-char-counter">
                      {messageText.length} / 2,000 characters
                    </div>
                  </div>

                  {/* Example chips */}
                  <div className="v6-examples-wrap">
                    <div className="v6-examples-label">Or start with a common example</div>
                    <div className="v6-chips-row">
                      {MESSAGE_EXAMPLES.map((ex, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`v6-chip ${ex.chipClass}`}
                          onClick={() => { setMessageText(ex.text); setIsExample(true); setError(null); }}
                        >
                          {ex.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Credential warning note */}
                  <div className="v6-credential-warning">
                    <div className="v6-warning-pill">!</div>
                    <span>Never paste an OTP, UPI PIN, password, card number, or bank login.</span>
                  </div>

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    className="v6-submit-btn"
                    disabled={messageText.trim().length < 3 || loading}
                  >
                    <span>{loading ? 'Analyzing situation...' : 'Analyze message'}</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                  <div className="v6-submit-note">
                    Your message is used to provide this analysis. Don't submit confidential information.
                  </div>
                </form>
              )}

              {/* Mode 2: Direct Link Check Mode (V6 Core P0) */}
              {activeTab === 'link' && (
                <form onSubmit={handleAnalyzeUrl}>
                  <label htmlFor="v6-link-input" className="v6-input-label">
                    Web address or domain
                  </label>
                  <div className="v6-textarea-wrap" style={{ paddingBottom: '1.25rem' }}>
                    <input
                      id="v6-link-input"
                      type="text"
                      className="v6-textarea"
                      style={{ minHeight: 'auto', padding: '0.85rem 1rem' }}
                      placeholder="e.g. https://fake-bank-verify.example/confirm or secure-pay.example"
                      value={urlInput}
                      maxLength={2000}
                      onChange={(e) => { setUrlInput(e.target.value); setIsExample(false); }}
                      required
                    />
                    <div className="v6-char-counter">
                      {urlInput.length} / 2,000 characters
                    </div>
                  </div>

                  {/* Normalization Preview */}
                  {urlInput.trim() && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#475569', background: '#f8fafc', padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <strong>Safe Normalization Preview:</strong> <code>{getNormalizedPreview(urlInput)}</code>
                    </div>
                  )}

                  {/* Link example chips */}
                  <div className="v6-examples-wrap">
                    <div className="v6-examples-label">Or test with a sample link</div>
                    <div className="v6-chips-row">
                      {LINK_EXAMPLES.map((ex, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`v6-chip ${ex.chipClass}`}
                          onClick={() => { setUrlInput(ex.url); setIsExample(true); setError(null); }}
                        >
                          {ex.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reassurance */}
                  <div className="v6-credential-warning">
                    <div className="v6-warning-pill">!</div>
                    <span>Checking a link does not open or navigate to it. Inspection is safe and isolated.</span>
                  </div>

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    className="v6-submit-btn"
                    disabled={urlInput.trim().length < 3 || loading}
                  >
                    <span>{loading ? 'Inspecting link...' : 'Inspect link'}</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                  <div className="v6-submit-note">
                    Analysis is private and takes only a few seconds. Unknown links remain unverified.
                  </div>
                </form>
              )}

              {/* Mode 3: Guided Questionnaire Mode (P1) */}
              {activeTab === 'guided' && (
                <div>
                  {onNavigateGuided && (
                    <div style={{
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '12px',
                      padding: '0.85rem 1rem',
                      marginBottom: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Compass size={18} style={{ color: '#2563eb' }} aria-hidden="true" />
                        <span style={{ fontSize: '0.86rem', color: '#1e40af', fontWeight: 600 }}>
                          Prefer visual scenario cards?
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={onNavigateGuided}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #93c5fd',
                          borderRadius: '9999px',
                          color: '#2563eb',
                          padding: '0.35rem 0.85rem',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <span>Open Guided Help Workspace</span>
                        <ArrowRight size={13} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                  <GuidedCheck onAnalyze={handleAnalyzeGuided} loading={loading} />
                </div>
              )}

              {/* Mode 4: Local History Mode (P1) */}
              {activeTab === 'history' && (
                <HistoryDrawer
                  history={history}
                  onDeleteItem={(id) => {
                    const updated = history.filter(h => h.id !== id);
                    setHistory(updated);
                    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
                  }}
                  onClearAll={() => {
                    setHistory([]);
                    localStorage.removeItem(HISTORY_STORAGE_KEY);
                  }}
                  onSelectHistoryItem={(item) => setResult(item.assessment)}
                  onClose={() => setActiveTab('message')}
                />
              )}
            </div>

            {/* Right Column: Guides & Signals */}
            <div className="v6-right-col">
              {/* Card 1: A Quick Guide */}
              <div className="v6-guide-card">
                <h3 className="v6-guide-title">A quick guide</h3>
                <p className="v6-guide-sub">You stay in control at every step.</p>

                <div className="v6-step-item">
                  <div className="v6-step-num v6-step-num-1">1</div>
                  <div className="v6-step-body">
                    <h4>Paste the message</h4>
                    <p>Remove names, numbers, and private details first.</p>
                  </div>
                </div>

                <div className="v6-step-divider" />

                <div className="v6-step-item">
                  <div className="v6-step-num v6-step-num-2">2</div>
                  <div className="v6-step-body">
                    <h4>Review the warning signs</h4>
                    <p>We'll look for common patterns like pressure, requests for secrets, or suspicious payment instructions.</p>
                  </div>
                </div>

                <div className="v6-step-divider" />

                <div className="v6-step-item">
                  <div className="v6-step-num v6-step-num-3">3</div>
                  <div className="v6-step-body">
                    <h4>Verify independently</h4>
                    <p>Use a trusted official app, website, or number—not details supplied in the message.</p>
                  </div>
                </div>
              </div>

              {/* Card 2: What We Look For (Dark Navy Card) */}
              <div className="v6-dark-card">
                <h3 className="v6-dark-title">What we look for</h3>
                <p className="v6-dark-sub">Common warning signs—not a verdict.</p>

                <ul className="v6-dark-list">
                  <li className="v6-dark-item">
                    <div className="v6-dark-item-icon">
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </div>
                    <span>Urgency or threats</span>
                  </li>
                  <li className="v6-dark-item">
                    <div className="v6-dark-item-icon">
                      <ShieldAlert size={14} aria-hidden="true" />
                    </div>
                    <span>Requests for OTPs or PINs</span>
                  </li>
                  <li className="v6-dark-item">
                    <div className="v6-dark-item-icon">
                      <ArrowLeftRight size={14} aria-hidden="true" />
                    </div>
                    <span>Unusual payment instructions</span>
                  </li>
                  <li className="v6-dark-item">
                    <div className="v6-dark-item-icon">
                      <LinkIcon size={14} aria-hidden="true" />
                    </div>
                    <span>Suspicious links or claims</span>
                  </li>
                </ul>

                <div className="v6-dark-note">
                  Results can miss scams or flag legitimate messages. Always verify through official channels.
                </div>
              </div>
            </div>
          </div>

        {/* Lower Section: What makes a message suspicious? */}
        <section className="v6-suspicious-section" aria-labelledby="suspicious-patterns-title">
          <div className="v6-section-eyebrow">BETTER TO PAUSE THAN GUESS</div>
          <h2 id="suspicious-patterns-title" className="v6-section-title">
            What makes a message suspicious?
          </h2>
          <p className="v6-section-sub">
            Look for patterns, not just a single word. Scams often combine pressure with an unusual request.
          </p>

          <div className="v6-three-cards-grid">
            <div className="v6-feature-card">
              <div className="v6-card-accent-bar v6-card-accent-orange" />
              <h3 className="v6-feature-title">Pressure to act now</h3>
              <p className="v6-feature-text">
                "Immediately", "today only", or threats of account closure designed to stop you thinking clearly. Legitimate banks give you reasonable time to respond.
              </p>
            </div>

            <div className="v6-feature-card">
              <div className="v6-card-accent-bar v6-card-accent-red" />
              <h3 className="v6-feature-title">Secrets or credentials</h3>
              <p className="v6-feature-text">
                Requests for OTPs, UPI PINs, passwords, or remote screen sharing. No genuine bank or service will ever ask for secret credentials.
              </p>
            </div>

            <div className="v6-feature-card">
              <div className="v6-card-accent-bar v6-card-accent-blue" />
              <h3 className="v6-feature-title">Unusual payment steps</h3>
              <p className="v6-feature-text">
                Unexpected collect requests, QR codes to receive money, or unfamiliar APK file links. A QR code or UPI PIN only sends money out.
              </p>
            </div>
          </div>
        </section>

        {/* Blue Guidance / Disclaimer Banner */}
        <div className="v6-guidance-banner" role="status">
          <div className="v6-guidance-icon">i</div>
          <div>
            <div className="v6-guidance-title">
              Remember: an analysis is guidance, not a guarantee.
            </div>
            <div className="v6-guidance-text">
              If money or account access is at risk, stop and contact your bank or payment provider through a verified official channel.
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="v6-footer">
          <div className="v6-footer-inner">
            <div className="v6-footer-brand">
              <strong>ClearPay</strong>
              <span>· Educational guidance only · No scam checker can promise 100% accuracy.</span>
            </div>
            <div className="v6-footer-links">
              <a href="#privacy" onClick={(e) => { e.preventDefault(); alert("Privacy: ClearPay never collects or stores passwords, PINs, or credentials."); }}>Privacy</a>
              <a href="#help" onClick={(e) => { e.preventDefault(); alert("Help & National Helpline: Dial 1930 to report cyber fraud in India."); }}>Help & FAQ</a>
            </div>
          </div>
        </footer>
      </main>
      )}
    </div>
  );
}
