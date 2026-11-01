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

export function getBannerCopy(bannerTheme, activeStatus = 'unverified', t = null) {
  if (t) {
    if (bannerTheme === 'high' || activeStatus === 'flagged') {
      return {
        tag: t('risks.HIGH', 'HIGH RISK'),
        headline: t('risks.headline_high', 'Pause before you click or pay.'),
        subtext: t('risks.subtext_high', 'Several warning signs appear in this situation. Do not use the supplied link or share confidential information until you verify independently.')
      };
    }
    if (bannerTheme === 'medium' || activeStatus === 'suspicious') {
      return {
        tag: t('risks.MEDIUM', 'SUSPICIOUS SIGNS'),
        headline: t('risks.headline_medium', 'Caution recommended before acting.'),
        subtext: t('risks.subtext_medium', 'Unusual patterns or urgency tactics were detected. Confirm directly with your provider before following instructions.')
      };
    }
    if (bannerTheme === 'low' || activeStatus === 'no_known_threat_found') {
      return {
        tag: t('risks.LOW', 'LIMITED THREAT MATCH'),
        headline: t('risks.headline_low', 'No known threat found in checked sources.'),
        subtext: t('risks.subtext_low', 'No match was found in verified directories. Remember: lack of a reported match does not prove a message or link is safe.')
      };
    }
    if (activeStatus === 'invalid_input') {
      return {
        tag: t('risks.INVALID', 'INVALID INPUT'),
        headline: t('risks.headline_invalid', 'Invalid or incomplete input.'),
        subtext: t('risks.subtext_invalid', 'The submitted web address or message was incomplete or malformed and could not be inspected.')
      };
    }
    if (activeStatus === 'provider_unavailable') {
      return {
        tag: t('risks.UNAVAILABLE', 'CHECK UNAVAILABLE'),
        headline: t('risks.headline_unavailable', 'A required check could not be completed.'),
        subtext: t('risks.subtext_unavailable', 'Verification directories are currently unreachable or busy. Treat unknown requests with caution.')
      };
    }
    return {
      tag: t('risks.UNVERIFIED', 'UNVERIFIED'),
      headline: t('risks.headline_unverified', 'Could not verify this destination.'),
      subtext: t('risks.subtext_unverified', 'There is not enough reliable directory data to confirm whether this link is genuine. Treat it with caution.')
    };
  }

  // Default English strings (strictly adheres to Table 6.1)
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
 * Translates backend security indicators using reason codes dictionary.
 */
export function translateIndicator(indicator, t) {
  if (!indicator || !t) return indicator;
  const key = indicator.id || indicator.code?.toLowerCase();
  const localizedTitle = t(`findings.${key}.title`, { defaultValue: '' });
  const localizedDesc = t(`findings.${key}.desc`, { defaultValue: '' });

  return {
    ...indicator,
    title: localizedTitle || indicator.title || indicator.name,
    description: localizedDesc || indicator.description
  };
}

/**
 * Translates recommended action strings if matching standard guidance patterns.
 */
export function translateAction(actionText, t) {
  if (!actionText || !t) return actionText;
  const lower = actionText.toLowerCase();
  if (lower.includes('otp') || lower.includes('pin') || lower.includes('password')) {
    return t('actions.never_share_otp', actionText);
  }
  if (lower.includes('send') && (lower.includes('money') || lower.includes('funds') || lower.includes('collect'))) {
    return t('actions.do_not_send_funds', actionText);
  }
  if (lower.includes('verify') || lower.includes('official') || lower.includes('contact') || lower.includes('card')) {
    return t('actions.verify_independently', actionText);
  }
  if (lower.includes('1930') || lower.includes('cybercrime')) {
    return t('actions.report_1930', actionText);
  }
  return actionText;
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
  const safeIndicators = Array.isArray(indicators) ? indicators : [];
  const safeDisplayReasons = Array.isArray(displayReasons) ? displayReasons : [];
  const safeNextSteps = Array.isArray(nextSteps) ? nextSteps : [];

  const signs = safeIndicators.length > 0 
    ? safeIndicators.map(i => `• ${i.title || i.name}: ${redactSensitiveText(i.description)}`).join('\n')
    : (safeDisplayReasons.length > 0 ? safeDisplayReasons.map(r => `• ${redactSensitiveText(r)}`).join('\n') : '• None detected.');

  const steps = safeNextSteps.length > 0
    ? safeNextSteps.map(s => `• ${s.title}: ${s.desc}`).join('\n')
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
