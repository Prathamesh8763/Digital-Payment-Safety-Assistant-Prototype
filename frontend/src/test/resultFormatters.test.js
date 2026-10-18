import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getBannerTheme,
  getBannerCopy,
  redactUrl,
  redactSensitiveText,
  generateRedactedSummary
} from '../utils/resultFormatters.js';

test('getBannerTheme: maps risk_level and verification_status correctly', () => {
  // Flagged or HIGH -> high
  assert.equal(getBannerTheme('HIGH', 'analyzed', 'analyzed'), 'high');
  assert.equal(getBannerTheme('LOW', 'flagged', 'flagged'), 'high');

  // Suspicious or MEDIUM -> medium
  assert.equal(getBannerTheme('MEDIUM', 'analyzed', 'analyzed'), 'medium');
  assert.equal(getBannerTheme('LOW', 'suspicious', 'suspicious'), 'medium');

  // No known threat or LOW -> low
  assert.equal(getBannerTheme('LOW', 'analyzed', 'no_known_threat_found'), 'low');

  // Unverified never maps to low
  assert.equal(getBannerTheme('UNABLE_TO_ASSESS', 'unverified', 'unverified'), 'unverified');
  assert.equal(getBannerTheme(undefined, 'unverified', undefined), 'unverified');
});

test('getBannerCopy: adheres strictly to Table 6.1 prohibited language rules', () => {
  const prohibitedTerms = ['safe', 'pass', 'passed', 'verified safe', 'all clear', 'guaranteed'];

  // Test unverified status copy
  const unverifiedCopy = getBannerCopy('unverified', 'unverified');
  assert.equal(unverifiedCopy.tag, 'UNVERIFIED');
  for (const term of prohibitedTerms) {
    assert.ok(
      !unverifiedCopy.headline.toLowerCase().includes(term) || unverifiedCopy.headline.toLowerCase().includes('not safe'),
      `Unverified headline contains prohibited term '${term}': ${unverifiedCopy.headline}`
    );
  }

  // Test no_known_threat_found copy
  const noThreatCopy = getBannerCopy('low', 'no_known_threat_found');
  assert.equal(noThreatCopy.tag, 'LIMITED THREAT MATCH');
  assert.ok(noThreatCopy.headline.includes('No known threat found in checked sources'));
  // Must explicitly state that lack of match is not proof of safety
  assert.ok(noThreatCopy.subtext.includes('does not prove a message or link is safe'));

  // Test flagged copy
  const flaggedCopy = getBannerCopy('high', 'flagged');
  assert.equal(flaggedCopy.tag, 'HIGH RISK');
  assert.ok(flaggedCopy.headline.includes('Pause before you click'));
});

test('redactUrl: strips sensitive query parameters and fragments', () => {
  const urlWithToken = 'https://fake-bank-verify.example/confirm?token=supersecret123&otp=889922#step2';
  const cleaned = redactUrl(urlWithToken);
  assert.equal(cleaned, 'https://fake-bank-verify.example/confirm');
  assert.ok(!cleaned.includes('supersecret123'));
  assert.ok(!cleaned.includes('889922'));
  assert.ok(!cleaned.includes('step2'));

  // Works with scheme-less input
  const schemeless = redactUrl('login.example.com/auth?param=123');
  assert.equal(schemeless, 'https://login.example.com/auth');
});

test('redactSensitiveText: masks OTPs, PINs, and credit card sequences', () => {
  const rawText = 'Your one-time code is OTP: 492019 and your card is 4111 2222 3333 4444. Click https://auth.com?code=xyz123';
  const redacted = redactSensitiveText(rawText);

  assert.ok(!redacted.includes('492019'), 'OTP was not redacted');
  assert.ok(!redacted.includes('4111 2222 3333 4444'), 'Card number was not redacted');
  assert.ok(redacted.includes('[CARD NUMBER REDACTED]'));
  assert.ok(redacted.includes('OTP: [REDACTED]'));
});

test('generateRedactedSummary: produces structured clipboard report', () => {
  const summary = generateRedactedSummary({
    bannerCopy: { tag: 'HIGH RISK', headline: 'Pause before you click or pay.', subtext: 'Several warning signs appear.' },
    activeStatus: 'analyzed',
    activeReportId: 'REF-TXT-9988AABB',
    indicators: [
      { title: 'Fear and Threat Coercion', description: 'Threatens account block.' },
      { title: 'Unverified destination', description: 'Link https://secure-pay.example?auth=999 is unverified.' }
    ],
    nextSteps: [
      { title: 'Do not click the link', desc: 'Ignore instructions in the message.' },
      { title: 'Verify independently', desc: 'Call your bank using the official number.' }
    ],
    disclaimer: 'This result is guidance, not a guarantee.'
  });

  assert.ok(summary.includes('ClearPay Safety Assessment: HIGH RISK'));
  assert.ok(summary.includes('REF-TXT-9988AABB'));
  assert.ok(summary.includes('Fear and Threat Coercion'));
  assert.ok(summary.includes('Do not click the link'));
  assert.ok(!summary.includes('auth=999'), 'Query params leaked in summary');
});
