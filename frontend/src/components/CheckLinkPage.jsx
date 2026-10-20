import React, { useState, useRef } from 'react';
import {
  Link as LinkIcon,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Lock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  Upload,
  X,
  CreditCard,
  Globe
} from 'lucide-react';
import jsQR from 'jsqr';
import apiClient from '../services/apiClient';
import '../styles/checkLink.css';

export default function CheckLinkPage({ onNavigateHome, onNavigateAnalyze, onNavigateGuided }) {
  const [mode, setMode] = useState('url'); // 'url' | 'qr'
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  // QR state
  const [qrFile, setQrFile] = useState(null);
  const [qrPayload, setQrPayload] = useState('');
  const [qrIsUrl, setQrIsUrl] = useState(false);
  const [qrError, setQrError] = useState('');
  const [qrDecoding, setQrDecoding] = useState(false);
  const fileInputRef = useRef(null);

  // Submit URL Check
  const handleCheckUrl = async (urlToCheck) => {
    const targetUrl = (urlToCheck || urlInput).trim();
    if (!targetUrl) {
      setErrorMessage('Please enter or paste a website address to check.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setResult(null);

    try {
      const res = await apiClient.checkLink({
        url: targetUrl,
        include_reputation: true
      });
      setResult(res);
    } catch (err) {
      setErrorMessage(err.message || 'Unable to complete link check. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // QR File Handling
  const handleFileSelect = (file) => {
    if (!file) return;
    setQrError('');
    setQrPayload('');
    setQrIsUrl(false);
    setQrFile(file);

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setQrError('File is too large. Please select an image under 5 MB.');
      return;
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setQrError('Unsupported file type. Please upload a PNG, JPEG, or WebP image.');
      return;
    }

    setQrDecoding(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const decoded = jsQR(imageData.data, imageData.width, imageData.height);

        setQrDecoding(false);
        if (decoded && decoded.data) {
          const payload = decoded.data.trim();
          setQrPayload(payload);
          const isWebUrl = /^https?:\/\//i.test(payload) || /^[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(payload);
          setQrIsUrl(isWebUrl);
        } else {
          setQrError("We couldn't find a readable QR code in this image. Try a clearer image showing the full code.");
        }
      };
      img.onerror = () => {
        setQrDecoding(false);
        setQrError('Could not process this image. Please try another file.');
      };
      img.src = e.target.result;
    };
    reader.onerror = () => {
      setQrDecoding(false);
      setQrError('Failed to read the selected file.');
    };
    reader.readAsDataURL(file);
  };

  // Copy Summary with Redaction
  const handleCopySummary = () => {
    if (!result) return;
    const cleanUrl = result.normalized_url.split('?')[0];
    const text = [
      '--- ClearPay Link Safety Summary ---',
      `Status: ${result.status}`,
      `Address: ${cleanUrl}`,
      `Summary: ${result.summary}`,
      `Checks: Syntax (${result.checks?.syntax || 'passed'}), Host (${result.checks?.host_analysis || 'completed'}), Reputation (${result.checks?.reputation || 'unavailable'})`,
      result.findings && result.findings.length > 0
        ? `Findings: ${result.findings.map((f) => f.title).join('; ')}`
        : 'Findings: No specific indicator flags found.',
      'Notice: This assessment is advisory guidance. Unknown does not mean safe.'
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleReset = () => {
    setUrlInput('');
    setResult(null);
    setErrorMessage('');
    setQrFile(null);
    setQrPayload('');
    setQrError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="checklink-page">
      {/* Top Header */}
      <header className="checklink-header">
        <nav className="checklink-nav-container" aria-label="Main Navigation">
          <div className="checklink-brand" onClick={onNavigateHome}>
            <div className="checklink-brand-logo" aria-hidden="true">C</div>
            <div className="checklink-brand-text">
              <span className="checklink-brand-name">ClearPay</span>
              <span className="checklink-brand-tagline">Safety Assistant</span>
            </div>
          </div>

          <ul className="checklink-nav-links">
            <li>
              <button
                type="button"
                onClick={onNavigateHome}
                className="checklink-nav-link"
              >
                How it works
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={onNavigateHome}
                className="checklink-nav-link"
              >
                Learn
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setPrivacyModalOpen(true)}
                className="checklink-nav-link"
              >
                Privacy
              </button>
            </li>
          </ul>

          <button
            type="button"
            onClick={onNavigateHome}
            className="checklink-back-btn"
          >
            ← Back to home
          </button>
        </nav>
      </header>

      <main className="checklink-container">
        {/* Breadcrumb & Title Section */}
        <div className="checklink-top-section">
          <div className="checklink-breadcrumbs">
            <a href="/" onClick={(e) => { e.preventDefault(); onNavigateHome(); }}>Home</a>
            {' / '}
            <span>Link & QR Checker</span>
          </div>

          <div className="checklink-eyebrow">CHECK BEFORE YOU CLICK</div>
          <h1 className="checklink-title">Check a link before you open it.</h1>
          <p className="checklink-subhead">
            Paste a website address or check where a QR code leads. We'll help you spot warning signs without opening the link for you.
          </p>

          {/* Privacy Banner */}
          <div className="checklink-privacy-banner" role="region" aria-label="Privacy guarantee">
            <div className="checklink-privacy-left">
              <CheckCircle2 className="checklink-privacy-icon" />
              <div>
                <span className="checklink-privacy-text-title">Your safety comes first</span>
                <span className="checklink-privacy-text-desc">
                  We check the address you provide. We don't open the website or ask for bank details.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPrivacyModalOpen(true)}
              className="checklink-privacy-link"
            >
              Privacy details →
            </button>
          </div>
        </div>

        {/* Live Result View (if check has run) */}
        {result && (
          <section className="checklink-result-card" aria-label="Check Result">
            <div className={`checklink-result-status-banner ${result.status}`}>
              {result.status === 'known_threat' && <AlertCircle className="checklink-amber-icon" style={{ color: '#dc2626' }} />}
              {result.status === 'suspicious_indicators' && <AlertTriangle className="checklink-amber-icon" style={{ color: '#ea580c' }} />}
              {result.status === 'unverified' && <AlertTriangle className="checklink-amber-icon" style={{ color: '#d97706' }} />}
              {result.status === 'no_known_threat_found' && <ShieldCheck className="checklink-amber-icon" style={{ color: '#16a34a' }} />}
              {result.status === 'invalid_input' && <AlertCircle className="checklink-amber-icon" style={{ color: '#4338ca' }} />}
              {result.status === 'check_unavailable' && <AlertCircle className="checklink-amber-icon" style={{ color: '#64748b' }} />}

              <div>
                <h3 className="checklink-result-status-title">
                  {result.status === 'known_threat' && '🚨 Flagged Threat / Fake Link Detected'}
                  {result.status === 'suspicious_indicators' && '⚠ Suspicious / Deceptive Signals Found'}
                  {result.status === 'unverified' && '⚠ Unverified / Unrecognized Web Domain'}
                  {result.status === 'no_known_threat_found' && 'No Known Threat in Checked Sources (Verify Independently)'}
                  {result.status === 'invalid_input' && 'Address Looks Incomplete or Invalid'}
                  {result.status === 'check_unavailable' && 'Check Unavailable Right Now'}
                </h3>
                <p className="checklink-result-status-summary">{result.summary}</p>
              </div>
            </div>

            <div>
              <strong>Address reviewed: </strong>
              <code style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px' }}>
                {result.normalized_url}
              </code>
            </div>

            {/* Platform Identification Badge */}
            {result.platform_name && (
              <div className="checklink-platform-identity">
                <div className="platform-identity-left">
                  <div className="platform-icon-wrap">
                    {result.platform_category === 'payment_gateway' ? (
                      <CreditCard size={22} color="#16a34a" />
                    ) : (
                      <Globe size={22} color="#16a34a" />
                    )}
                  </div>
                  <div>
                    <span className="platform-tag">
                      {result.platform_category === 'payment_gateway'
                        ? 'Verified Payment Gateway'
                        : result.platform_category === 'subscription_platform'
                        ? 'Verified Subscription Service'
                        : 'Official Institutional Domain'}
                    </span>
                    <h4 className="platform-title">{result.platform_name}</h4>
                  </div>
                </div>
                {result.is_checkout_detected && (
                  <span className="checkout-active-pill">
                    💳 Payment Checkout / Billing Detected
                  </span>
                )}
              </div>
            )}

            {/* Checks Table */}
            <table className="checklink-checks-table">
              <thead>
                <tr>
                  <th>Check Type</th>
                  <th>Inspection Result</th>
                  <th>Safety Explanation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Address Syntax & Structure</td>
                  <td>
                    {result.checks?.syntax === 'passed' ? (
                      <span style={{ color: '#475569', fontWeight: 600 }}>
                        Parseable URL Format
                      </span>
                    ) : (
                      <span style={{ color: '#dc2626', fontWeight: 600 }}>
                        Incomplete / Malformed
                      </span>
                    )}
                  </td>
                  <td>
                    {result.checks?.syntax === 'passed'
                      ? 'The address follows standard web link notation. (Note: Anyone, including scammers and fake link generators, can create a parseable link format).'
                      : 'The address is cut off or missing essential web components.'}
                  </td>
                </tr>
                <tr>
                  <td>Domain & Institutional Verification</td>
                  <td>
                    {result.platform_name ? (
                      <span style={{ color: '#16a34a', fontWeight: 700 }}>
                        ✓ {result.platform_name} ({result.platform_category?.replace('_', ' ') || 'Verified'})
                      </span>
                    ) : result.status === 'known_threat' ? (
                      <span style={{ color: '#dc2626', fontWeight: 700 }}>
                        🚨 Flagged Fake / Threat Generator
                      </span>
                    ) : result.status === 'suspicious_indicators' ? (
                      <span style={{ color: '#ea580c', fontWeight: 700 }}>
                        ⚠️ Suspicious / Deceptive Signals
                      </span>
                    ) : result.status === 'unverified' ? (
                      <span style={{ color: '#d97706', fontWeight: 700 }}>
                        ⚠️ Unrecognized / Unverified Domain
                      </span>
                    ) : result.status === 'no_known_threat_found' ? (
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>
                        Verified Official Institution / Service
                      </span>
                    ) : result.status === 'invalid_input' ? (
                      <span style={{ color: '#4338ca', fontWeight: 600 }}>
                        Invalid Host / Scheme
                      </span>
                    ) : (
                      <span style={{ color: '#64748b', fontWeight: 600 }}>
                        Directory Lookup Unavailable
                      </span>
                    )}
                  </td>
                  <td>
                    {result.platform_name
                      ? `Confirmed authentic official domain belonging to ${result.platform_name}. Checked against verified financial and merchant registries.`
                      : result.status === 'known_threat'
                      ? 'Matches known fake link generators, IP loggers, brand typosquatting, or malicious downloads.'
                      : result.status === 'suspicious_indicators'
                      ? 'Contains fake link clues, deceptive lure keywords, or concealment shorteners.'
                      : result.status === 'unverified'
                      ? 'Not listed in verified banking or official payment directories. Anyone can register new domains; verify independently and avoid entering sensitive credentials.'
                      : result.status === 'no_known_threat_found'
                      ? 'Matches verified institutional / payment service directory with valid HTTPS encryption.'
                      : result.status === 'invalid_input'
                      ? 'Destination host or scheme could not be verified.'
                      : 'Verification services could not complete at this time.'}
                  </td>
                </tr>
                <tr>
                  <td>Reputation & Threat Feeds</td>
                  <td>
                    {result.status === 'known_threat' ? (
                      <span style={{ color: '#dc2626', fontWeight: 700 }}>
                        Threat Match Reported
                      </span>
                    ) : result.status === 'no_known_threat_found' ? (
                      <span style={{ color: '#2563eb', fontWeight: 600 }}>
                        No Known Threat Match
                      </span>
                    ) : (
                      <span style={{ color: '#64748b', fontWeight: 600 }}>
                        Unlisted / Unverified
                      </span>
                    )}
                  </td>
                  <td>
                    {result.status === 'known_threat'
                      ? 'Heuristic and signature detectors flagged this destination as potentially harmful.'
                      : 'Newly created fake link generator domains frequently have zero public reports during their first 24-48 hours. Absence of reports is NOT proof of safety.'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Multi-Parameter Evaluation Scorecard */}
            {result.multi_parameter_scorecard && (
              <div className="checklink-scorecard-section">
                <h4 style={{ margin: '0 0 12px', fontSize: '15px', color: '#0f172a' }}>
                  Multi-Parameter Security Scorecard
                </h4>
                <div className="checklink-scorecard-grid">
                  {Object.entries(result.multi_parameter_scorecard).map(([key, item]) => (
                    <div key={key} className={`scorecard-item ${item.status || ''}`}>
                      <div className="scorecard-header">
                        <span className="scorecard-label">{item.parameter}</span>
                        <span className={`scorecard-badge ${item.status || ''}`}>
                          {item.status?.toUpperCase()}
                        </span>
                      </div>
                      <p className="scorecard-details">{item.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contextual Safety Guidance */}
            {result.safety_guidance && (
              <div className="checklink-guidance-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <ShieldCheck size={18} color="#059669" />
                  <strong style={{ color: '#065f46', fontSize: '14px' }}>Payment & Subscription Guidance</strong>
                </div>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#047857', lineHeight: 1.5 }}>
                  {result.safety_guidance}
                </p>
              </div>
            )}

            {/* Findings List */}
            {result.findings && result.findings.length > 0 && (
              <div className="checklink-findings-section">
                <h4 style={{ margin: '0 0 10px', fontSize: '15px' }}>Warning signs found:</h4>
                {result.findings.map((f, i) => (
                  <div key={i} className="checklink-finding-item">
                    <div className="checklink-finding-title">{f.title}</div>
                    <p className="checklink-finding-desc">{f.description}</p>
                    {f.evidence && (
                      <div style={{ fontSize: '12px', color: '#7c2d12', marginTop: '4px' }}>
                        Clue: <code>{f.evidence}</code>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '15px' }}>What to do next:</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#334155', fontSize: '14px' }}>
                  {result.recommendations.map((rec, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="checklink-result-actions">
              <button
                type="button"
                onClick={handleReset}
                className="checklink-action-btn primary"
              >
                <RotateCcw size={16} /> Check another link
              </button>
              <button
                type="button"
                onClick={handleCopySummary}
                className="checklink-action-btn secondary"
              >
                {copied ? <Check size={16} color="#16a34a" /> : <Copy size={16} />}
                {copied ? 'Summary copied!' : 'Copy summary'}
              </button>
              <button
                type="button"
                onClick={onNavigateGuided}
                className="checklink-action-btn secondary"
              >
                Get step-by-step guidance →
              </button>
              {onNavigateAnalyze && (
                <button
                  type="button"
                  onClick={onNavigateAnalyze}
                  className="checklink-action-btn secondary"
                >
                  Analyze full message →
                </button>
              )}
            </div>
          </section>
        )}

        {/* Two-Column Primary Workspace */}
        <div className="checklink-workspace-grid">
          {/* Left Column: Input Form Card */}
          <div className="checklink-card">
            <h2 className="checklink-card-title">Check a link or QR code</h2>
            <p className="checklink-card-subtitle">
              Choose how you want to share the address for checking.
            </p>

            {/* Mode Selector Tabs */}
            <div className="checklink-mode-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'url'}
                className={`checklink-mode-tab ${mode === 'url' ? 'active' : ''}`}
                onClick={() => setMode('url')}
              >
                <LinkIcon size={16} /> Website link
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'qr'}
                className={`checklink-mode-tab ${mode === 'qr' ? 'active' : ''}`}
                onClick={() => setMode('qr')}
              >
                <QrCode size={16} /> QR code
              </button>
            </div>

            {/* Mode 1: URL Input Form */}
            {mode === 'url' && (
              <form onSubmit={(e) => { e.preventDefault(); handleCheckUrl(); }}>
                <div className="checklink-form-group">
                  <label htmlFor="url-input" className="checklink-field-label">
                    WEBSITE ADDRESS
                  </label>
                  <div className="checklink-input-wrapper">
                    <LinkIcon className="checklink-input-prefix-icon" aria-hidden="true" />
                    <input
                      id="url-input"
                      type="text"
                      className="checklink-url-input"
                      placeholder="https://paste-a-link-here.com"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      disabled={loading}
                      autoComplete="off"
                      spellCheck="false"
                    />
                    {urlInput && (
                      <button
                        type="button"
                        className="checklink-input-clear-btn"
                        onClick={() => setUrlInput('')}
                        aria-label="Clear link input"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <div className="checklink-field-hint">
                    Paste the full address, including https://, when available.
                  </div>
                </div>

                {errorMessage && (
                  <div style={{ color: '#dc2626', fontSize: '13px', marginBottom: '12px', display: 'flex', gap: '6px' }}>
                    <AlertCircle size={16} /> {errorMessage}
                  </div>
                )}

                <div className="checklink-reassurance-note">
                  We'll check the address, not open the website.
                </div>

                <button
                  type="submit"
                  className="checklink-submit-btn"
                  disabled={loading || !urlInput.trim()}
                >
                  <LinkIcon size={18} />
                  {loading ? 'Checking address...' : 'Check link →'}
                </button>

                <p className="checklink-prototype-note">
                  In the prototype, live checking uses the local safety engine service. Unknown destinations stay unverified.
                </p>

                <div className="checklink-info-box">
                  <FileText className="checklink-info-box-icon" />
                  <span>Works for links copied from SMS, chat, email, social posts, or websites.</span>
                </div>
              </form>
            )}

            {/* Mode 2: QR Code Mode */}
            {mode === 'qr' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />

                {!qrFile && (
                  <div
                    className="checklink-qr-dropzone"
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                  >
                    <Upload className="checklink-qr-dropzone-icon" />
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', marginBottom: '4px' }}>
                      Click to upload a QR code image
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      Supports PNG, JPG, or WebP up to 5 MB
                    </div>
                  </div>
                )}

                {qrDecoding && (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#2563eb' }}>
                    Decoding QR code image...
                  </div>
                )}

                {qrError && (
                  <div style={{ color: '#dc2626', fontSize: '13.5px', marginTop: '14px', background: '#fef2f2', padding: '10px 14px', borderRadius: '8px' }}>
                    {qrError}
                    <div style={{ marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => { setQrFile(null); setQrError(''); }}
                        className="checklink-action-btn secondary"
                        style={{ padding: '6px 12px', fontSize: '12.5px' }}
                      >
                        Try another image
                      </button>
                    </div>
                  </div>
                )}

                {qrFile && qrPayload && (
                  <div className="checklink-qr-preview-box">
                    <div className="checklink-qr-preview-header">
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                        Decoded QR Code Destination:
                      </span>
                      <button
                        type="button"
                        onClick={() => { setQrFile(null); setQrPayload(''); }}
                        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Change image
                      </button>
                    </div>

                    <div className="checklink-qr-payload-text">
                      {qrPayload}
                    </div>

                    {qrIsUrl ? (
                      <div style={{ marginTop: '16px' }}>
                        <div style={{ fontSize: '13px', color: '#166534', marginBottom: '8px', fontWeight: 600 }}>
                          ✓ Website destination detected. Review before checking:
                        </div>
                        <button
                          type="button"
                          className="checklink-submit-btn"
                          disabled={loading}
                          onClick={() => handleCheckUrl(qrPayload)}
                        >
                          <LinkIcon size={18} />
                          {loading ? 'Checking link...' : 'Check this link →'}
                        </button>
                      </div>
                    ) : (
                      <div style={{ marginTop: '14px', background: '#eff6ff', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#1e40af' }}>
                        <strong>Non-URL QR Code:</strong> This QR code contains plain text or a payment string rather than a web address. ClearPay will not open it as a website.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: "What we look for" Card */}
          <div className="checklink-card">
            <h2 className="checklink-card-title">What we look for</h2>
            <p className="checklink-card-subtitle">
              A check has limits, so we show what we could verify.
            </p>

            <div className="checklink-lookfor-item">
              <div className="checklink-lookfor-icon-badge blue" aria-hidden="true">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="checklink-lookfor-title">Address format</h3>
                <p className="checklink-lookfor-desc">Is the URL complete and structured correctly?</p>
              </div>
            </div>

            <div className="checklink-lookfor-item">
              <div className="checklink-lookfor-icon-badge red" aria-hidden="true">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="checklink-lookfor-title">Lookalike clues</h3>
                <p className="checklink-lookfor-desc">Odd spellings, extra subdomains, or misleading names.</p>
              </div>
            </div>

            <div className="checklink-lookfor-item">
              <div className="checklink-lookfor-icon-badge green" aria-hidden="true">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="checklink-lookfor-title">Known threat reports</h3>
                <p className="checklink-lookfor-desc">Check a reputation source when available.</p>
              </div>
            </div>

            <div className="checklink-lookfor-item">
              <div className="checklink-lookfor-icon-badge purple" aria-hidden="true">
                <QrCode size={20} />
              </div>
              <div>
                <h3 className="checklink-lookfor-title">QR destination</h3>
                <p className="checklink-lookfor-desc">Read the address encoded in an image.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Amber Warning Banner */}
        <div className="checklink-amber-banner" role="region" aria-label="Unknown safety note">
          <AlertTriangle className="checklink-amber-icon" />
          <div>
            <span className="checklink-amber-title">Unknown doesn't mean safe.</span>
            <span className="checklink-amber-desc">
              A new or unverified address may have no threat reports yet. Don't enter passwords, OTPs, or payment details just because no warning appears.
            </span>
          </div>
        </div>

        {/* Three Outcomes Section */}
        <section className="checklink-outcomes-section" aria-label="Three possible outcomes">
          <div className="checklink-outcomes-eyebrow">UNDERSTAND THE RESULT</div>
          <h2 className="checklink-outcomes-title">Three possible outcomes</h2>
          <p className="checklink-outcomes-subhead">
            We won't label an address safe if it hasn't been properly checked.
          </p>

          <div className="checklink-outcomes-grid">
            <div className="checklink-outcome-card">
              <div className="checklink-outcome-badge unknown">// UNKNOWN</div>
              <h3 className="checklink-outcome-title">Unverified</h3>
              <p className="checklink-outcome-desc">
                We couldn't confirm whether this address is trustworthy. Treat it with care.
              </p>
            </div>

            <div className="checklink-outcome-card">
              <div className="checklink-outcome-badge caution">⚠ CAUTION</div>
              <h3 className="checklink-outcome-title">Suspicious signs found</h3>
              <p className="checklink-outcome-desc">
                The address has clues worth checking before you visit it.
              </p>
            </div>

            <div className="checklink-outcome-card">
              <div className="checklink-outcome-badge fix">! NEEDS FIXING</div>
              <h3 className="checklink-outcome-title">Invalid or incomplete</h3>
              <p className="checklink-outcome-desc">
                The address may be cut off or written incorrectly. Get the full link from a trusted source.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom Lock Reassurance Banner */}
        <div className="checklink-bottom-reassurance" role="region" aria-label="Safe browsing note">
          <Lock className="checklink-lock-icon" />
          <div>
            <span className="checklink-bottom-title">We never follow suspicious links for you.</span>
            <span className="checklink-bottom-desc">
              You choose whether to visit the official website after checking the result.
            </span>
          </div>
        </div>

        {/* Footer */}
        <footer className="checklink-footer">
          <div className="checklink-footer-left">
            <span className="checklink-footer-brand">ClearPay</span>
            <span>Educational guidance only. No checker can guarantee that a link is safe.</span>
          </div>

          <div className="checklink-footer-links">
            <button type="button" onClick={() => setPrivacyModalOpen(true)}>Privacy</button>
            <button type="button" onClick={onNavigateGuided}>Help & FAQ</button>
          </div>
        </footer>
      </main>

      {/* Privacy Guarantee Modal */}
      {privacyModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 100
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={24} color="#16a34a" />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  Our Privacy Guarantee
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPrivacyModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
              <p>
                <strong>Zero credential collection:</strong> ClearPay never asks for, records, or logs OTPs, PINs, passwords, or bank login credentials.
              </p>
              <p>
                <strong>No arbitrary website crawling:</strong> We inspect web addresses in-memory using syntactic and domain heuristics. Our servers never connect directly to or follow redirects from user-submitted addresses.
              </p>
              <p>
                <strong>On-device image decoding:</strong> QR code images are decoded locally in your browser memory and are never uploaded or permanently stored on our servers.
              </p>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setPrivacyModalOpen(false)}
                className="checklink-action-btn primary"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
