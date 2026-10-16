import React, { useState, useRef } from 'react';
import { Link as LinkIcon, QrCode, RotateCcw, ShieldCheck, Upload } from 'lucide-react';
import jsQR from 'jsqr';
import Button from './ui/Button';
import Input from './ui/Input';
import Textarea from './ui/Textarea';
import Alert from './ui/Alert';

export default function UrlQrCheck({ onAnalyzeUrl, onAnalyzeQr, loading }) {
  const [subTab, setSubTab] = useState('url'); // 'url' | 'qr'
  const [urlInput, setUrlInput] = useState('');
  const [urlContext, setUrlContext] = useState('');
  
  // QR states
  const [qrPayload, setQrPayload] = useState('');
  const [qrContext, setQrContext] = useState('Buyer told me to scan this to receive payment');
  const [qrImagePreview, setQrImagePreview] = useState(null);
  const [qrError, setQrError] = useState(null);
  const fileInputRef = useRef(null);

  // URL Submit
  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (!urlInput.trim() || loading) return;
    onAnalyzeUrl({
      url: urlInput.trim(),
      context: urlContext.trim() || undefined
    });
  };

  // QR Image Decoder with jsQR
  const handleQrFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrError(null);
    setQrPayload('');

    const previewUrl = URL.createObjectURL(file);
    setQrImagePreview(previewUrl);

    const img = new Image();
    img.src = previewUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, img.width, img.height);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && code.data) {
        setQrPayload(code.data);
      } else {
        setQrError('No readable QR code found in this image. Please upload a clear image of the QR code or enter the payload text manually.');
      }
    };
    img.onerror = () => {
      setQrError('Failed to load image file.');
    };
  };

  const handleQrSubmit = (e) => {
    e.preventDefault();
    if (!qrPayload.trim() || loading) return;
    onAnalyzeQr({
      payload: qrPayload.trim(),
      context: qrContext.trim() || undefined
    });
  };

  return (
    <div className="url-qr-container" aria-label="Link and QR Code Safety Inspector">
      {/* Sub tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={() => setSubTab('url')}
          className={`tab-btn ${subTab === 'url' ? 'active' : ''}`}
          style={{ flex: 1 }}
          aria-selected={subTab === 'url'}
        >
          <LinkIcon size={16} aria-hidden="true" /> Link / URL Inspector
        </button>
        <button
          type="button"
          onClick={() => setSubTab('qr')}
          className={`tab-btn ${subTab === 'qr' ? 'active' : ''}`}
          style={{ flex: 1 }}
          aria-selected={subTab === 'qr'}
        >
          <QrCode size={16} aria-hidden="true" /> QR Code Inspector
        </button>
      </div>

      {subTab === 'url' ? (
        <form onSubmit={handleUrlSubmit}>
          <Input
            id="url-input"
            label="Paste Suspicious Link / Web Address:"
            helperText="We inspect the domain, structure, and security reputation safely WITHOUT opening the link in your browser."
            placeholder="e.g. http://sbi-kyc-verify.top/update.apk or https://bit.ly/bank-reward"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            required
          />

          <Input
            id="url-context"
            label="Context or Claim (Optional):"
            placeholder="e.g. Received via SMS claiming my KYC is expired..."
            value={urlContext}
            onChange={(e) => setUrlContext(e.target.value)}
          />

          <div className="btn-row">
            <Button
              type="submit"
              variant="primary"
              disabled={urlInput.trim().length < 3 || loading}
              loading={loading}
              loadingText="Inspecting Link..."
              leftIcon={ShieldCheck}
            >
              Inspect Link Safely
            </Button>
            {urlInput && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setUrlInput(''); setUrlContext(''); }}
                disabled={loading}
                leftIcon={RotateCcw}
              >
                Clear
              </Button>
            )}
          </div>

          {/* Quick preset links for demonstration */}
          <div className="scenarios-section" style={{ marginTop: '1.5rem' }}>
            <div className="scenarios-title">
              Try Test Links (Click to inspect):
            </div>
            <div className="scenarios-grid">
              <button
                type="button"
                className="scenario-pill"
                onClick={() => {
                  setUrlInput('http://sbi-kyc-verify.top/update.apk');
                  setUrlContext('SMS claiming KYC blocked');
                }}
              >
                <span aria-hidden="true">⚠️ </span> Phishing APK Link (sbi-kyc-verify.top)
              </button>
              <button
                type="button"
                className="scenario-pill"
                onClick={() => {
                  setUrlInput('https://bit.ly/hdfc-refund-cash');
                  setUrlContext('WhatsApp message offering refund');
                }}
              >
                <span aria-hidden="true">⚠️ </span> Shortened Link (bit.ly/hdfc-refund)
              </button>
              <button
                type="button"
                className="scenario-pill legit-pill"
                onClick={() => {
                  setUrlInput('https://onlinesbi.sbi/personal/index.html');
                  setUrlContext('Official Netbanking portal');
                }}
              >
                <span aria-hidden="true">✓ </span> Official Bank Website (onlinesbi.sbi)
              </button>
            </div>
          </div>
        </form>
      ) : (
        <form onSubmit={handleQrSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label" id="qr-upload-label">
              Upload QR Code Image or Enter QR Content:
            </label>
            <p className="form-help">
              We decode the QR payload on-device and verify whether it is an outgoing payment or suspicious intent.
            </p>

            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem 1rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'var(--color-bg-subtle)',
                marginBottom: '1rem'
              }}
              aria-labelledby="qr-upload-label"
            >
              <Upload size={28} style={{ color: 'var(--primary)', margin: '0 auto 0.5rem' }} aria-hidden="true" />
              <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                {qrImagePreview ? 'Click to select a different QR image' : 'Upload or Drag & Drop QR Image'}
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                PNG, JPG, WebP • Decoded privately in your browser
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleQrFileChange}
                style={{ display: 'none' }}
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>

            {qrImagePreview && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--color-bg-surface)', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                <img src={qrImagePreview} alt="QR preview" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
                <div style={{ fontSize: 'var(--font-size-sm)' }}>
                  {qrPayload ? (
                    <span style={{ color: 'var(--color-success-700)', fontWeight: 'var(--font-weight-semibold)' }}>✓ QR code decoded successfully</span>
                  ) : (
                    <span style={{ color: 'var(--warning)' }}>Decoding QR...</span>
                  )}
                </div>
              </div>
            )}

            {qrError && (
              <Alert variant="error" onDismiss={() => setQrError(null)}>
                {qrError}
              </Alert>
            )}

            <Textarea
              id="qr-payload"
              label="Decoded QR Payload / String:"
              placeholder="e.g. upi://pay?pa=recipient@upi&pn=Store&am=100 or web link"
              value={qrPayload}
              onChange={(e) => setQrPayload(e.target.value)}
              rows={3}
              style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-xs)' }}
              required
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" htmlFor="qr-context">
              What did the other person tell you about this QR?
            </label>
            <select
              id="qr-context"
              className="guided-select"
              value={qrContext}
              onChange={(e) => setQrContext(e.target.value)}
            >
              <option value="Buyer told me to scan this to receive payment for an item">
                Buyer told me to scan to RECEIVE payment (e.g. OLX / Marketplace)
              </option>
              <option value="Caller told me to scan to receive a refund or cashback">
                Caller said to scan to receive a REFUND or CASHBACK
              </option>
              <option value="I want to make a normal payment at a merchant store">
                Normal payment to merchant / billing counter
              </option>
              <option value="Received from an unknown person or contest">
                Received in contest, lucky draw, or unknown message
              </option>
            </select>
          </div>

          <div className="btn-row">
            <Button
              type="submit"
              variant="primary"
              disabled={!qrPayload.trim() || loading}
              loading={loading}
              loadingText="Analyzing QR..."
              leftIcon={ShieldCheck}
            >
              Inspect QR Code Safely
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setQrPayload('');
                setQrImagePreview(null);
                setQrError(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              disabled={loading}
              leftIcon={RotateCcw}
            >
              Reset
            </Button>
          </div>

          {/* Quick preset QR payloads */}
          <div className="scenarios-section" style={{ marginTop: '1.5rem' }}>
            <div className="scenarios-title">
              Try Test QR Payloads:
            </div>
            <div className="scenarios-grid">
              <button
                type="button"
                className="scenario-pill"
                onClick={() => {
                  setQrPayload('upi://pay?pa=fraudclaim@oksbi&pn=OLXAdvancePayment&am=3500&tn=ReceiveAdvance');
                  setQrContext('Buyer told me to scan this to receive payment for an item');
                }}
              >
                <span aria-hidden="true">⚠️ </span> OLX "Receive Money" QR Trap
              </button>
              <button
                type="button"
                className="scenario-pill legit-pill"
                onClick={() => {
                  setQrPayload('upi://pay?pa=cornerstore@icici&pn=CornerGrocery&am=120&cu=INR');
                  setQrContext('I want to make a normal payment at a merchant store');
                }}
              >
                <span aria-hidden="true">✓ </span> Standard Grocery Merchant QR
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
