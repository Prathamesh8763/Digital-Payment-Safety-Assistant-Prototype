import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  ShieldCheck, 
  Check, 
  Copy, 
  RotateCw, 
  Link as LinkIcon, 
  Lock, 
  Info, 
  HelpCircle,
  MessageSquare,
  PhoneCall,
  ExternalLink,
  Shield
} from 'lucide-react';
import FeedbackModal from './FeedbackModal';
import { getBannerTheme, getBannerCopy, generateRedactedSummary } from '../utils/resultFormatters';
import '../styles/result.css';

export default function ResultDisplay({ 
  result, 
  onReset, 
  onInspectUrl, 
  reviewedText = '', 
  isExample = false,
  onNavigateReport,
  onNavigateScamGuide
}) {
  const [copied, setCopied] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  if (!result || typeof result !== 'object') return null;

  const {
    risk_level = 'UNABLE_TO_ASSESS',
    status = 'unverified',
    verification_status,
    summary = '',
    disclaimer = 'This result is guidance, not a guarantee. If money or account access may be at risk, contact your bank through a verified official channel. Never share your OTP or UPI PIN.',
    reference_id = 'CP-7F24',
    analysis_id,
    domain,
    url_submitted,
    display_url,
    detected_platform,
    cybercrime_reporting,
    trust_transparency
  } = result;

  // Safe array normalization against null/undefined API responses
  const safeUrls = Array.isArray(result.urls) ? result.urls : [];
  const safeUrlAssessments = Array.isArray(result.url_assessments) ? result.url_assessments : [];
  const safeDetectedUrls = Array.isArray(result.detected_urls) ? result.detected_urls : [];
  const safeIndicators = Array.isArray(result.indicators) ? result.indicators : [];
  const safeWhySuspicious = Array.isArray(result.why_suspicious) ? result.why_suspicious : [];
  const safeReasons = Array.isArray(result.reasons) ? result.reasons : [];
  const safeRecommendedActions = Array.isArray(result.recommended_actions) ? result.recommended_actions : [];
  const safeContextTags = Array.isArray(result.context_tags) ? result.context_tags : [];

  const activeStatus = verification_status || status || 'unverified';
  const activeReportId = analysis_id || reference_id || 'CP-7F24';
  const displayReasons = safeWhySuspicious.length > 0 ? safeWhySuspicious : safeReasons;
  
  // Normalized URL list
  const allUrls = safeUrls.length > 0 
    ? safeUrls 
    : (safeUrlAssessments.length > 0 
        ? safeUrlAssessments 
        : (safeDetectedUrls.length > 0 
            ? safeDetectedUrls.map((u, i) => ({ url_id: `url-${i+1}`, url: u, display_url: u, verification_status: 'unverified' }))
            : (domain ? [{ url_id: 'url-1', url: url_submitted || domain, display_url: display_url || domain, verification_status: activeStatus }] : [])
          )
      );

  // Resolved reviewed message text
  const messageContent = reviewedText 
    || result.reviewed_input 
    || (domain ? `Link submitted for inspection: ${url_submitted || domain}` : summary);

  const bannerTheme = getBannerTheme(risk_level, status, activeStatus);
  const bannerCopy = getBannerCopy(bannerTheme, activeStatus);

  // Stat Count (distinct warning indicators)
  const warningCount = safeIndicators.length > 0 
    ? safeIndicators.length 
    : (displayReasons.length > 0 ? displayReasons.length : (bannerTheme === 'high' ? 3 : (bannerTheme === 'medium' ? 1 : 0)));

  // Next Steps list matching V8 design
  const getNextSteps = () => {
    if (safeRecommendedActions.length >= 3) {
      return [
        {
          title: "Don't open the link",
          desc: safeRecommendedActions[0] || 'Avoid tapping links in unexpected messages.',
          icon: 'link'
        },
        {
          title: "Keep credentials private",
          desc: safeRecommendedActions[1] || 'Never share an OTP, UPI PIN, or password.',
          icon: 'lock'
        },
        {
          title: "Verify through official channels",
          desc: safeRecommendedActions[2] || 'Use your bank\'s official app or known phone number.',
          icon: 'check'
        }
      ];
    }
    if (bannerTheme === 'high' || bannerTheme === 'medium') {
      return [
        {
          title: "Don't open the link",
          desc: safeRecommendedActions[0] || "Avoid tapping links in unexpected messages.",
          icon: 'link'
        },
        {
          title: "Keep credentials private",
          desc: safeRecommendedActions[1] || "Never share an OTP, UPI PIN, or password.",
          icon: 'lock'
        },
        {
          title: "Verify through official channels",
          desc: safeRecommendedActions[2] || "Use your bank's official app or known phone number.",
          icon: 'check'
        }
      ];
    }
    return [
      {
        title: "Verify independently",
        desc: safeRecommendedActions[0] || "Confirm unexpected payment requests via official apps directly.",
        icon: 'link'
      },
      {
        title: "Keep credentials private",
        desc: safeRecommendedActions[1] || "UPI PIN is only needed to SEND money, never to receive funds.",
        icon: 'lock'
      },
      {
        title: "Stay vigilant",
        desc: safeRecommendedActions[2] || "No automated tool can guarantee that a communication is 100% safe.",
        icon: 'check'
      }
    ];
  };

  const nextSteps = getNextSteps();

  // Redacted summary copy generator (Section 10.3 of V8 PRD)
  const handleCopySummary = async () => {
    const redactedSummary = generateRedactedSummary({
      bannerCopy,
      activeStatus,
      activeReportId,
      indicators: safeIndicators,
      displayReasons,
      nextSteps,
      disclaimer
    });

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(redactedSummary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Non-blocking clipboard fallback
    }
  };

  return (
    <div className="v8-result-page" role="region" aria-label="Safety Analysis Results">
      <div className="v8-result-container">
        
        {/* Breadcrumb & Eyebrow Row */}
        <div className="v8-result-header-row">
          <div className="v8-breadcrumbs" aria-label="Breadcrumb">
            <a href="/" onClick={(e) => { e.preventDefault(); if (onReset) onReset(); }}>Home</a>
            <span>/</span>
            <a href="#analyze" onClick={(e) => { e.preventDefault(); if (onReset) onReset(); }}>Analyze a message</a>
            <span>/</span>
            <span style={{ color: '#0f172a', fontWeight: 600 }}>Result</span>
          </div>

          <div className="v8-state-pill">
            {isExample ? 'ILLUSTRATIVE EXAMPLE' : 'ANALYSIS COMPLETED'}
          </div>
        </div>

        {/* Eyebrow badge */}
        <div>
          <span className="v8-eyebrow-badge">ANALYSIS RESULT</span>
        </div>

        {/* Main Title & Subtitle */}
        <h1 className="v8-page-title">Here's what we found.</h1>
        <p className="v8-page-subtitle">
          Review the warning signs and the link status, then choose a safer next step.
        </p>

        {/* Platform Context & Categorization Bar */}
        {(detected_platform || safeContextTags.length > 0) && (
          <div className="v8-context-badge-bar" role="group" aria-label="Detected Platform & Context">
            {detected_platform && (
              <div className="v8-platform-pill">
                <span>Context:</span>
                <strong>{detected_platform}</strong>
              </div>
            )}
            {safeContextTags.map((tag, idx) => (
              <span key={idx} className="v8-context-tag">
                #{tag.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}

        {/* Wide Risk Summary Banner */}
        <div className={`v8-risk-banner ${bannerTheme}`} role="alert" aria-live="polite">
          <div className="v8-banner-left">
            <div className="v8-banner-icon-box" aria-hidden="true">
              {bannerTheme === 'high' && <AlertTriangle size={24} />}
              {bannerTheme === 'medium' && <AlertCircle size={24} />}
              {bannerTheme === 'unverified' && <HelpCircle size={24} />}
              {bannerTheme === 'low' && <ShieldCheck size={24} />}
            </div>
            <div>
              <span className="v8-banner-tag">{bannerCopy.tag}</span>
              <h2 className="v8-banner-headline">{bannerCopy.headline}</h2>
              <p className="v8-banner-subtext">{bannerCopy.subtext}</p>
            </div>
          </div>

          <div className="v8-banner-stat-box" aria-label={`${warningCount} warning signs`}>
            <div className="v8-stat-num">{warningCount}</div>
            <div className="v8-stat-label">
              {warningCount === 1 ? 'warning sign' : 'warning signs'}
            </div>
          </div>
        </div>

        {/* Cybercrime Helpline 1930 / Reporting Banner for High & Medium Risk */}
        {(bannerTheme === 'high' || bannerTheme === 'medium' || cybercrime_reporting) && (
          <div className="v8-cybercrime-box" role="region" aria-label="Cybercrime Reporting Alert">
            <div className="v8-cybercrime-content">
              <span className="v8-cybercrime-badge">National Cybercrime Assistance</span>
              <h3 className="v8-cybercrime-title">Suspect Financial Cyber Fraud in India?</h3>
              <p className="v8-cybercrime-text">
                If you already sent money, shared an OTP/UPI PIN, or downloaded a remote app, act within the <strong>Golden Hour (1–2 hours)</strong>. Dial National Cybercrime Helpline <strong>1930</strong> or register on <strong>cybercrime.gov.in</strong> immediately so authorities can place an account hold before funds are withdrawn.
              </p>
            </div>
            <div className="v8-cybercrime-actions">
              <a href="tel:1930" className="v8-cybercrime-call-btn" title="Dial 1930 Helpline directly">
                <PhoneCall size={16} aria-hidden="true" />
                <span>Call Helpline 1930</span>
              </a>
              {onNavigateReport ? (
                <button
                  type="button"
                  className="v8-cybercrime-guide-btn"
                  onClick={onNavigateReport}
                >
                  <span>Reporting Steps Guide</span>
                  <ExternalLink size={14} aria-hidden="true" />
                </button>
              ) : (
                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="v8-cybercrime-guide-btn"
                >
                  <span>cybercrime.gov.in</span>
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              )}
              {onNavigateScamGuide && (
                <button
                  type="button"
                  className="v8-cybercrime-guide-btn"
                  onClick={onNavigateScamGuide}
                  style={{ background: '#ffffff', color: '#334155' }}
                >
                  <span>Browse Scam Guide</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Two-Column Middle Section: Warning signs vs What to do next */}
        <div className="v8-two-column-grid">
          
          {/* Left Column: Warning signs found */}
          <div className="v8-card">
            <div className="v8-card-header-row">
              <h3 className="v8-card-title">Warning signs found</h3>
              <span className="v8-indicator-badge">
                {warningCount} {warningCount === 1 ? 'indicator' : 'indicators'}
              </span>
            </div>

            <div className="v8-evidence-list">
              {safeIndicators.length > 0 ? (
                safeIndicators.map((ind, idx) => {
                  const isHigh = ind.severity === 'high';
                  const isLink = ind.id && ind.id.includes('url');
                  return (
                    <div key={idx} className="v8-evidence-item">
                      <div className={`v8-item-icon-circle ${isHigh ? 'danger' : (isLink ? 'link' : 'warning')}`} aria-hidden="true">
                        {isHigh ? <AlertTriangle size={18} /> : (isLink ? <LinkIcon size={18} /> : <ShieldAlert size={18} />)}
                      </div>
                      <div className="v8-evidence-content">
                        <div className="v8-evidence-title">{ind.title || ind.name}</div>
                        <div className="v8-evidence-desc">{ind.description}</div>
                        {ind.evidence_excerpt && (
                          <span className={`v8-clue-chip ${ind.id === 'unverified_url_destination' ? 'unverified' : ''}`}>
                            {ind.id === 'unverified_url_destination' ? 'UNVERIFIED URL' : `"${ind.evidence_excerpt}"`}
                          </span>
                        )}
                        {!ind.evidence_excerpt && ind.matched_clues && ind.matched_clues[0] && (
                          <span className="v8-clue-chip">
                            "{ind.matched_clues[0]}"
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : displayReasons && displayReasons.length > 0 ? (
                displayReasons.map((reason, idx) => (
                  <div key={idx} className="v8-evidence-item">
                    <div className="v8-item-icon-circle warning" aria-hidden="true">
                      <AlertTriangle size={18} />
                    </div>
                    <div className="v8-evidence-content">
                      <div className="v8-evidence-title">Suspicious Pattern Detected</div>
                      <div className="v8-evidence-desc">{reason}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '1rem 0', color: '#166534', fontSize: '0.88rem' }}>
                  ✓ No standard fraud indicators were identified in this message text.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: What to do next */}
          <div className="v8-card">
            <h3 className="v8-card-title">What to do next</h3>
            <p className="v8-card-sub">A safe response starts with a pause.</p>

            <div className="v8-step-list">
              {nextSteps.map((step, idx) => (
                <div key={idx} className="v8-step-item">
                  <div className={`v8-item-icon-circle ${step.icon === 'link' ? 'link' : (step.icon === 'lock' ? 'link' : 'success')}`} aria-hidden="true">
                    {step.icon === 'link' && <LinkIcon size={18} />}
                    {step.icon === 'lock' && <Lock size={18} />}
                    {step.icon === 'check' && <CheckCircle2 size={18} />}
                  </div>
                  <div>
                    <div className="v8-step-title">{step.title}</div>
                    <p className="v8-step-desc">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Two-Column Lower Section: Message and link reviewed vs Analysis details */}
        <div className="v8-two-column-grid">
          
          {/* Left Card: Message and link reviewed */}
          <div className="v8-card">
            <div className="v8-eyebrow-small">
              {allUrls.length > 0 ? 'MESSAGE + URL' : 'MESSAGE REVIEWED'}
            </div>
            
            <h3 className="v8-card-title" style={{ marginBottom: '1rem' }}>
              Message and link reviewed
            </h3>

            <div className="v8-reviewed-message-box">
              "{messageContent}"
            </div>

            {allUrls.length > 0 && (
              <div className="v8-reviewed-link-row">
                <span className="v8-link-tag-label">LINK</span>
                {allUrls.map((uObj, idx) => {
                  const urlText = uObj.display_url || uObj.domain || uObj.url || 'unverified-link';
                  const uStatus = (uObj.verification_status || uObj.status || 'unverified').toUpperCase();
                  const isFlagged = uStatus === 'FLAGGED';
                  const isSafe = uStatus === 'NO_KNOWN_THREAT_FOUND';
                  return (
                    <React.Fragment key={idx}>
                      <button 
                        type="button"
                        className="v8-link-pill-chip" 
                        onClick={() => onInspectUrl && onInspectUrl(uObj.url || urlText)}
                        title="Safely inspect link structure without visiting"
                        aria-label={`Inspect ${urlText}`}
                      >
                        <LinkIcon size={13} aria-hidden="true" />
                        <span>{urlText}</span>
                      </button>
                      <span className={`v8-url-status-badge ${isFlagged ? 'flagged' : (isSafe ? 'safe' : 'unverified')}`}>
                        {uStatus === 'NO_KNOWN_THREAT_FOUND' ? 'CHECKED CLEAN' : uStatus}
                      </span>
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Card: Analysis details */}
          <div className="v8-card">
            <div className="v8-card-header-row">
              <h3 className="v8-card-title">Analysis details</h3>
              <span className="v8-state-pill">
                {isExample ? 'DEMO STATE' : 'ANALYZED'}
              </span>
            </div>

            <div className="v8-details-table">
              <div className="v8-detail-row">
                <span className="v8-detail-label">Message pattern review</span>
                <span className="v8-detail-val completed">Completed</span>
              </div>
              <div className="v8-detail-row">
                <span className="v8-detail-label">URL status</span>
                <span className={`v8-detail-val ${bannerTheme === 'high' ? 'flagged' : (allUrls.length > 0 ? 'unverified' : 'completed')}`}>
                  {allUrls.length > 0 
                    ? (activeStatus === 'flagged' ? 'Flagged' : (activeStatus === 'no_known_threat_found' ? 'Clean' : 'Unverified')) 
                    : 'Not applicable'}
                </span>
              </div>
              <div className="v8-detail-row">
                <span className="v8-detail-label">Live reputation result</span>
                <span className="v8-detail-val gray">
                  {isExample ? 'Not shown in this example' : 'Local heuristics evaluated'}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Section: How to interpret a result */}
        <section className="v8-interpret-section" aria-labelledby="interpret-heading">
          <h2 id="interpret-heading" className="v8-interpret-title">How to interpret a result</h2>
          <p className="v8-interpret-sub">
            A risk finding, an unknown link, and a lack of a known match are different outcomes.
          </p>

          <div className="v8-interpret-grid">
            {/* Card 1: High risk */}
            <div className="v8-interpret-card">
              <div className="v8-interpret-top">
                <div className="v8-item-icon-circle danger" aria-hidden="true">
                  <AlertTriangle size={18} />
                </div>
                <span className="v8-clue-chip">WARNING</span>
              </div>
              <div className="v8-interpret-card-title">High risk</div>
              <p className="v8-interpret-card-text">
                Several suspicious signals were found. Stop and verify before acting.
              </p>
            </div>

            {/* Card 2: Unverified */}
            <div className="v8-interpret-card">
              <div className="v8-interpret-top">
                <div className="v8-item-icon-circle warning" aria-hidden="true">
                  <LinkIcon size={18} />
                </div>
                <span className="v8-clue-chip unverified">UNKNOWN</span>
              </div>
              <div className="v8-interpret-card-title">Unverified</div>
              <p className="v8-interpret-card-text">
                There isn't enough reliable information to label the destination safe.
              </p>
            </div>

            {/* Card 3: No known threat found */}
            <div className="v8-interpret-card">
              <div className="v8-interpret-top">
                <div className="v8-item-icon-circle link" aria-hidden="true">
                  <Info size={18} />
                </div>
                <span className="v8-indicator-badge">LIMITED RESULT</span>
              </div>
              <div className="v8-interpret-card-title">No known threat found</div>
              <p className="v8-interpret-card-text">
                No match in checked sources is not proof that a message is safe.
              </p>
            </div>
          </div>
        </section>

        {/* Trust & Transparency Section */}
        <div className="v8-transparency-card" role="region" aria-label="Trust and Transparency">
          <div className="v8-transparency-header">
            <div className="v8-transparency-icon">
              <Shield size={18} />
            </div>
            <h3 className="v8-transparency-title">Trust & Transparency Commitments</h3>
          </div>
          <div className="v8-transparency-grid">
            <div className="v8-transparency-item">
              <h4>Stateless Privacy Guarantee</h4>
              <p>{trust_transparency?.zero_storage_guarantee || 'Your submitted text and links are processed purely in volatile memory. ClearPay does not store, log, or monetize your messages on server databases.'}</p>
            </div>
            <div className="v8-transparency-item">
              <h4>Explainable Indicator Scoring</h4>
              <p>{trust_transparency?.heuristics_summary || 'Risk levels are derived from visible, explainable fraud patterns (such as urgency cues, credential theft demands, spoofed screenshot claims, or unverified domains).'}</p>
            </div>
            <div className="v8-transparency-item">
              <h4>Zero-Guarantee Safety Principle</h4>
              <p>{trust_transparency?.limitation_disclaimer || 'Automated heuristics cannot catch every novel scam vector. A "Low" risk assessment is educational guidance, NOT a certification of legitimacy.'}</p>
            </div>
          </div>
        </div>

        {/* Blue Advisory / Disclaimer Banner */}
        <div className="v8-advisory-banner" role="note" aria-label="Advisory note">
          <div className="v8-advisory-icon" aria-hidden="true">
            <Info size={18} />
          </div>
          <div>
            <div className="v8-advisory-title">This result is guidance, not a guarantee.</div>
            <p className="v8-advisory-text">
              If money or account access may be at risk, contact your bank through a verified official channel. Never share your OTP or UPI PIN.
            </p>
          </div>
        </div>

        {/* Bottom Action Row */}
        <div className="v8-action-row">
          <div className="v8-btn-group">
            <button 
              type="button" 
              className="v8-primary-btn" 
              onClick={onReset}
              aria-label="Analyze another message"
            >
              <RotateCw size={16} aria-hidden="true" />
              <span>Analyze another message</span>
            </button>

            <button 
              type="button" 
              className="v8-secondary-btn" 
              onClick={handleCopySummary}
              aria-label="Copy summary to clipboard"
            >
              {copied ? <Check size={16} style={{ color: '#16a34a' }} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
              <span>{copied ? 'Copied summary!' : 'Copy summary'}</span>
            </button>

            <button
              type="button"
              className="v8-secondary-btn"
              onClick={() => setShowFeedbackModal(true)}
              style={{ padding: '0.65rem 1rem', fontSize: '0.8rem', color: '#64748b' }}
              aria-label="Report incorrect or unclear result"
            >
              <MessageSquare size={14} aria-hidden="true" />
              <span>Report issue</span>
            </button>
          </div>

          <div className="v8-report-id-text">
            {isExample ? `Example report ID: ${activeReportId}` : `Report ID: ${activeReportId}`}
          </div>
        </div>

        {/* Optional Feedback Modal */}
        {showFeedbackModal && (
          <FeedbackModal 
            referenceId={activeReportId} 
            assessmentType={domain ? 'url' : 'text'} 
            onClose={() => setShowFeedbackModal(false)}
          />
        )}

      </div>
    </div>
  );
}
