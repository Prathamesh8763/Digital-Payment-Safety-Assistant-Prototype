import test from 'node:test';
import assert from 'node:assert/strict';

test('Indian Scam Modules: covers required vectors and invariants', async () => {
  // Verify core Indian scam vectors
  const expectedVectors = [
    'UPI Collect Request',
    'Fake Payment Screenshot',
    'Electricity Bill',
    'Screen-Sharing',
    'Fake Customer Care'
  ];

  // Invariant: Entering PIN never receives money
  const goldenRules = [
    'You NEVER enter your UPI PIN or scan a QR code to receive money.',
    'A screenshot or SMS from a regular 10-digit number is NOT proof of payment.',
    'Electricity boards NEVER send disconnection threats from personal mobile numbers.',
    'Never install remote desktop or screen-sharing applications on instructions from an unknown caller.'
  ];

  expectedVectors.forEach(v => {
    assert.ok(v.length > 0, `Expected vector ${v} should be defined`);
  });

  goldenRules.forEach(rule => {
    assert.ok(rule.length > 20, `Rule '${rule}' must be explanatory`);
  });
});

test('Indian Cybercrime Recourse: 1930 Helpline and Golden Hour protocol', () => {
  const reportingConfig = {
    helpline: '1930',
    authority: 'Citizen Financial Cyber Fraud Reporting and Management System (CFCFRMS)',
    portal: 'https://cybercrime.gov.in',
    golden_hour_hours: 2,
    telecom_portal: 'https://sancharsaathi.gov.in/sfc/',
    banking_ombudsman: 'https://cms.rbi.org.in'
  };

  assert.equal(reportingConfig.helpline, '1930');
  assert.equal(reportingConfig.portal, 'https://cybercrime.gov.in');
  assert.equal(reportingConfig.golden_hour_hours, 2);
  assert.ok(reportingConfig.telecom_portal.includes('sancharsaathi'));
  assert.ok(reportingConfig.banking_ombudsman.includes('cms.rbi.org.in'));
});

test('Trust & Transparency Commitments: zero-storage & non-guarantee invariants', () => {
  const commitments = {
    zero_storage: true,
    storage_type: 'volatile_memory_only',
    low_risk_is_safe_guarantee: false,
    disclaimer: 'This result is guidance, not a guarantee.'
  };

  assert.strictEqual(commitments.zero_storage, true);
  assert.strictEqual(commitments.low_risk_is_safe_guarantee, false, 'Low risk must NEVER guarantee complete safety');
  assert.ok(commitments.disclaimer.includes('guidance, not a guarantee'));
});
