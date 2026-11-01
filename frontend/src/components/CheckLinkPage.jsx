import React, { useState, useRef, useEffect } from 'react';
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
  Globe,
  Camera,
  CameraOff,
  PhoneCall
} from 'lucide-react';
import jsQR from 'jsqr';
import apiClient from '../services/apiClient';
import '../styles/checkLink.css';

const SAMPLE_QR_SCENARIOS = [
  {
    label: '⚠️ Amazon Refund Trap',
    payload: 'upi://pay?pa=refundamazon@okhdfc&pn=Unknown&am=2500&cu=INR&tn=Headphones%20order',
    context: 'Caller claiming to be Amazon support told me to scan this to get refund for damaged headphones'
  },
  {
    label: '⚠️ OLX Reverse Collect',
    payload: 'upi://pay?pa=buyeradvance@okaxis&pn=BuyerOLX&am=4500&cu=INR&tn=Advance%20Payment',
    context: 'Buyer told me to scan this QR and enter UPI PIN to receive ₹4,500 advance for sofa'
  },
  {
    label: '✓ Daily Grocery (Sharma Tea)',
    payload: 'upi://pay?pa=sharmateastall@icici&pn=Sharma%20Tea%20Stall&am=40&cu=INR&mc=5411',
    context: 'Counter QR code at local tea stall'
  },
  {
    label: '⚠️ Fake Bank KYC Web Link',
    payload: 'http://sbi-kyc-update.top/login.apk',
    context: 'QR code asking to update PAN'
  }
];

