import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SCENARIOS,
  QUESTIONS,
  GUIDANCES,
  generateChecklistText
} from '../utils/guidedHelpData.js';

test('SCENARIOS: contains all 5 required situation choices from V9 PRD', () => {
  assert.equal(SCENARIOS.length, 5);
  const ids = SCENARIOS.map((s) => s.id);
  assert.ok(ids.includes('otp_pin'), 'Missing otp_pin scenario');
  assert.ok(ids.includes('account_blocked'), 'Missing account_blocked scenario');
  assert.ok(ids.includes('unexpected_request'), 'Missing unexpected_request scenario');
  assert.ok(ids.includes('link_qr'), 'Missing link_qr scenario');
  assert.ok(ids.includes('something_else'), 'Missing something_else scenario');

  for (const s of SCENARIOS) {
    assert.ok(s.title && s.title.length > 5, `Scenario ${s.id} title too short`);
    assert.ok(s.description && s.description.length > 10, `Scenario ${s.id} description too short`);
    assert.ok(s.icon, `Scenario ${s.id} missing icon`);
  }
});

test('QUESTIONS: all question options map to valid guidance targets', () => {
  for (const [qId, q] of Object.entries(QUESTIONS)) {
    assert.ok(q.prompt && q.prompt.length > 5, `Question ${qId} prompt missing`);
    assert.ok(q.options && q.options.length >= 2, `Question ${qId} needs at least 2 options`);

    for (const opt of q.options) {
      assert.ok(opt.label, `Option ${opt.id} in ${qId} missing label`);
      if (opt.targetGuidanceId) {
        assert.ok(
          GUIDANCES[opt.targetGuidanceId],
          `Option ${opt.id} maps to missing guidance '${opt.targetGuidanceId}'`
        );
      }
    }
  }
});

test('GUIDANCES: urgent_compromise path is present and contains immediate freeze steps', () => {
  const urgent = GUIDANCES.urgent_compromise;
  assert.ok(urgent, 'urgent_compromise guidance must exist');
  assert.equal(urgent.badgeType, 'danger');
  assert.ok(urgent.steps.length >= 4, 'Urgent guidance must have at least 4 priority steps');

  // Must mention account freeze and National Cybercrime helpline 1930
  const allText = urgent.steps.map((s) => `${s.title} ${s.desc}`).join(' ');
  assert.ok(allText.toLowerCase().includes('freeze') || allText.toLowerCase().includes('lock'));
  assert.ok(allText.includes('1930'), 'Must include 1930 helpline number');
});

test('SEC & Plain English: shared code or entered details always route to urgent_compromise', () => {
  // OTP question: shared -> urgent
  const otpShared = QUESTIONS.q_otp_shared.options.find((o) => o.id === 'opt_otp_shared');
  assert.equal(otpShared.targetGuidanceId, 'urgent_compromise');

  // Blocked question: entered details -> urgent
  const blockedEntered = QUESTIONS.q_blocked_action.options.find((o) => o.id === 'opt_blocked_entered_details');
  assert.equal(blockedEntered.targetGuidanceId, 'urgent_compromise');

  // Link question: entered details -> urgent
  const linkEntered = QUESTIONS.q_link_opened.options.find((o) => o.id === 'opt_link_entered_details');
  assert.equal(linkEntered.targetGuidanceId, 'urgent_compromise');
});

test('generateChecklistText: generates clean plain-English checklist for clipboard', () => {
  const guidance = GUIDANCES.guidance_otp_prevented;
  const checklist = generateChecklistText(guidance);

  assert.ok(checklist.includes('ClearPay Safety Guidance:'));
  assert.ok(checklist.includes('Do not share the code or PIN'));
  assert.ok(checklist.includes('1930'));

  // Ensure no robotic terms
  const roboticTerms = ['payload constraints', 'anomaly heuristic', 'attack vector'];
  for (const term of roboticTerms) {
    assert.ok(!checklist.toLowerCase().includes(term), `Contains robotic term '${term}'`);
  }
});
