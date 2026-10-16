import React, { useState, useRef } from 'react';
import { Upload, Send, RotateCcw, CheckCircle2 } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import Button from './ui/Button';
import Textarea from './ui/Textarea';
import Alert from './ui/Alert';
import LoadingSpinner from './ui/LoadingSpinner';

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
    } catch {
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
    <div className="ocr-check-container" aria-label="Screenshot OCR Analysis">
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
          Screenshot & Image Safety Check
        </h3>
        <p className="form-help">
          Upload a screenshot of a suspicious SMS, WhatsApp message, or payment page. Text is extracted directly on your device.
        </p>
      </div>

      {!imagePreview ? (
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
            borderRadius: 'var(--radius-lg)',
            padding: '2.5rem 1rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: 'var(--color-bg-subtle)',
            transition: 'border-color 0.2s ease'
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) processSelectedFile(e.dataTransfer.files[0]);
          }}
          aria-label="Upload screenshot drop zone. Click or drag file here."
        >
          <Upload size={36} style={{ color: 'var(--primary)', margin: '0 auto 0.75rem' }} aria-hidden="true" />
          <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-base)', color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
            Click or drag & drop a screenshot here
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
            Supports PNG, JPG, WebP (Max 5 MB) • Processed transiently on-device
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/bmp"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          {/* Image Preview Card */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--color-bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <img
              src={imagePreview}
              alt="Uploaded screenshot preview"
              style={{ maxHeight: '110px', maxWidth: '140px', objectFit: 'contain', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                {imageFile?.name}
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : ''}
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleReset}
                leftIcon={RotateCcw}
                style={{ marginTop: '0.4rem', padding: '0.25rem 0.65rem', fontSize: 'var(--font-size-xs)', minHeight: '32px' }}
              >
                Change Image
              </Button>
            </div>
          </div>

          {/* OCR Processing Progress */}
          {isProcessingOcr && (
            <div style={{ padding: '1rem', background: 'var(--color-primary-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary-200)', textAlign: 'center' }}>
              <LoadingSpinner size={24} label={`Extracting text on-device... (${ocrProgress}%)`} />
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-primary-800)', marginTop: '0.5rem' }}>
                Extracting text on-device... ({ocrProgress}%)
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-600)', marginTop: '0.2rem' }}>
                Your image is not sent to external servers. Optical character recognition runs entirely in your browser.
              </div>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <Alert variant="error" onDismiss={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {/* Review and Edit Extracted Text */}
      {extractedText && !isProcessingOcr && (
        <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success-700)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle2 size={14} aria-hidden="true" /> Extraction Complete
            </span>
          </div>

          <Textarea
            id="extracted-ocr-text"
            label="Review and Edit Extracted Text:"
            helperText="Verify the extracted text below. Make any necessary corrections or remove accidental personal numbers before checking safety."
            value={extractedText}
            onChange={(e) => setExtractedText(e.target.value)}
            rows={5}
            required
            showCount
          />

          <div className="btn-row">
            <Button
              type="submit"
              variant="primary"
              disabled={extractedText.trim().length < 3 || loading}
              loading={loading}
              loadingText="Analyzing..."
              leftIcon={Send}
            >
              Analyze Extracted Text
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleReset}
              disabled={loading}
              leftIcon={RotateCcw}
            >
              Reset
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
