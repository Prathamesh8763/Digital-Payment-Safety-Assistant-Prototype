# Digital Payment Safety Assistant — V10 PRD
## Link & QR Checker (`/check-link`)

**Document type:** Product Requirements Document (PRD)  
**Version:** V10 — Link & QR Checker Upgrade  
**Status:** In Implementation  
**Primary platforms:** Responsive web application (desktop and mobile)  
**Current stack to preserve:** React + Vite frontend; Python + FastAPI backend  
**Design system:** ClearPay white theme, navy typography, blue primary actions, pale-blue page backgrounds, restrained status colours, and consistent vector icons  
**Mandatory design reference:** `Digital_Payment_Safety_Assistant_V10_Link_QR_Checker_Reference.png` (`docs/design-references/v10-link-qr-checker-reference.png`)

> **Version note:** This document continues the project's V6 requirements through the later V7–V9 design and reliability work. It is labelled V10 to keep the project version sequence consistent.

---

## 1. Executive Summary

V10 upgrades the Link & QR Checker into a complete, privacy-conscious user flow for checking website addresses and QR-code destinations before a person visits them. It must provide understandable results, explain what was checked, handle unknown or unavailable reputation data honestly, and never give an unchecked link a "safe" or "pass" result.

The supplied screenshot is the required visual reference. Recreate its layout and design language with real React components and responsive CSS. Do not use the screenshot as a flattened background or as a substitute for functional controls.

This PRD adds URL syntax validation, domain and deceptive-host analysis, configurable reputation lookups, safe QR-image upload and decoding, explainable results, resilient error states, accessibility, performance targets, and adversarial testing.

## 2. Problem Statement

People receive links and QR codes through SMS, chat apps, email, social media, posters, and payment requests. A link can be unfamiliar, incomplete, deceptive, or newly created. A QR code can hide its destination. Users often assume that a tool saying "no issue found" means a link is safe.

V10 must avoid that false reassurance. It must separate:
- whether an address is syntactically valid;
- whether its domain looks unusual or deceptive;
- whether a configured threat-intelligence source reports a known threat;
- whether a provider check completed;
- and whether enough information exists to make a useful statement.

No single check can prove that a website is safe.

## 3. Product Goals

1. Let a user submit a URL and receive a clear, explainable result.
2. Let a user upload an image containing a QR code, review the decoded destination, and choose whether to check that destination.
3. Mark malformed or incomplete URLs as invalid, unknown destinations as unverified, and unavailable checks as unavailable or partial—never as safe.
4. Explain each meaningful warning in simple English and give practical next steps.
5. Keep the UI usable on desktop and mobile, with good loading, empty, success, warning, and error states.
6. Keep project changes incremental and compatible with the existing React + Vite and FastAPI application.
7. Validate behaviour with unit, API, integration, accessibility, performance, and defensive security tests before release.

## 4. Non-Goals and Safety Boundaries

V10 is not a browser-isolation service, malware sandbox, financial institution, or guarantee of fraud detection. The tool must not:
- automatically open suspicious URLs in the user's browser;
- crawl a submitted site merely to decide whether it is safe;
- submit payment forms, log in to a website, or attempt a transaction;
- request an OTP, UPI PIN, password, card PIN, recovery phrase, or bank-login information;
- claim that a message, QR code, or destination is guaranteed safe;
- claim a reputation lookup succeeded when it timed out or was not configured;
- store the submitted URL or QR image by default for analytics or history;
- follow user-supplied redirects from the backend without explicit SSRF protections and an approved product need.

A QR code is decoded to reveal its payload; decoding is not itself a safety verdict.

## 5. Target Users and Main Use Cases

### 5.1 Users
- A person who received an unfamiliar website link in a message.
- A person who received a payment or account-verification URL.
- A person who sees a QR code on a poster, bill, message, or payment request.
- A person who copied only part of a URL and needs to know that it is incomplete.
- A person who needs a clear explanation when the result cannot be confirmed.

### 5.2 Primary journeys
1. Open `/check-link` -> paste a URL -> check -> read result -> review the reason -> follow a safe next step.
2. Open `/check-link` -> choose QR code -> upload image -> review decoded URL -> explicitly check it -> read result.
3. Enter an invalid URL -> see a field-level message -> correct it without losing the rest of the page.
4. Experience provider timeout or offline state -> see "check unavailable" or a clearly partial result, with a safe retry path.
5. See an unknown domain with no reputation hit -> receive "unverified" or "no known threat found in checked sources," never "safe."

## 6. Mandatory Visual Reference and Design Requirements

The attached screenshot is the primary design reference and is saved at:
`docs/design-references/v10-link-qr-checker-reference.png`

The implementation follows these visual characteristics from the reference:
- ClearPay logo at the top-left and simple top navigation.
- Light page background in pale blue-grey, white cards, fine borders, rounded corners, restrained shadows, and ample spacing.
- A compact eyebrow label, strong page title, and short explanation.
- A green privacy reassurance banner.
- A two-column desktop workspace: URL/QR input on the left and "What we look for" on the right.
- A prominent blue primary action.
- A yellow/amber reminder stating that unknown does not mean safe.
- Three understandable result-state cards: Unverified, Suspicious signs found, and Invalid or incomplete.
- A bottom card explaining that suspicious links are not opened automatically, followed by a consistent footer.
- Consistent editable/vector icons rather than typed emoji or inconsistent Unicode glyphs.

## 7. Result Model and Result States

| Status | Meaning | Required user-facing wording pattern |
|---|---|---|
| `invalid_input` | URL is empty, malformed, incomplete, or unsupported | "This address looks incomplete. Check the full link and try again." |
| `known_threat` | A trusted, configured source returned a supported threat finding | "A known threat was reported by a checked source." Identify the source and timestamp where disclosure is allowed. |
| `suspicious_indicators` | One or more heuristics found suspicious patterns but no definitive threat verdict exists | "This link has suspicious signs." Explain each indicator and avoid overstating certainty. |
| `unverified` | Address is parseable but lacks enough reliable information for a trustworthy verdict | "We couldn't verify this link. That doesn't mean it is safe." |
| `no_known_threat_found` | Checks completed; no threat match was returned in checked sources | "No known threat was found in the sources checked. This is not proof that the link is safe." |
| `partial_result` | Some checks succeeded while others timed out/failed | "Some checks could not finish. Review the available findings and treat the link with care." |
| `check_unavailable` | Required service or backend could not complete the check | "We couldn't finish checking this link. Try again later, or verify it another way." |
| `qr_decode_failed` | QR image could not be decoded | "We couldn't read a link from this image. Try a clearer image showing the full code." |
