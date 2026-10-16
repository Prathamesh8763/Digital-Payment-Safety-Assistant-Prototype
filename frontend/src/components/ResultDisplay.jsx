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
  ExternalLink,
  Link,
  QrCode
} from 'lucide-react';

export default function ResultDisplay({ result, onReset }) {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const {
    risk_level,
    risk_score,
    summary,
    detected_categories,
    indicators,
    why_suspicious,
    recommended_actions,
    educational_concept,
    disclaimer,
    confidence_rating,
    ai_enhanced,
    ai_analysis_summary,
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
    const textToCopy = `Safety Assessment: ${risk_level} RISK (${risk_score}/100)\n\nSummary: ${summary}\n\nRecommended Actions:\n${recommended_actions.map(a => `• ${a}`).join('\n')}\n\nGolden Rule: ${educational_concept?.golden_rule || ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getRiskIcon = () => {
    if (risk_level === 'HIGH') return <ShieldAlert size={30} />;
    if (risk_level === 'MEDIUM') return <AlertTriangle size={30} />;
    return <ShieldCheck size={30} />;
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
            <h3 style={{ margin: 0 }}>
              {risk_level === 'HIGH' && 'HIGH RISK: Potential Payment Scam'}
              {risk_level === 'MEDIUM' && 'MEDIUM RISK: Suspicious Signs Detected'}
              {risk_level === 'LOW' && 'LOW RISK: No Strong Scam Signs Found'}
            </h3>
            {confidence_rating && (
              <span style={{ fontSize: '0.72rem', background: 'rgba(0,0,0,0.08)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                {confidence_rating}
              </span>
            )}
          </div>
          <p style={{ margin: '0.35rem 0 0.2rem', fontSize: '0.92rem' }}>{summary}</p>
          <div className="risk-meter">
            Risk Score: {risk_score} / 100
          </div>
        </div>
      </div>

      {/* AI Analysis Enhancement Box (FR-03) */}
      {ai_enhanced && ai_analysis_summary && (
        <div style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#6d28d9', fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.3rem' }}>
            <Bot size={18} />
            AI Behavioral Context:
          </div>
          <p style={{ fontSize: '0.88rem', color: '#4c1d95', margin: 0, lineHeight: 1.45 }}>
            {ai_analysis_summary}
          </p>
        </div>
      )}

      {/* URL Inspection Summary Card (if URL result) */}
      {domain && (
        <div className="card" style={{ padding: '1rem', background: '#f8fafc', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', marginBottom: '0.5rem' }}>
            <Link size={16} /> Link Inspection Details:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', fontSize: '0.82rem' }}>
            <div><strong>Domain:</strong> <code>{domain}</code></div>
            <div><strong>Protocol:</strong> {protocol ? protocol.toUpperCase() : 'N/A'} ({is_https ? '🔒 Secure SSL' : '⚠️ Plain HTTP'})</div>
            <div><strong>Shortened:</strong> {is_shortened ? '⚠️ Yes (Concealed)' : 'No'}</div>
            {impersonated_brand && (
              <div style={{ color: '#dc2626' }}><strong>Impersonated Brand:</strong> {impersonated_brand}</div>
            )}
          </div>
        </div>
      )}

      {/* QR Code Payload Details (if QR result) */}
      {payload_type && (
        <div className="card" style={{ padding: '1rem', background: '#f8fafc', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', marginBottom: '0.5rem' }}>
            <QrCode size={16} /> Decoded QR Type: {payload_type.toUpperCase()}
          </div>
          {parsed_details && parsed_details.payee_vpa && (
            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div><strong>Payee VPA:</strong> <code>{parsed_details.payee_vpa}</code></div>
              {parsed_details.payee_name && <div><strong>Payee Name:</strong> {parsed_details.payee_name}</div>}
              {parsed_details.amount && <div><strong>Amount:</strong> ₹{parsed_details.amount}</div>}
              {parsed_details.transaction_note && <div><strong>Note:</strong> "{parsed_details.transaction_note}"</div>}
            </div>
          )}
        </div>
      )}

      {/* Detected Categories */}
      {detected_categories && detected_categories.length > 0 && (
        <div className="categories-tags">
          {detected_categories.map((cat, idx) => (
            <span key={idx} className="category-tag">
              🏷️ {cat}
            </span>
          ))}
        </div>
      )}

      {/* Why is this suspicious? */}
      {why_suspicious && why_suspicious.length > 0 && (
        <div className="card result-section">
          <div className="result-section-title">
            <AlertCircle size={18} className="list-item-icon danger" />
            Why is this suspicious?
          </div>
          <ul className="reasons-list">
            {why_suspicious.map((reason, idx) => (
              <li key={idx} className="list-item">
                <span className="list-item-icon danger">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Actions */}
      {recommended_actions && recommended_actions.length > 0 && (
        <div className="card result-section" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="result-section-title">
            <CheckCircle size={18} className="list-item-icon warning" />
            What you should do right now:
          </div>
          <ol className="actions-list" style={{ paddingLeft: '1.2rem' }}>
            {recommended_actions.map((action, idx) => (
              <li key={idx} style={{ marginBottom: '0.5rem', fontWeight: 500 }}>
                {action}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Educational Concept Box */}
      {educational_concept && (
        <div className="edu-box">
          <div className="edu-box-title">
            <Lightbulb size={20} />
            Digital Payment Awareness: {educational_concept.title}
          </div>
          <p className="edu-box-content">
            {educational_concept.concept}
          </p>
          <div className="edu-box-rule">
            💡 Golden Rule: {educational_concept.golden_rule}
          </div>
        </div>
      )}

      {/* Helpline banner */}
      <div className="helpline-box">
        <div>
          <strong>Report Fraud:</strong> If you lost money or suspect an ongoing scam, immediately call the National Cyber Crime Helpline:
        </div>
        <div>
          <a href="tel:1930" className="helpline-pill">
            <PhoneCall size={14} style={{ display: 'inline', marginRight: '4px' }} />
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
        <button type="button" className="btn btn-primary" onClick={onReset}>
          <ArrowLeft size={16} /> Check Another Situation
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleCopy}>
          {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Safety Advice</>}
        </button>
      </div>

      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1rem', textAlign: 'center' }}>
        {disclaimer}
      </p>
    </div>
  );
}
