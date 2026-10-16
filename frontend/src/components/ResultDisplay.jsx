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
  Link,
  QrCode,
  Info
} from 'lucide-react';
import FeedbackModal from './FeedbackModal';
import Button from './ui/Button';
import Card from './ui/Card';
import Badge from './ui/Badge';

export default function ResultDisplay({ result, onReset }) {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const {
    risk_level,
    risk_score,
    summary,
    detected_categories,
    why_suspicious,
    recommended_actions,
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
    // QR specific fields
    payload_type,
    parsed_details
  } = result;

  const handleCopy = () => {
    const textToCopy = `Safety Assessment: ${risk_level} RISK (${risk_score}/100) [Ref: ${reference_id || 'N/A'}]\n\nSummary: ${summary}\n\nRecommended Actions:\n${(recommended_actions || []).map(a => `• ${a}`).join('\n')}\n\nGolden Rule: ${educational_concept?.golden_rule || ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getRiskIcon = () => {
    if (risk_level === 'HIGH') return <ShieldAlert size={30} aria-hidden="true" />;
    if (risk_level === 'MEDIUM') return <AlertTriangle size={30} aria-hidden="true" />;
    return <ShieldCheck size={30} aria-hidden="true" />;
  };

  return (
    <div className="result-container" role="region" aria-label="Safety Analysis Results">
      {/* Risk Badge Card */}
      <div className={`risk-badge-card ${risk_level}`}>
        <div className="risk-icon-wrap">
          {getRiskIcon()}
        </div>
        <div className="risk-header-content" style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
            <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)' }}>
              {risk_level === 'HIGH' && 'HIGH RISK: Potential Payment Scam'}
              {risk_level === 'MEDIUM' && 'MEDIUM RISK: Suspicious Signs Detected'}
              {risk_level === 'LOW' && 'LOW RISK: Warning Signs Not Detected'}
              {risk_level === 'UNABLE_TO_ASSESS' && 'UNABLE TO ASSESS: Incomplete Information'}
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
          <p style={{ margin: '0.35rem 0 0.2rem', fontSize: 'var(--font-size-sm)', lineHeight: 'var(--line-height-normal)' }}>{summary}</p>
          <div style={{ marginTop: '0.35rem' }}>
            <Badge level={risk_level} label={`Risk Score: ${risk_score} / 100`} />
          </div>
        </div>
      </div>

      {/* Uncertainty & Evidence Bounds Callout (FR-01 / FR-03 / V4 Honest Uncertainty) */}
      <div style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border-medium)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
        <Info size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
        <div>
          <strong>Assessment Scope & Uncertainty:</strong> {uncertainty_note || 'This assessment reflects detected patterns only. A low risk outcome does not guarantee absolute safety or replace personal vigilance.'}
        </div>
      </div>

      {/* AI Analysis Enhancement Box (FR-03) */}
      {ai_enhanced && ai_analysis_summary && (
        <div style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: 'var(--radius-lg)', padding: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#6d28d9', fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-sm)', marginBottom: '0.3rem' }}>
            <Bot size={18} aria-hidden="true" />
            AI Behavioral Context:
          </div>
          <p style={{ fontSize: 'var(--font-size-sm)', color: '#4c1d95', margin: 0, lineHeight: 1.45 }}>
            {ai_analysis_summary}
          </p>
        </div>
      )}

      {/* URL Inspection Summary Card (if URL result) */}
      {domain && (
        <Card style={{ padding: '1rem', background: 'var(--color-bg-subtle)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            <Link size={16} aria-hidden="true" /> Link Inspection Details (Safe Preview):
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', fontSize: 'var(--font-size-xs)' }}>
            <div><strong>Domain:</strong> <code>{domain}</code></div>
            <div><strong>Protocol:</strong> {protocol ? protocol.toUpperCase() : 'N/A'} ({is_https ? '🔒 Secure SSL' : '⚠️ Plain HTTP'})</div>
            <div><strong>Shortened:</strong> {is_shortened ? '⚠️ Yes (Concealed)' : 'No'}</div>
            {impersonated_brand && (
              <div style={{ color: 'var(--danger)' }}><strong>Impersonated Brand:</strong> {impersonated_brand}</div>
            )}
          </div>
        </Card>
      )}

      {/* QR Code Payload Details (if QR result) */}
      {payload_type && (
        <Card style={{ padding: '1rem', background: 'var(--color-bg-subtle)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            <QrCode size={16} aria-hidden="true" /> Decoded QR Type: {payload_type.toUpperCase()}
          </div>
          {parsed_details && parsed_details.payee_vpa && (
            <div style={{ fontSize: 'var(--font-size-xs)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div><strong>Payee VPA:</strong> <code>{parsed_details.payee_vpa}</code></div>
              {parsed_details.payee_name && <div><strong>Payee Name:</strong> {parsed_details.payee_name}</div>}
              {parsed_details.amount && <div><strong>Amount:</strong> ₹{parsed_details.amount}</div>}
              {parsed_details.transaction_note && <div><strong>Note:</strong> "{parsed_details.transaction_note}"</div>}
            </div>
          )}
        </Card>
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

      {/* Why is this suspicious? */}
      {why_suspicious && why_suspicious.length > 0 && (
        <Card className="result-section">
          <div className="result-section-title">
            <AlertCircle size={18} className="list-item-icon danger" aria-hidden="true" />
            Why is this suspicious?
          </div>
          <ul className="reasons-list">
            {why_suspicious.map((reason, idx) => (
              <li key={idx} className="list-item">
                <span className="list-item-icon danger" aria-hidden="true">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Recommended Actions */}
      {recommended_actions && recommended_actions.length > 0 && (
        <Card className="result-section" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="result-section-title">
            <CheckCircle size={18} className="list-item-icon warning" aria-hidden="true" />
            What you should do right now:
          </div>
          <ol className="actions-list" style={{ paddingLeft: '1.2rem' }}>
            {recommended_actions.map((action, idx) => (
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

      {/* User Feedback & Correction Workflow (FR-04) */}
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
          Check Another Situation
        </Button>
        <Button variant="secondary" onClick={handleCopy} leftIcon={copied ? Check : Copy}>
          {copied ? 'Copied!' : 'Copy Safety Advice'}
        </Button>
      </div>

      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '1rem', textAlign: 'center' }}>
        {disclaimer}
      </p>
    </div>
  );
}
