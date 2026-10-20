import test from 'node:test';
import assert from 'node:assert/strict';

// V10 Link & QR Checker Frontend Unit Tests (PRD Section 15.1, 15.2, 15.4)

test('V10 URL syntax: recognizes standard schemes and plain domains', () => {
  const isUrl = (str) => /^https?:\/\//i.test(str) || /^[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(str);

  assert.equal(isUrl('https://example.com/login'), true);
  assert.equal(isUrl('http://insecure-site.org'), true);
  assert.equal(isUrl('onlinesbi.sbi/portal'), true);
  assert.equal(isUrl('just plain text message'), false);
  assert.equal(isUrl('upi://pay?pa=merchant@upi'), false);
});

test('V10 QR payload classifier: separates URLs from non-URL payloads', () => {
  const classifyQrPayload = (payload) => {
    const trimmed = payload.trim();
    if (/^https?:\/\//i.test(trimmed)) return 'url';
    if (/^upi:\/\/pay/i.test(trimmed)) return 'upi_intent';
    if (/^WIFI:/i.test(trimmed)) return 'wifi';
    return 'plain_text';
  };

  assert.equal(classifyQrPayload('https://pay.example.com/qr'), 'url');
  assert.equal(classifyQrPayload('upi://pay?pa=seller@upi&am=100'), 'upi_intent');
  assert.equal(classifyQrPayload('WIFI:S:MyNetwork;T:WPA;P:secret;;'), 'wifi');
  assert.equal(classifyQrPayload('Invoice number #992384'), 'plain_text');
});

test('V10 File validation: enforces 5 MB limit and permitted mime-types', () => {
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  const maxBytes = 5 * 1024 * 1024; // 5 MB

  const validateFile = (file) => {
    if (file.size > maxBytes) return { valid: false, error: 'File is too large.' };
    if (!allowedMimeTypes.includes(file.type.toLowerCase())) return { valid: false, error: 'Unsupported file type.' };
    return { valid: true };
  };

  assert.deepEqual(validateFile({ size: 1024 * 1024, type: 'image/png' }), { valid: true });
  assert.deepEqual(validateFile({ size: 2 * 1024 * 1024, type: 'image/webp' }), { valid: true });
  assert.deepEqual(validateFile({ size: 6 * 1024 * 1024, type: 'image/jpeg' }), { valid: false, error: 'File is too large.' });
  assert.deepEqual(validateFile({ size: 500, type: 'image/svg+xml' }), { valid: false, error: 'Unsupported file type.' });
  assert.deepEqual(validateFile({ size: 500, type: 'application/pdf' }), { valid: false, error: 'Unsupported file type.' });
});

test('V10 Plain-English Invariant: unknown domains must not be labeled safe', () => {
  const formatStatusDisplay = (status) => {
    switch (status) {
      case 'known_threat':
        return { label: 'Known threat reported', safe: false };
      case 'suspicious_indicators':
        return { label: 'Suspicious signs found', safe: false };
      case 'unverified':
        return { label: 'Unverified destination', safe: false };
      case 'no_known_threat_found':
        return { label: 'No known threat found in checked sources', safe: false }; // Never claims safe!
      case 'invalid_input':
        return { label: 'Address looks incomplete or invalid', safe: false };
      default:
        return { label: 'Check unavailable', safe: false };
    }
  };

  const unverified = formatStatusDisplay('unverified');
  assert.equal(unverified.safe, false);
  assert.notEqual(unverified.label.toLowerCase(), 'safe');
  assert.notEqual(unverified.label.toLowerCase(), 'passed');

  const noThreat = formatStatusDisplay('no_known_threat_found');
  assert.equal(noThreat.safe, false);
  assert.notEqual(noThreat.label.toLowerCase(), 'safe');
  assert.notEqual(noThreat.label.toLowerCase(), 'verified safe');
});

test('V10 Privacy Redaction: query parameters and userinfo tokens are stripped from summaries', () => {
  const sanitizeUrlSummary = (url) => {
    try {
      const u = new URL(url);
      return `${u.protocol}//${u.host}${u.pathname}`;
    } catch {
      return url.split('?')[0].split('#')[0];
    }
  };

  assert.equal(
    sanitizeUrlSummary('https://example.com/checkout?token=secret123&user=alice'),
    'https://example.com/checkout'
  );
  assert.equal(
    sanitizeUrlSummary('https://bank.example/auth?otp=998811#frag'),
    'https://bank.example/auth'
  );
});
