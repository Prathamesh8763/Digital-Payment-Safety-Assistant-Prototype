/**
 * ClearPay V8 Result Formatting and Redaction Utilities
 * Adheres strictly to Section 6 and Section 10 of V8 PRD
 */

export function getBannerTheme(risk_level, status, verification_status) {
  const activeStatus = verification_status || status || 'unverified';
  if (activeStatus === 'flagged' || risk_level === 'HIGH') return 'high';
  if (activeStatus === 'suspicious' || risk_level === 'MEDIUM') return 'medium';
  if (activeStatus === 'no_known_threat_found' || risk_level === 'LOW') return 'low';
  return 'unverified';
}

export function getBannerCopy(bannerTheme, activeStatus = 'unverified') {
  if (bannerTheme === 'high' || activeStatus === 'flagged') {
    return {
      tag: 'HIGH RISK',
      headline: 'Pause before you click or pay.',
      subtext: 'Several warning signs appear in this situation. Do not use the supplied link or share confidential information until you verify independently.'
    };
  }
  if (bannerTheme === 'medium' || activeStatus === 'suspicious') {
    return {
      tag: 'SUSPICIOUS SIGNS',
      headline: 'Caution recommended before acting.',
      subtext: 'Unusual patterns or urgency tactics were detected. Confirm directly with your provider before following instructions.'
    };
  }
  if (bannerTheme === 'low' || activeStatus === 'no_known_threat_found') {
    return {
      tag: 'LIMITED THREAT MATCH',
      headline: 'No known threat found in checked sources.',
      subtext: 'No match was found in verified directories. Remember: lack of a reported match does not prove a message or link is safe.'
    };
  }
  if (activeStatus === 'invalid_input') {
    return {
      tag: 'INVALID INPUT',
      headline: 'Invalid or incomplete input.',
      subtext: 'The submitted web address or message was incomplete or malformed and could not be inspected.'
    };
  }
  if (activeStatus === 'provider_unavailable') {
    return {
      tag: 'CHECK UNAVAILABLE',
      headline: 'A required check could not be completed.',
      subtext: 'Verification directories are currently unreachable or busy. Treat unknown requests with caution.'
    };
  }
  return {
    tag: 'UNVERIFIED',
    headline: 'Could not verify this destination.',
    subtext: 'There is not enough reliable directory data to confirm whether this link is genuine. Treat it with caution.'
  };
}

/**
 * Safely strips query parameters and credentials from URLs.
 */
export function redactUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  } catch {
    return url.split('?')[0].split('#')[0];
  }
}

/**
 * Redacts common sensitive tokens such as 4-8 digit OTPs, PINs, card numbers from text.
 */
export function redactSensitiveText(text) {
  if (!text) return '';
  return text
    // Redact 16-digit card numbers
    .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CARD NUMBER REDACTED]')
    // Redact query parameter patterns in URLs
    .replace(/(\?[a-zA-Z0-9_=&%.-]+)/g, '?token=[REDACTED]')
    // Redact explicit OTP patterns
    .replace(/\b(otp|code|pin)\s*[:=]?\s*\d{4,8}\b/gi, '$1: [REDACTED]');
}

/**
 * Formats a clean, redacted summary for clipboard copying or text export.
 */
export function generateRedactedSummary({
  bannerCopy,
  activeStatus = 'unverified',
  activeReportId = 'CP-7F24',
  indicators = [],
  displayReasons = [],
  nextSteps = [],
  disclaimer = 'This result is guidance, not a guarantee. If money or account access may be at risk, contact your bank through a verified official channel.'
}) {
  const signs = indicators.length > 0
    ? indicators.map(i => `• ${i.title || i.name}: ${redactSensitiveText(i.description)}`).join('\n')
    : (displayReasons.length > 0 ? displayReasons.map(r => `• ${redactSensitiveText(r)}`).join('\n') : '• None detected.');

  const steps = nextSteps.length > 0
    ? nextSteps.map(s => `• ${s.title}: ${s.desc}`).join('\n')
    : '• Pause and verify independently with official contacts.';

  return [
    `ClearPay Safety Assessment: ${bannerCopy.tag} (${activeStatus.toUpperCase()})`,
    `Report Reference: ${activeReportId}`,
    `Summary: ${bannerCopy.headline} - ${bannerCopy.subtext}`,
    '',
    `Warning Signs Found:`,
    signs,
    '',
    `Recommended Next Steps:`,
    steps,
    '',
    `Notice: ${disclaimer}`
  ].join('\n');
}