export default function CheckLinkPage({ onNavigateHome, onNavigateAnalyze, onNavigateGuided }) {
  const [mode, setMode] = useState('url'); // 'url' | 'qr'
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  // QR Payment Analyzer State
  const [_qrFile, setQrFile] = useState(null);
  const [qrPayload, setQrPayload] = useState('');
  const [qrResult, setQrResult] = useState(null);
  const [qrContext, setQrContext] = useState('');
  const [qrError, setQrError] = useState('');
  const [qrDecoding, setQrDecoding] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);

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

  // Camera cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Analyze QR payload string directly
  const handleAnalyzeQrPayload = async (rawPayload, contextText = '') => {
    if (!rawPayload || !rawPayload.trim()) return;
    setLoading(true);
    setQrError('');
    setQrResult(null);

    try {
      const res = await apiClient.checkQr({
        payload: rawPayload.trim(),
        context: contextText || qrContext.trim() || undefined
      });
      setQrResult(res);
      setQrPayload(rawPayload.trim());
    } catch (err) {
      setQrError(err.message || 'Unable to complete QR code safety analysis.');
    } finally {
      setLoading(false);
    }
  };

  // Decode with client-side jsQR fallback
  const decodeWithJsQr = (file) => {
    return new Promise((resolve, reject) => {
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
          if (decoded && decoded.data) {
            resolve(decoded.data.trim());
          } else {
            resolve(null);
          }
        };
        img.onerror = () => reject(new Error('Failed to load image file.'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });
  };

  // Upload QR Image Handling (Backend zxing-cpp + Client jsQR fallback)
  const handleFileSelect = async (file) => {
    if (!file) return;
    setQrError('');
    setCameraError('');
    setQrResult(null);
    setQrPayload('');
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

    // 1. Primary: Send directly to backend Python zxing-cpp + Pillow decoder
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (qrContext.trim()) {
        formData.append('context', qrContext.trim());
      }
      const res = await apiClient.checkQrImage(formData);
      setQrResult(res);
      setQrPayload(res.raw_payload_preview || '');
      setQrDecoding(false);
      return;
    } catch (backendErr) {
      // 2. Secondary: Client-side jsQR Canvas decode fallback
      try {
        const clientPayload = await decodeWithJsQr(file);
        if (clientPayload) {
          setQrPayload(clientPayload);
          const res = await apiClient.checkQr({
            payload: clientPayload,
            context: qrContext.trim() || undefined
          });
          setQrResult(res);
          setQrDecoding(false);
          return;
        } else {
          setQrError(backendErr.message || "No readable QR code found in this image. Please ensure the QR code is clearly visible and well-lit.");
        }
      } catch (clientErr) {
        setQrError(backendErr.message || clientErr.message || "Failed to decode QR code. Please try another image.");
      }
    } finally {
      setQrDecoding(false);
    }
  };

  // Camera Management
  const startCamera = async () => {
    setCameraError('');
    setQrError('');
    setQrResult(null);
    setIsCameraActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        animFrameRef.current = requestAnimationFrame(scanCameraFrame);
      }
    } catch {
      setIsCameraActive(false);
      setCameraError('Camera access not granted or unavailable on this device. Please use "Upload QR Image".');
    }
  };

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const scanCameraFrame = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      if (streamRef.current) {
        animFrameRef.current = requestAnimationFrame(scanCameraFrame);
      }
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code && code.data) {
      stopCamera();
      handleAnalyzeQrPayload(code.data);
    } else if (streamRef.current) {
      animFrameRef.current = requestAnimationFrame(scanCameraFrame);
    }
  };

  // Copy QR Summary
  const handleCopyQrSummary = () => {
    if (!qrResult) return;
    const details = qrResult.payment_details || qrResult.parsed_details || {};
    const text = [
      '--- ClearPay QR Payment Security Assessment ---',
      `Risk Level: ${qrResult.risk_level}`,
      `Risk Score: ${qrResult.risk_score}/100`,
      `Type: ${qrResult.payload_type.toUpperCase()}`,
      details.payee_name ? `Recipient Name: ${details.payee_name}` : null,
      details.payee_vpa ? `UPI ID (VPA): ${details.payee_vpa}` : null,
      details.amount ? `Amount: ${details.amount}` : null,
      details.transaction_note ? `Note: ${details.transaction_note}` : null,
      '',
      'Security Findings:',
      ...(qrResult.indicators?.map(i => `• ${i.title || i.name}: ${i.description}`) || ['• Standard format without flagged indicators']),
      '',
      'Recommendations:',
      ...(qrResult.recommended_actions?.map(a => `• ${a}`) || ['• Verify independently in your banking app before entering your PIN']),
      '',
      `Notice: ${qrResult.disclaimer || 'A QR code can only send money. Never enter a UPI PIN to receive money.'}`
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleResetQr = () => {
    stopCamera();
    setQrFile(null);
    setQrPayload('');
    setQrResult(null);
    setQrError('');
    setCameraError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
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

        {/* Live QR Payment Security Report */}
        {qrResult && (
          <section className="checklink-qr-result-container" aria-label="QR Payment Security Report">
            {/* Status Banner */}
            <div className={`checklink-qr-banner ${qrResult.risk_level.toLowerCase()}`}>
              <div className="checklink-qr-banner-left">
                <div className="checklink-qr-banner-icon">
                  {qrResult.risk_level === 'HIGH' && <AlertTriangle size={26} color="#dc2626" />}
                  {qrResult.risk_level === 'MEDIUM' && <AlertCircle size={26} color="#d97706" />}
                  {qrResult.risk_level === 'LOW' && <ShieldCheck size={26} color="#16a34a" />}
                </div>
                <div>
                  <span className="checklink-qr-banner-badge">
                    {qrResult.risk_level === 'HIGH' && 'HIGH RISK • POTENTIAL THREAT'}
                    {qrResult.risk_level === 'MEDIUM' && 'MEDIUM RISK • NEEDS ATTENTION'}
                    {qrResult.risk_level === 'LOW' && 'LOW RISK • STANDARD PAYMENT FORMAT'}
                  </span>
                  <h2 className="checklink-qr-banner-headline">
                    {qrResult.risk_level === 'HIGH' && 'Do not proceed — potential payment manipulation detected.'}
                    {qrResult.risk_level === 'MEDIUM' && 'Caution advised — unverified recipient or pre-filled amount.'}
                    {qrResult.risk_level === 'LOW' && 'Payment format valid. Verify details in your UPI app.'}
                  </h2>
                  <p className="checklink-qr-banner-subtext">
                    {qrResult.uncertainty_note}
                  </p>
                </div>
              </div>
              <div className="checklink-qr-stat-box">
                <div className="checklink-qr-stat-num">{qrResult.indicators?.length || 0}</div>
                <div className="checklink-qr-stat-label">
                  {qrResult.indicators?.length === 1 ? 'warning signal' : 'warning signals'}
                </div>
              </div>
            </div>

            {/* UPI Payment Breakdown & Phone Simulation (Matching Screenshot 3) */}
            {qrResult.payload_type === 'upi_intent' && qrResult.payment_details && (
              <div className="checklink-upi-simulation-wrapper">
                {/* Left: Mobile UPI Screen Mockup (Matching Screenshot 3) */}
                <div className="checklink-phone-mockup" aria-label="Simulated Mobile UPI App Interface">
                  <div className="phone-mockup-header">
                    <button type="button" className="phone-cancel-btn">
                      ← Cancel Payment
                    </button>
                  </div>

                  <div className="phone-amount-display">
                    <div className="phone-currency-amount">
                      {qrResult.payment_details.amount || '₹0.00'}
                    </div>
                    <div className="phone-vpa-handle">
                      {qrResult.payment_details.payee_vpa || 'recipient@upi'}
                    </div>
                    {qrResult.payment_details.transaction_note && (
                      <span className="phone-note-pill">
                        {qrResult.payment_details.transaction_note}
                      </span>
                    )}
                  </div>

                  <div className="phone-recipient-card">
                    <div className="phone-avatar-circle">
                      {(qrResult.payment_details.payee_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="phone-recipient-info">
                      <div className="phone-recipient-name">
                        {qrResult.payment_details.payee_name || 'Unknown'}
                      </div>
                      <div className="phone-recipient-sub">
                        {qrResult.payment_details.payee_vpa}
                      </div>
                    </div>
                    <span className="phone-chevron" aria-hidden="true">▾</span>
                  </div>

                  <button type="button" className="phone-proceed-btn" disabled>
                    Proceed to Payment
                  </button>

                  <div className="phone-scam-alert-callout">
                    🚨 <strong>TRAP WARNING:</strong> Tapping this in PhonePe / GPay / Paytm will debit{' '}
                    <strong>{qrResult.payment_details.amount || 'money'}</strong> from your bank account!
                  </div>

                  {/* Simulated Numeric Keypad */}
                  <div className="phone-keypad-grid" aria-hidden="true">
                    <span>1</span><span>2</span><span>3</span>
                    <span>4</span><span>5</span><span>6</span>
                    <span>7</span><span>8</span><span>9</span>
                    <span>.</span><span>0</span><span>⌫</span>
                  </div>
                </div>

                {/* Right: Technical Breakdown & Inspector */}
                <div className="checklink-payment-details-card" style={{ marginBottom: 0 }}>
                  <div className="checklink-payment-amount-hero">
                    <span className="checklink-payment-amount-label">PAYMENT AMOUNT (OUTGOING DEBIT)</span>
                    <div className="checklink-payment-amount-val">
                      {qrResult.payment_details.amount || 'User enters amount in app'}
                    </div>
                    <span className="checklink-payment-amount-notice">
                      ⚠️ Scanning a QR code can ONLY send money from your account. You NEVER receive money.
                    </span>
                  </div>

                  <div className="checklink-payment-grid">
                    <div className="checklink-payment-item">
                      <span className="checklink-payment-label">RECIPIENT NAME</span>
                      <div className="checklink-payment-value payee-name">
                        {qrResult.payment_details.payee_name || 'Not Provided / Concealed'}
                      </div>
                    </div>

                    <div className="checklink-payment-item">
                      <span className="checklink-payment-label">RECIPIENT UPI ID (VPA)</span>
                      <div className="checklink-payment-value upi-id">
                        <code>{qrResult.payment_details.payee_vpa || 'Missing'}</code>
                      </div>
                    </div>

                    <div className="checklink-payment-item">
                      <span className="checklink-payment-label">TRANSACTION NOTE</span>
                      <div className="checklink-payment-value">
                        {qrResult.payment_details.transaction_note || 'None specified'}
                      </div>
                    </div>

                    <div className="checklink-payment-item">
                      <span className="checklink-payment-label">CURRENCY</span>
                      <div className="checklink-payment-value">
                        {qrResult.payment_details.currency || 'INR'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Two-Column Findings & Actions Grid */}
            <div className="checklink-qr-two-col">
              {/* Left Column: Security Findings */}
              <div className="checklink-qr-card">
                <div className="checklink-qr-card-header">
                  <h3 className="checklink-qr-card-title">Security findings</h3>
                  <span className="checklink-qr-count-badge">
                    {qrResult.indicators?.length || 0} indicators
                  </span>
                </div>

                {qrResult.indicators && qrResult.indicators.length > 0 ? (
                  <div className="checklink-qr-findings-list">
                    {qrResult.indicators.map((ind, idx) => (
                      <div key={idx} className="checklink-qr-finding-item">
                        <div className={`checklink-qr-icon-circle ${ind.severity}`}>
                          {ind.severity === 'high' ? <AlertTriangle size={18} /> : <AlertCircle size={18} />}
                        </div>
                        <div>
                          <div className="checklink-qr-finding-name">{ind.title || ind.name}</div>
                          <p className="checklink-qr-finding-desc">{ind.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="checklink-qr-clean-box">
                    <CheckCircle2 size={20} color="#16a34a" />
                    <span>No suspicious fraud indicators identified in this payment QR code.</span>
                  </div>
                )}
              </div>

              {/* Right Column: Recommended Next Steps */}
              <div className="checklink-qr-card">
                <h3 className="checklink-qr-card-title">Recommended next steps</h3>
                <p className="checklink-qr-card-sub">Follow safe payment practices before authorizing:</p>

                <div className="checklink-qr-steps-list">
                  {qrResult.recommended_actions?.map((action, idx) => (
                    <div key={idx} className="checklink-qr-step-item">
                      <div className="checklink-qr-step-num">{idx + 1}</div>
                      <p className="checklink-qr-step-text">{action}</p>
                    </div>
                  ))}
                  <div className="checklink-qr-step-item">
                    <div className="checklink-qr-step-num">!</div>
                    <p className="checklink-qr-step-text">
                      <strong>Golden Rule:</strong> UPI PIN is ONLY entered to send money. Entering your PIN never deposits or receives funds.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Collapsible Decoded Content */}
            <details className="checklink-qr-raw-accordion">
              <summary className="checklink-qr-raw-summary">
                <span>View Decoded Raw QR Payload</span>
                <span className="checklink-qr-raw-pill">{qrResult.payload_type.toUpperCase()}</span>
              </summary>
              <div className="checklink-qr-raw-body">
                <code>{qrResult.raw_payload_preview || qrPayload}</code>
              </div>
            </details>

            {/* Bottom Actions */}
            <div className="checklink-qr-actions-row">
              <button
                type="button"
                onClick={handleResetQr}
                className="checklink-action-btn primary"
              >
                <RotateCcw size={16} /> Scan another QR code
              </button>

              <button
                type="button"
                onClick={handleCopyQrSummary}
                className="checklink-action-btn secondary"
              >
                {copied ? <Check size={16} color="#16a34a" /> : <Copy size={16} />}
                {copied ? 'Copied summary!' : 'Copy security report'}
              </button>

              <a
                href="tel:1930"
                className="checklink-action-btn secondary"
                style={{ color: '#dc2626', textDecoration: 'none' }}
              >
                <PhoneCall size={15} /> Helpline 1930
              </a>
            </div>
          </section>
        )}

        {/* Live Result View (if URL check has run) */}
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
            {mode === 'qr' && !qrResult && (
              <div className="checklink-qr-scanner-card">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />

                <h2 className="checklink-qr-header-title">QR Scanner</h2>

                {/* Inner Dashed Dropzone matching Screenshot 1 */}
                <div className="checklink-qr-dashed-dropzone">
                  <div className="checklink-qr-icon-hero">
                    <QrCode size={36} />
                  </div>

                  <h3 className="checklink-qr-scanner-title">Scan QR Code</h3>
                  <p className="checklink-qr-scanner-subtitle">
                    Use your camera or upload an image
                  </p>

                  {/* Primary Buttons Row matching Screenshot 1 */}
                  <div className="checklink-qr-btn-row">
                    <button
                      type="button"
                      className="checklink-qr-upload-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading || qrDecoding}
                    >
                      <Upload size={17} />
                      <span>Upload QR Image</span>
                    </button>

                    <button
                      type="button"
                      className="checklink-qr-camera-btn"
                      onClick={isCameraActive ? stopCamera : startCamera}
                      disabled={loading || qrDecoding}
                    >
                      {isCameraActive ? <CameraOff size={17} /> : <Camera size={17} />}
                      <span>{isCameraActive ? 'Close Camera' : 'Use Camera'}</span>
                    </button>
                  </div>
                </div>

                {/* Tips Box Matching Screenshot 1 */}
                <div className="checklink-qr-tips-box">
                  <AlertCircle size={18} style={{ color: '#2563eb', flexShrink: 0, marginTop: '2px' }} />
                  <div className="checklink-qr-tips-text">
                    For best results when uploading an image, ensure the QR code is clearly visible and well-lit. When using camera, hold steady and center the QR code in frame.
                  </div>
                </div>

                {/* Context Input */}
                <div style={{ marginTop: '16px' }}>
                  <label htmlFor="qr-context-input" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                    What did the sender claim? (Optional)
                  </label>
                  <input
                    id="qr-context-input"
                    type="text"
                    className="checklink-url-input"
                    placeholder="e.g. Buyer on OLX sent this to receive money, or caller offered refund..."
                    value={qrContext}
                    onChange={(e) => setQrContext(e.target.value)}
                    style={{ fontSize: '13.5px', padding: '10px 14px' }}
                  />
                </div>

                {/* Live Camera Viewfinder Overlay (Matching Screenshot 2) */}
                {isCameraActive && (
                  <div className="checklink-camera-modal">
                    <video
                      ref={videoRef}
                      playsInline
                      autoPlay
                      muted
                      className="checklink-camera-video"
                    />
                    <div className="checklink-camera-overlay">
                      <div className="checklink-camera-target" />
                      <div className="checklink-camera-target-label">
                        Align QR code within the frame
                      </div>
                    </div>
                    <button
                      type="button"
                      className="checklink-camera-close-btn"
                      onClick={stopCamera}
                      aria-label="Close camera"
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}

                {/* Decoding Progress Indicator */}
                {qrDecoding && (
                  <div style={{ textAlign: 'center', padding: '16px', color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <div style={{ width: '16px', height: '16px', border: '2px solid #93c5fd', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <span>Analyzing QR code with safety engine...</span>
                  </div>
                )}

                {/* Error messages */}
                {(qrError || cameraError) && (
                  <div style={{ color: '#dc2626', fontSize: '13.5px', marginTop: '14px', background: '#fef2f2', padding: '12px 14px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                    {qrError || cameraError}
                  </div>
                )}

                {/* Quick Test Scenarios */}
                <div style={{ marginTop: '22px' }}>
                  <div className="checklink-qr-samples-title">
                    Or Test With Realistic Scenarios (1-Click Demo):
                  </div>
                  <div className="checklink-qr-samples-grid">
                    {SAMPLE_QR_SCENARIOS.map((sc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`checklink-qr-sample-pill ${sc.label.includes('⚠️') ? 'high' : ''}`}
                        onClick={() => {
                          setQrContext(sc.context);
                          handleAnalyzeQrPayload(sc.payload, sc.context);
                        }}
                      >
                        {sc.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* If QR result is active, show small reset banner in input column */}
            {mode === 'qr' && qrResult && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                <CheckCircle2 size={32} color="#16a34a" style={{ margin: '0 auto 8px' }} />
                <h4 style={{ margin: '0 0 6px', fontSize: '16px', color: '#0f172a' }}>QR Code Analysis Completed</h4>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>
                  Review the safety assessment and recipient details above.
                </p>
                <button
                  type="button"
                  onClick={handleResetQr}
                  className="checklink-action-btn primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <RotateCcw size={16} /> Scan Another QR Code
                </button>
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
