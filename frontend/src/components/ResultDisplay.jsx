import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle, 
  ShieldAlert, 
  ShieldCheck, 
  HelpCircle, 
  Check, 
  Copy, 
  PhoneCall, 
  ArrowLeft,
  Lightbulb
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
    disclaimer
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
        <div className="risk-header-content">
          <h3>
            {risk_level === 'HIGH' && 'HIGH RISK: Potential Payment Scam'}
            {risk_level === 'MEDIUM' && 'MEDIUM RISK: Suspicious Signs Detected'}
            {risk_level === 'LOW' && 'LOW RISK: Standard Payment Context'}
          </h3>
          <p style={{ margin: '0.2rem 0' }}>{summary}</p>
          <div className="risk-meter">
            Risk Score: {risk_score} / 100
          </div>
        </div>
      </div>

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
          <strong>Report Fraud:</strong> If you suspect you were targeted by a scam or lost money, call the National Cyber Crime Helpline:
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

      {/* Footer Actions */}
      <div className="btn-row" style={{ marginTop: '1.5rem' }}>
        <button type="button" className="btn btn-secondary" onClick={onReset}>
          <ArrowLeft size={16} /> Check Another Situation
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleCopy}>
          {copied ? (
            <>
              <Check size={16} /> Copied!
            </>
          ) : (
            <>
              <Copy size={16} /> Copy Safety Advice
            </>
          )}
        </button>
      </div>

      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1rem', textAlign: 'center' }}>
        {disclaimer}
      </p>
    </div>
  );
}
