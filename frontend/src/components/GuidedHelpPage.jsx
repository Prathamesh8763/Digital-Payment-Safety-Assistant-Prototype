import React, { useState } from 'react';
import {
  Lock,
  AlertTriangle,
  CreditCard,
  Link as LinkIcon,
  Compass,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Copy,
  Check,
  ExternalLink,
  Info,
  X
} from 'lucide-react';
import {
  SCENARIOS,
  QUESTIONS,
  GUIDANCES,
  generateChecklistText
} from '../utils/guidedHelpData';
import '../styles/guidedHelp.css';

export default function GuidedHelpPage({
  onNavigateHome,
  onNavigateAnalyze,
  initialScenarioId = null
}) {
  const [currentScenario, setCurrentScenario] = useState(
    initialScenarioId ? SCENARIOS.find((s) => s.id === initialScenarioId) || null : null
  );
  const [currentQuestionId, setCurrentQuestionId] = useState(
    initialScenarioId && QUESTIONS[`q_${initialScenarioId}`]
      ? `q_${initialScenarioId}`
      : null
  );
  const [currentGuidance, setCurrentGuidance] = useState(
    initialScenarioId === 'something_else' ? GUIDANCES.guidance_general : null
  );
  const [historyTrail, setHistoryTrail] = useState([]);
  const [copied, setCopied] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Handle Scenario Card Click
  const handleSelectScenario = (scenario) => {
    setCurrentScenario(scenario);
    setHistoryTrail([]);
    if (!scenario.initialQuestionId) {
      // Something else / general checklist
      setCurrentGuidance(GUIDANCES.guidance_general);
      setCurrentQuestionId(null);
    } else {
      setCurrentQuestionId(scenario.initialQuestionId);
      setCurrentGuidance(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Answering a Question
  const handleSelectOption = (option) => {
    setHistoryTrail((prev) => [...prev, { questionId: currentQuestionId, optionId: option.id }]);
    if (option.targetGuidanceId && GUIDANCES[option.targetGuidanceId]) {
      setCurrentGuidance(GUIDANCES[option.targetGuidanceId]);
      setCurrentQuestionId(null);
    } else if (option.targetQuestionId && QUESTIONS[option.targetQuestionId]) {
      setCurrentQuestionId(option.targetQuestionId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Urgent Shortcut
  const handleTriggerUrgent = () => {
    setCurrentScenario({
      id: 'urgent',
      title: 'Urgent Account Protection',
      description: 'Immediate response steps for shared credentials or unauthorized debits.'
    });
    setCurrentGuidance(GUIDANCES.urgent_compromise);
    setCurrentQuestionId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back Navigation
  const handleBack = () => {
    if (currentGuidance && historyTrail.length > 0) {
      const lastStep = historyTrail[historyTrail.length - 1];
      setCurrentQuestionId(lastStep.questionId);
      setCurrentGuidance(null);
      setHistoryTrail((prev) => prev.slice(0, -1));
    } else if (currentGuidance && !historyTrail.length) {
      handleReset();
    } else if (currentQuestionId && historyTrail.length > 0) {
      const lastStep = historyTrail[historyTrail.length - 1];
      setCurrentQuestionId(lastStep.questionId);
      setHistoryTrail((prev) => prev.slice(0, -1));
    } else {
      handleReset();
    }
  };

  // Reset to Main Grid
  const handleReset = () => {
    setCurrentScenario(null);
    setCurrentQuestionId(null);
    setCurrentGuidance(null);
    setHistoryTrail([]);
    setCopied(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Copy Safety Checklist
  const handleCopyChecklist = async () => {
    if (!currentGuidance) return;
    const text = generateChecklistText(currentGuidance);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Non-blocking clipboard fallback
    }
  };

  // Icon Helper
  const renderIcon = (iconName, size = 22) => {
    switch (iconName) {
      case 'lock':
        return <Lock size={size} />;
      case 'alert-triangle':
        return <AlertTriangle size={size} />;
      case 'credit-card':
        return <CreditCard size={size} />;
      case 'link-2':
        return <LinkIcon size={size} />;
      case 'compass':
        return <Compass size={size} />;
      case 'shield-check':
        return <ShieldCheck size={size} />;
      default:
        return <Info size={size} />;
    }
  };

  const activeQuestion = currentQuestionId ? QUESTIONS[currentQuestionId] : null;

  return (
    <div className="v9-guided-page">
      {/* Top Header */}
      <header className="v9-header">
        <div className="v9-header-inner">
          <div
            className="v9-brand"
            onClick={onNavigateHome}
            role="button"
            tabIndex={0}
            aria-label="Go to ClearPay home"
            onKeyDown={(e) => { if (e.key === 'Enter') onNavigateHome(); }}
          >
            <div className="v9-brand-logo" aria-hidden="true">C</div>
            <div className="v9-brand-text">
              <span className="v9-brand-name">ClearPay</span>
              <span className="v9-brand-tag">SAFETY ASSISTANT</span>
            </div>
          </div>

          <nav className="v9-header-nav" aria-label="Main Navigation">
            <a href="#how-it-works" className="v9-nav-link" onClick={(e) => { e.preventDefault(); if (onNavigateHome) onNavigateHome(); }}>
              How it works
            </a>
            <a href="#learn" className="v9-nav-link" onClick={(e) => { e.preventDefault(); if (onNavigateHome) onNavigateHome(); }}>
              Learn
            </a>
            <a href="#privacy" className="v9-nav-link" onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }}>
              Privacy
            </a>
          </nav>

          <div className="v9-header-actions">
            <button
              type="button"
              className="v9-btn-outline"
              onClick={onNavigateAnalyze}
              aria-label="Go to Analyze page"
            >
              <span>Analyze</span>
            </button>
            <button
              type="button"
              className="v9-btn-outline"
              onClick={onNavigateHome}
              aria-label="Back to home page"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              <span>Back to home</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="v9-guided-container" id="main-content">
        {/* Breadcrumb Navigation */}
        <nav className="v9-breadcrumbs-row" aria-label="Breadcrumb">
          <div className="v9-breadcrumbs">
            <a href="/" onClick={(e) => { e.preventDefault(); if (onNavigateHome) onNavigateHome(); }}>Home</a>
            <span>/</span>
            {currentScenario ? (
              <>
                <a href="#guided-help" onClick={(e) => { e.preventDefault(); handleReset(); }}>I'm Not Sure</a>
                <span>/</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>{currentScenario.title}</span>
              </>
            ) : (
              <span style={{ color: '#0f172a', fontWeight: 600 }}>I'm Not Sure</span>
            )}
          </div>

          {!currentScenario && (
            <div className="v9-pill-no-judgement">
              START HERE - NO JUDGEMENT
            </div>
          )}
        </nav>

        {/* VIEW 0: Primary Grid (Exact Reference Asset) */}
        {!currentScenario && (
          <>
            <div>
              <span className="v9-pill-eyebrow">GUIDED SAFETY CHECK</span>
            </div>

            <div className="v9-hero-row">
              <h1 className="v9-hero-title">Not sure what to do?</h1>
            </div>
            <p className="v9-hero-sub">
              Choose the situation that feels closest. We'll explain the warning signs and suggest a safer next step—without asking for sensitive information.
            </p>

            <div className="v9-section-header">
              <h2 className="v9-section-title">What are you dealing with?</h2>
              <p className="v9-section-sub">Select one option to get advice tailored to your situation.</p>
            </div>

            {/* 3x2 Scenario Grid */}
            <div className="v9-scenario-grid" role="list" aria-label="Situation choices">
              {SCENARIOS.map((scen) => (
                <button
                  key={scen.id}
                  type="button"
                  className="v9-scenario-card"
                  onClick={() => handleSelectScenario(scen)}
                  aria-label={`Situation: ${scen.title}`}
                >
                  <div>
                    <div
                      className="v9-card-icon-box"
                      style={{ background: scen.iconBg, color: scen.iconTextColor }}
                      aria-hidden="true"
                    >
                      {renderIcon(scen.icon, 22)}
                    </div>
                    <h3 className="v9-card-title">{scen.title}</h3>
                    <p className="v9-card-desc">{scen.description}</p>
                  </div>
                  <div className="v9-card-arrow" aria-hidden="true">
                    <ArrowRight size={20} />
                  </div>
                </button>
              ))}

              {/* Card 6: Reassurance Card */}
              <div className="v9-reassurance-card">
                <div>
                  <div
                    className="v9-card-icon-box"
                    style={{ background: '#f0fdf4', color: '#16a34a' }}
                    aria-hidden="true"
                  >
                    <ShieldCheck size={22} />
                  </div>
                  <h3 className="v9-card-title">Your safety comes first</h3>
                  <p className="v9-card-desc">
                    This guide will never ask you for your OTP, UPI PIN, password, or bank login.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    className="v9-reassurance-link"
                    onClick={() => setShowPrivacyModal(true)}
                  >
                    <span>Privacy guidance is built in</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Red Urgent Action Banner */}
            <section className="v9-urgent-banner" aria-label="Urgent security action">
              <div className="v9-urgent-left">
                <div className="v9-urgent-icon-box" aria-hidden="true">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="v9-urgent-title">Already clicked, shared a code, or sent money?</h3>
                  <p className="v9-urgent-sub">
                    Don't panic. Take protective steps quickly and use verified official channels.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="v9-urgent-cta"
                onClick={handleTriggerUrgent}
                aria-label="Get urgent protective steps now"
              >
                <span>Get urgent steps</span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </section>

            {/* Reassurance Lines */}
            <div className="v9-security-line">
              <Lock size={15} aria-hidden="true" />
              <span>No account sign-in. No payment execution. Never share private credentials.</span>
            </div>

            <div className="v9-disclaimer-line">
              General safety guidance only—it cannot prove whether a message or person is legitimate.
            </div>
          </>
        )}

        {/* VIEW 1: Follow-Up Question Step */}
        {currentScenario && activeQuestion && !currentGuidance && (
          <div className="v9-step-container" role="region" aria-label="Situation question">
            <div className="v9-step-header">
              <div className="v9-step-eyebrow">GUIDED QUESTION • {currentScenario.title.toUpperCase()}</div>
              <h2 className="v9-step-prompt">{activeQuestion.prompt}</h2>
              {activeQuestion.helperText && (
                <p className="v9-step-helper">{activeQuestion.helperText}</p>
              )}
            </div>

            <div className="v9-options-list" role="radiogroup" aria-label="Options">
              {activeQuestion.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className="v9-option-card"
                  onClick={() => handleSelectOption(opt)}
                >
                  <div>
                    <div className="v9-option-label">{opt.label}</div>
                    <p className="v9-option-desc">{opt.description}</p>
                  </div>
                  <ArrowRight size={18} style={{ color: '#2563eb', flexShrink: 0 }} aria-hidden="true" />
                </button>
              ))}
            </div>

            <div className="v9-controls-bar">
              <button
                type="button"
                className="v9-btn-secondary"
                onClick={handleBack}
              >
                <ArrowLeft size={15} aria-hidden="true" />
                <span>Back</span>
              </button>

              <div className="v9-btn-group">
                <button
                  type="button"
                  className="v9-btn-secondary"
                  onClick={handleReset}
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  <span>Choose another situation</span>
                </button>
                <button
                  type="button"
                  className="v9-btn-secondary"
                  style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                  onClick={handleTriggerUrgent}
                >
                  <AlertTriangle size={14} aria-hidden="true" />
                  <span>I need urgent steps</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Tailored Safety Guidance Step */}
        {currentScenario && currentGuidance && (
          <div className="v9-guidance-card" role="region" aria-label="Recommended safety steps">
            <div className="v9-guidance-top">
              <span className={`v9-guidance-badge ${currentGuidance.badgeType || 'info'}`}>
                {currentGuidance.badge}
              </span>
              <button
                type="button"
                className="v9-btn-secondary"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                onClick={handleReset}
              >
                <RotateCcw size={13} aria-hidden="true" />
                <span>Start again</span>
              </button>
            </div>

            <h2 className="v9-guidance-title">{currentGuidance.title}</h2>
            <p className="v9-guidance-headline">{currentGuidance.headline}</p>

            {/* Why Suspicious Section */}
            {currentGuidance.whySuspicious && currentGuidance.whySuspicious.length > 0 && (
              <div className="v9-why-section">
                <h3 className="v9-why-title">Why this matters & common warning signs</h3>
                <ul className="v9-why-list">
                  {currentGuidance.whySuspicious.map((pt, idx) => (
                    <li key={idx}>{pt}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Steps */}
            <h3 className="v9-steps-title">What to do next — Step by step</h3>
            <div className="v9-steps-list">
              {currentGuidance.steps.map((st) => (
                <div key={st.step} className="v9-step-row">
                  <div className="v9-step-number" aria-hidden="true">{st.step}</div>
                  <div className="v9-step-body">
                    <h4>{st.title}</h4>
                    <p>{st.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Guidance Action Controls */}
            <div className="v9-controls-bar">
              <div className="v9-btn-group">
                <button
                  type="button"
                  className="v9-btn-primary"
                  onClick={handleCopyChecklist}
                  aria-label="Copy safety checklist to clipboard"
                >
                  {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                  <span>{copied ? 'Copied checklist!' : 'Copy safety checklist'}</span>
                </button>

                <button
                  type="button"
                  className="v9-btn-secondary"
                  onClick={onNavigateAnalyze}
                  aria-label="Open Analyze page"
                >
                  <span>Analyze a message</span>
                  <ExternalLink size={14} aria-hidden="true" />
                </button>
              </div>

              <div className="v9-btn-group">
                <button
                  type="button"
                  className="v9-btn-secondary"
                  onClick={handleBack}
                >
                  <ArrowLeft size={14} aria-hidden="true" />
                  <span>Change answer</span>
                </button>
                {currentGuidance.id !== 'urgent_compromise' && (
                  <button
                    type="button"
                    className="v9-btn-secondary"
                    style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                    onClick={handleTriggerUrgent}
                  >
                    <AlertTriangle size={14} aria-hidden="true" />
                    <span>I've already acted</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="v9-footer">
        <div className="v9-footer-inner">
          <div className="v9-footer-brand">
            <strong>ClearPay</strong>
            <span>· Educational guidance only. If money or account access is at risk, contact your bank through a verified official channel.</span>
          </div>
          <div className="v9-footer-links">
            <a href="#privacy" onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }}>
              Privacy
            </a>
            <a href="#help" onClick={(e) => { e.preventDefault(); alert("National Cybercrime Reporting Helpline (India): Dial 1930 or visit cybercrime.gov.in"); }}>
              Help & FAQ
            </a>
          </div>
        </div>
      </footer>

      {/* Privacy Guarantee Modal */}
      {showPrivacyModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '1.25rem'
          }}
          onClick={() => setShowPrivacyModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '520px',
              width: '100%',
              padding: '2rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowPrivacyModal(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                border: 'none',
                background: '#f1f5f9',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b'
              }}
              aria-label="Close modal"
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: '#f0fdf4', color: '#16a34a', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={22} />
              </div>
              <h3 id="privacy-modal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                ClearPay Privacy Guarantee
              </h3>
            </div>

            <p style={{ color: '#475569', fontSize: '0.92rem', lineHeight: 1.5, margin: '0 0 1.25rem' }}>
              ClearPay is designed specifically as an educational safety assistant. We operate under strict privacy rules:
            </p>

            <ul style={{ color: '#334155', fontSize: '0.88rem', lineHeight: 1.6, paddingLeft: '1.25rem', margin: '0 0 1.5rem' }}>
              <li><strong>Zero Credential Storage:</strong> We never ask for, collect, or record OTPs, UPI PINs, passwords, or bank logins.</li>
              <li><strong>No Automatic Link Navigation:</strong> We inspect web address patterns and known domain directories in-memory without connecting to destination servers.</li>
              <li><strong>Local Session Processing:</strong> Guided help answers stay in your local browser memory and are discarded when you close or refresh the page.</li>
            </ul>

            <button
              type="button"
              className="v9-btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setShowPrivacyModal(false)}
            >
              I understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
