import test from 'node:test';
import assert from 'node:assert/strict';
import { generateRedactedSummary, getBannerTheme, getBannerCopy } from '../utils/resultFormatters.js';

test('Guided & Text Result Contract: Null Safety and Array Normalization', () => {
  // Simulates raw JSON payload from FastAPI where None values serialize as null
  const rawApiResultWithNulls = {
    risk_level: 'HIGH',
    risk_score: 95,
    summary: 'The contact is asking for secret security credentials.',
    status: 'analyzed',
    verification_status: null,
    input_type: 'guided',
    reviewed_input: null,
    detected_platform: 'Bank SMS',
    context_tags: null,
    cybercrime_reporting: { helpline: '1930', portal: 'cybercrime.gov.in' },
    trust_transparency: null,
    detected_categories: null,
    indicators: null,
    why_suspicious: null,
    reasons: null,
    recommended_actions: null,
    urls: null,
    url_assessments: null,
    detected_urls: null
  };

  // Safe array normalization logic mirroring ResultDisplay.jsx
  const safeUrls = Array.isArray(rawApiResultWithNulls.urls) ? rawApiResultWithNulls.urls : [];
  const safeUrlAssessments = Array.isArray(rawApiResultWithNulls.url_assessments) ? rawApiResultWithNulls.url_assessments : [];
  const safeDetectedUrls = Array.isArray(rawApiResultWithNulls.detected_urls) ? rawApiResultWithNulls.detected_urls : [];
  const safeIndicators = Array.isArray(rawApiResultWithNulls.indicators) ? rawApiResultWithNulls.indicators : [];
  const safeWhySuspicious = Array.isArray(rawApiResultWithNulls.why_suspicious) ? rawApiResultWithNulls.why_suspicious : [];
  const safeReasons = Array.isArray(rawApiResultWithNulls.reasons) ? rawApiResultWithNulls.reasons : [];
  const safeRecommendedActions = Array.isArray(rawApiResultWithNulls.recommended_actions) ? rawApiResultWithNulls.recommended_actions : [];
  const safeContextTags = Array.isArray(rawApiResultWithNulls.context_tags) ? rawApiResultWithNulls.context_tags : [];

  const displayReasons = safeWhySuspicious.length > 0 ? safeWhySuspicious : safeReasons;

  // Verify all safe normalized arrays are true Arrays and have length 0 without throwing
  assert.equal(Array.isArray(safeUrls), true);
  assert.equal(safeUrls.length, 0);
  assert.equal(Array.isArray(safeUrlAssessments), true);
  assert.equal(safeUrlAssessments.length, 0);
  assert.equal(Array.isArray(safeDetectedUrls), true);
  assert.equal(safeDetectedUrls.length, 0);
  assert.equal(Array.isArray(safeIndicators), true);
  assert.equal(safeIndicators.length, 0);
  assert.equal(Array.isArray(safeWhySuspicious), true);
  assert.equal(safeWhySuspicious.length, 0);
  assert.equal(Array.isArray(safeReasons), true);
  assert.equal(safeReasons.length, 0);
  assert.equal(Array.isArray(safeRecommendedActions), true);
  assert.equal(safeRecommendedActions.length, 0);
  assert.equal(Array.isArray(safeContextTags), true);
  assert.equal(safeContextTags.length, 0);
  assert.equal(displayReasons.length, 0);

  // URL extraction fallback does not throw and produces empty array
  const allUrls = safeUrls.length > 0 
    ? safeUrls 
    : (safeUrlAssessments.length > 0 
        ? safeUrlAssessments 
        : (safeDetectedUrls.length > 0 
            ? safeDetectedUrls.map((u, i) => ({ url_id: `url-${i+1}`, url: u, display_url: u, verification_status: 'unverified' }))
            : []
          )
      );
  assert.equal(allUrls.length, 0);

  // Warning count falls back gracefully to banner default without throwing
  const bannerTheme = getBannerTheme(rawApiResultWithNulls.risk_level, rawApiResultWithNulls.status, 'unverified');
  const warningCount = safeIndicators.length > 0 
    ? safeIndicators.length 
    : (displayReasons.length > 0 ? displayReasons.length : (bannerTheme === 'high' ? 3 : (bannerTheme === 'medium' ? 1 : 0)));
  assert.equal(warningCount, 3);
});

test('generateRedactedSummary handles null indicators and missing reasons safely', () => {
  const bannerCopy = getBannerCopy('high', 'flagged');
  const summary = generateRedactedSummary({
    bannerCopy,
    activeStatus: 'flagged',
    activeReportId: 'CP-TEST-99',
    indicators: null,
    displayReasons: null,
    nextSteps: [
      { title: "Don't open the link", desc: "Avoid tapping links in unexpected messages." }
    ],
    disclaimer: 'Advisory only.'
  });

  assert.ok(typeof summary === 'string');
  assert.ok(summary.includes('ClearPay Safety Assessment'));
  assert.ok(summary.includes('CP-TEST-99'));
  assert.ok(summary.includes('HIGH RISK'));
  assert.ok(summary.includes('FLAGGED'));
});

test('Guided Situation Answers String Replacements Safety', () => {
  // Step 5 review string transformations
  const testData = {
    contact_source: 'unknown_call',
    sender_claim: undefined, // Simulates uninitialized state
    requested_action: null   // Simulates cleared state
  };

  const safeContact = (testData.contact_source || '').replace(/_/g, ' ');
  const safeClaim = (testData.sender_claim || '').replace(/_/g, ' ');
  const safeAction = (testData.requested_action || '').replace(/_/g, ' ');

  assert.equal(safeContact, 'unknown call');
  assert.equal(safeClaim, '');
  assert.equal(safeAction, '');
});
