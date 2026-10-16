import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Send, RotateCcw, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { createWorker } from 'tesseract.js';

export default function ImageOCRCheck({ onAnalyze, loading }) {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [extractedText, setExtractedText] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const processSelectedFile = (file) => {
    setErrorMessage(null);
    setExtractedText('');

    // File validation: Size < 5MB
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image file is too large. Please select an image under 5 MB.');
      return;
    }

    // File validation: Types
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Unsupported file format. Please upload a PNG, JPG, or WebP screenshot.');
      return;
    }

    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    // Auto-trigger OCR extraction
    runOcrExtraction(file);
  };

  const runOcrExtraction = async (file) => {
    setIsProcessingOcr(true);
    setOcrProgress(10);
    setErrorMessage(null);

    try {
      const worker = await createWorker('eng');
      setOcrProgress(40);
      
      const ret = await worker.recognize(file);
      setOcrProgress(90);
      await worker.terminate();

      const text = ret.data.text.trim();
      setOcrProgress(100);

      if (!text || text.length < 3) {
        setErrorMessage('Could not extract readable text from this image. Please ensure the screenshot is clear or type the message manually.');
      } else {
        setExtractedText(text);
      }
    } catch (err) {
      setErrorMessage('OCR extraction failed. You can still type the text manually in the text check mode.');
    } finally {
      setIsProcessingOcr(false);
    }
  };

  const handleReset = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setExtractedText('');
    setErrorMessage(null);
    setOcrProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!extractedText.trim() || loading) return;
    onAnalyze({ text: extractedText.trim() });
  };

  return (
    <div className="ocr-check-container">
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>
          Screenshot & Image Safety Check
        </h3>
        <p className="form-help">
          Upload a screenshot of a suspicious SMS, WhatsApp message, or payment page. Text is extracted directly on your device.
        </p>
      </div>

      {!imagePreview ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed var(--border-color)',
            borderRadius: '12px',
            padding: '2.5rem 1rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: '#f8fafc',
            transition: 'border-color 0.2s ease'
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) processSelectedFile(e.dataTransfer.files[0]);
          }}
        >
          <Upload size={36} style={{ color: 'var(--primary)', margin: '0 auto 0.75rem' }} />
          <div style={{ fontWeight: 600, fontSize: '0.98rem', color: '#1e293b', marginBottom: '0.25rem' }}>
            Click or drag & drop a screenshot here
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Supports PNG, JPG, WebP (Max 5 MB) • Processed transiently on-device
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/bmp"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          {/* Image Preview Card */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
            <img
              src={imagePreview}
              alt="Uploaded screenshot preview"
              style={{ maxHeight: '110px', maxWidth: '140px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>
                {imageFile?.name}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {(imageFile?.size / 1024).toFixed(1)} KB
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="btn btn-secondary"
                style={{ marginTop: '0.4rem', padding: '0.25rem 0.65rem', fontSize: '0.8rem', minHeight: '32px' }}
              >
                <RotateCcw size={13} /> Change Image
              </button>
            </div>
          </div>

          {/* OCR Processing Progress */}
          {isProcessingOcr && (
            <div style={{ padding: '1rem', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', textAlign: 'center' }}>
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 0.5rem', animation: 'spin 1s linear infinite' }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e40af' }}>
                Extracting text on-device... ({ocrProgress}%)
              </div>
              <div style={{ fontSize: '0.78rem', color: '#3b82f6', marginTop: '0.2rem' }}>
                Your image is not sent to external servers. Optical character recognition runs in your browser.
              </div>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', borderRadius: '8px', margin: '0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Review and Edit Extracted Text */}
      {extractedText && !isProcessingOcr && (
        <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <label className="form-label" htmlFor="extracted-ocr-text">
              Review and Edit Extracted Text:
            </label>
            <span style={{ fontSize: '0.78rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle2 size={14} /> Extraction Complete
            </span>
          </div>
          <p className="form-help">
            Verify the extracted text below. Make any necessary corrections or remove accidental personal numbers before checking safety.
          </p>

          <textarea
            id="extracted-ocr-text"
            className="text-area"
            value={extractedText}
            onChange={(e) => setExtractedText(e.target.value)}
            rows={5}
            required
          />

          <div className="btn-row">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={extractedText.trim().length < 3 || loading}
            >
              {loading ? 'Analyzing...' : <><Send size={18} /> Analyze Extracted Text</>}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={loading}
            >
              <RotateCcw size={16} /> Reset
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
