import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle, 
  ShieldAlert, 
  ShieldCheck, 
  Check, 
  Copy, 
  PhoneCall, 
  ArrowLeft,
  Lightbulb,
  Bot,
  Link as LinkIcon,
  QrCode,
  Info,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import FeedbackModal from './FeedbackModal';
import Button from './ui/Button';
import Card from './ui/Card';
import Badge from './ui/Badge';

export default function ResultDisplay({ result, onReset, onInspectUrl }) {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const {
    risk_level,
    risk_score,
    status,
    summary,
    detected_categories,
    why_suspicious,
    reasons,
    recommended_actions,
    recommendation,
    educational_concept,
    disclaimer,
    confidence_rating,
    ai_enhanced,
    ai_analysis_summary,
    reference_id,
    uncertainty_note,
    // URL specific fields
    domain,
    protocol,
    is_https,
    is_shortened,
    impersonated_brand,
    detected_urls,
    checks_performed,
    checks_unavailable,
    // QR specific fields
    payload_type,
    parsed_details
  } = result;

  const displayReasons = why_suspicious || reasons || [];
  const displayActions = recommended_actions || (recommendation ? [recommendation] : []);

  const handleCopy = () => {
    const textToCopy = `Safety Assessment: ${risk_level} RISK (${risk_score}/100) [Status: ${status || 'N/A'}] [Ref: ${reference_id || 'N/A'}]\n\nSummary: ${summary || ''}\n\nRecommended Actions:\n${displayActions.map(a => `• ${a}`).join('\n')}\n\nGolden Rule: ${educational_concept?.golden_rule || ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getStatusHeadline = () => {
    if (status === 'flagged') return 'Potential Threat Found';
    if (status === 'suspicious') return 'Suspicious Signs Found';
    if (status === 'no_known_threat_found') return 'No Known Threat Found in Checked Sources';
    if (status === 'unverified') return 'Could Not Verify This Link';
    if (status === 'invalid_input') return 'Invalid or Incomplete URL';
    if (status === 'provider_unavailable') return 'Link Check Unavailable';

    // Fallbacks based on risk_level
    if (risk_level === 'HIGH') return 'HIGH RISK: Potential Payment Scam';
    if (risk_level === 'MEDIUM') return 'MEDIUM RISK: Suspicious Signs Detected';
    if (risk_level === 'LOW') return 'LOW RISK: Warning Signs Not Detected';
    return 'UNABLE TO ASSESS: Incomplete Information';
  };

  const getRiskIcon = () => {
    if (status === 'flagged' || risk_level === 'HIGH') return <ShieldAlert size={30} aria-hidden="true" />;
    if (status === 'suspicious' || risk_level === 'MEDIUM') return <AlertTriangle size={30} aria-hidden="true" />;
    if (status === 'unverified' || risk_level === 'UNABLE_TO_ASSESS') return <HelpCircle size={30} aria-hidden="true" />;
    if (status === 'no_known_threat_found' || risk_level === 'LOW') return <ShieldCheck size={30} aria-hidden="true" />;
    return <Info size={30} aria-hidden="true" />;
  };

  const getStatusCardClass = () => {
    if (status === 'flagged' || risk_level === 'HIGH') return 'HIGH';
    if (status === 'suspicious' || risk_level === 'MEDIUM') return 'MEDIUM';
    if (status === 'unverified' || status === 'invalid_input' || status === 'provider_unavailable' || risk_level === 'UNABLE_TO_ASSESS') return 'UNABLE_TO_ASSESS';
    return 'LOW';
  };

  return (
    <div className="result-container" role="region" aria-label="Safety Analysis Results">
      {/* Risk / Status Badge Card */}
      <div className={`risk-badge-card ${getStatusCardClass()}`}>
        <div className="risk-icon-wrap">
          {getRiskIcon()}
        </div>
        <div className="risk-header-content" style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
            <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)' }}>
              {getStatusHeadline()}
            </h2>
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              {reference_id && (
                <span style={{ fontSize: 'var(--font-size-xs)', background: 'rgba(0,0,0,0.1)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-xs)', fontFamily: 'var(--font-family-mono)', fontWeight: 600 }}>
                  {reference_id}
                </span>
              )}
              {confidence_rating && (
                <span style={{ fontSize: 'var(--font-size-xs)', background: 'rgba(0,0,0,0.08)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-xs)', fontWeight: 600 }}>
                  {confidence_rating}
                </span>
              )}
            </div>
          </div>
          {summary && (
            <p style={{ margin: '0.35rem 0 0.2rem', fontSize: 'var(--font-size-sm)', lineHeight: 'var(--line-height-normal)' }}>{summary}</p>
          )}
          <div style={{ marginTop: '0.35rem' }}>
            <Badge level={getStatusCardClass()} label={`Risk Score: ${risk_score} / 100`} />
          </div>
        </div>
      </div>

      {/* Uncertainty & Evidence Bounds Callout (V6 Honest Uncertainty) */}
      <div style={{ background: 'var(--color-bg-subtle, #f8fafc)', border: '1px solid var(--color-border-medium, #cbd5e1)', borderRadius: 'var(--radius-md, 8px)', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: 'var(--font-size-xs, 0.85rem)', color: 'var(--color-text-secondary, #475569)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
        <Info size={16} style={{ color: 'var(--primary, #2563eb)', flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
        <div>
          <strong>Assessment Scope & Limitations:</strong> {uncertainty_note || 'This assessment reflects detectable patterns. An unverified result or absence of a threat record does NOT guarantee safety.'}
        </div>
      </div>

      {/* AI Analysis Enhancement Box (if enabled) */}
      {ai_enhanced && ai_analysis_summary && (
        <div style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: 'var(--radius-lg, 12px)', padding: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#6d28d9', fontWeight: 'var(--font-weight-bold, 700)', fontSize: 'var(--font-size-sm, 0.875rem)', marginBottom: '0.3rem' }}>
            <Bot size={18} aria-hidden="true" />
            AI Behavioral Context:
          </div>
          <p style={{ fontSize: 'var(--font-size-sm, 0.875rem)', color: '#4c1d95', margin: 0, lineHeight: 1.45 }}>
            {ai_analysis_summary}
          </p>
        </div>
      )}

      {/* URL Inspection Summary Card (if URL result) */}
      {domain && (
        <Card style={{ padding: '1rem', background: '#f8fafc', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.5rem' }}>
            <LinkIcon size={16} aria-hidden="true" /> Link Inspection Details (Safe Preview):
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.65rem', fontSize: '0.82rem' }}>
            <div><strong>Target Domain:</strong> <code>{domain}</code></div>
            <div><strong>Protocol:</strong> {protocol ? protocol.toUpperCase() : 'N/A'} ({is_https ? '🔒 HTTPS' : '⚠️ Plain HTTP'})</div>
            <div><strong>Shortener:</strong> {is_shortened ? '⚠️ Yes (Concealed)' : 'No'}</div>
            {impersonated_brand && (
              <div style={{ color: '#dc2626' }}><strong>Target Brand:</strong> {impersonated_brand}</div>
            )}
          </div>
        </Card>
      )}

      {/* Extracted URLs from Message (V6 P0 Requirement: URL-021, URL-022) */}
      {detected_urls && detected_urls.length > 0 && (
        <Card style={{ padding: '1.25rem', background: '#eff6ff', border: '1.5px solid #bfdbfe', marginBottom: '1.25rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem', color: '#1e40af', marginBottom: '0.6rem' }}>
            <LinkIcon size={18} aria-hidden="true" />
            Detected Web Links in Message ({detected_urls.length}):
          </div>
          <p style={{ fontSize: '0.82rem', color: '#1e3a8a', margin: '0 0 0.85rem' }}>
            We found the following link(s) in the message. For your safety, links are not auto-opened. You can inspect each link safely without visiting it:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {detected_urls.map((u, idx) => (
              <div 
                key={idx} 
                style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  flexWrap: 'wrap', 
                  gap: '0.5rem',
                  background: '#ffffff',
                  border: '1px solid #dbeafe',
                  borderRadius: '8px',
                  padding: '0.65rem 0.85rem'
                }}
              >
                <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.84rem', color: '#0f172a' }}>
                  {u}
                </div>
                {onInspectUrl && (
                  <button
                    type="button"
                    onClick={() => onInspectUrl(u)}
                    style={{
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <span>Inspect link</span>
                    <ExternalLink size={13} aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* QR Code Payload Details (if QR result) */}
      {payload_type && (
        <Card style={{ padding: '1rem', background: '#f8fafc', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.5rem' }}>
            <QrCode size={16} aria-hidden="true" /> Decoded QR Type: {payload_type.toUpperCase()}
          </div>
          {parsed_details && parsed_details.payee_vpa && (
            <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div><strong>Payee VPA:</strong> <code>{parsed_details.payee_vpa}</code></div>
              {parsed_details.payee_name && <div><strong>Payee Name:</strong> {parsed_details.payee_name}</div>}
              {parsed_details.amount && <div><strong>Amount:</strong> ₹{parsed_details.amount}</div>}
              {parsed_details.transaction_note && <div><strong>Note:</strong> "{parsed_details.transaction_note}"</div>}
            </div>
          )}
        </Card>
      )}

      {/* Checks Coverage: What was checked & what was unavailable */}
      {((checks_performed && checks_performed.length > 0) || (checks_unavailable && checks_unavailable.length > 0)) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.78rem', color: '#64748b', marginBottom: '1rem', padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
          {checks_performed && checks_performed.length > 0 && (
            <div>
              <strong>Checks performed:</strong> {checks_performed.join(', ')}
            </div>
          )}
          {checks_unavailable && checks_unavailable.length > 0 && (
            <div style={{ color: '#d97706' }}>
              <strong>Unavailable / not configured:</strong> {checks_unavailable.join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Detected Categories */}
      {detected_categories && detected_categories.length > 0 && (
        <div className="categories-tags" aria-label="Detected Scam Categories">
          {detected_categories.map((cat, idx) => (
            <span key={idx} className="category-tag">
              🏷️ {cat}
            </span>
          ))}
        </div>
      )}

      {/* Why is this suspicious? Grounded evidence reasons */}
      {displayReasons && displayReasons.length > 0 && (
        <Card className="result-section">
          <div className="result-section-title">
            <AlertCircle size={18} className="list-item-icon danger" aria-hidden="true" />
            Detection Evidence & Reasons:
          </div>
          <ul className="reasons-list">
            {displayReasons.map((reason, idx) => (
              <li key={idx} className="list-item">
                <span className="list-item-icon danger" aria-hidden="true">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Recommended Actions */}
      {displayActions && displayActions.length > 0 && (
        <Card className="result-section" style={{ borderLeft: '4px solid var(--primary, #2563eb)' }}>
          <div className="result-section-title">
            <CheckCircle size={18} className="list-item-icon warning" aria-hidden="true" />
            What you should do right now:
          </div>
          <ol className="actions-list" style={{ paddingLeft: '1.2rem' }}>
            {displayActions.map((action, idx) => (
              <li key={idx} style={{ marginBottom: '0.5rem', fontWeight: 500 }}>
                {action}
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* Educational Concept Box */}
      {educational_concept && (
        <div className="edu-box">
          <div className="edu-box-title">
            <Lightbulb size={20} aria-hidden="true" />
            Digital Payment Awareness: {educational_concept.title}
          </div>
          <p className="edu-box-content">
            {educational_concept.concept}
          </p>
          <div className="edu-box-rule">
            {educational_concept.golden_rule}
          </div>
        </div>
      )}

      {/* User Feedback & Correction Workflow */}
      <FeedbackModal referenceId={reference_id} assessmentType={domain ? 'url' : (payload_type ? 'qr' : 'text')} />

      {/* Helpline banner */}
      <div className="helpline-box">
        <div>
          <strong>Report Fraud:</strong> If you lost money or suspect an ongoing scam, immediately call the National Cyber Crime Helpline:
        </div>
        <div>
          <a href="tel:1930" className="helpline-pill">
            <PhoneCall size={14} style={{ display: 'inline', marginRight: '4px' }} aria-hidden="true" />
            Dial 1930
          </a>
          <span style={{ margin: '0 0.5rem' }}>or</span>
          <a 
            href="https://cybercrime.gov.in" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#c2410c', fontWeight: 600, textDecoration: 'underline' }}
          >
            cybercrime.gov.in
          </a>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="btn-row" style={{ marginTop: '1.5rem' }}>
        <Button variant="primary" onClick={onReset} leftIcon={ArrowLeft}>
          Check Another Message or Link
        </Button>
        <Button variant="secondary" onClick={handleCopy} leftIcon={copied ? Check : Copy}>
          {copied ? 'Copied!' : 'Copy Safety Advice'}
        </Button>
      </div>

      <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '1rem', textAlign: 'center' }}>
        {disclaimer || 'This safety assessment is an advisory tool designed to help you pause and verify. A low-risk score is not a guarantee of safety.'}
      </p>
    </div>
  );
}
