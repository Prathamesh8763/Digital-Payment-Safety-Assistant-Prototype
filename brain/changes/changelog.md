# Changelog

All notable changes to the **Digital Payment Safety Assistant (ClearPay)** project are documented in this file.

Classification key:
- **[Verified]**: Directly confirmed by git commit history, repository files, test suite execution, or source code inspection.
- **[Inferred]**: Derived logically from architectural patterns, commit messages, or PRD requirements, but not directly stated in a single commit.
- **[Unknown]**: Historical intent or unrecorded developer decisions where explicit evidence is absent.

Format per change entry:
`Change → Reason → Affected Area → Impact → Evidence → Status`

---

## [V8.0.0] - 2026-10-18

### 1. Analysis Result Experience Visual Redesign (Reference Fidelity)
- **Change:** Rebuilt `ResultDisplay.jsx` and created `frontend/src/styles/result.css` matching mandatory reference asset `docs/design-references/v8-analysis-result-reference.png`. Implemented high-contrast white layout with breadcrumb header (`Home / Analyze a message / Result`), `ILLUSTRATIVE EXAMPLE` pill, `ANALYSIS RESULT` eyebrow, wide risk summary banner with warning count stat box, 2-column evidence vs. next steps layout, 2-column reviewed message/link vs. analysis details layout, 3-card "How to interpret a result" section, advisory guidance banner, and bottom action bar.
- **Reason:** Satisfy V8 PRD P0 requirements to deliver a trustworthy, clear, and reassuring result screen that eliminates panic while clearly guiding safe user actions.
- **Affected Area:** `frontend/src/components/ResultDisplay.jsx`, `frontend/src/styles/result.css`, `frontend/src/components/SafetyAnalyzer.jsx`.
- **Impact:** Result view visually matches reference design; risk indicators and action steps are distinct, responsive, and accessible.
- **Evidence:** `docs/design-references/v8-analysis-result-reference.png`, `frontend/src/styles/result.css`, `frontend/src/components/ResultDisplay.jsx`.
- **Status:** [Verified]

### 2. Structured Result Response Contract Separation
- **Change:** Enhanced backend schemas (`backend/schemas/safety.py`) with additive fields:
  - `DetectedIndicator`: `code` (stable identifier), `title` (human-readable title), `evidence_excerpt` (relevant excerpt), `source_type` (`message_rule` or `url_check`).
  - `SafetyAssessmentResponse`: `reviewed_input` (original text), `verification_status` (explicit status), `analysis_id` (alias for reference_id), `urls` (normalized URL assessment list).
  - `URLCheckResponse`: `reviewed_input`, `verification_status`, `analysis_id`, `display_url`, `checks` (structured per-check list).
- **Reason:** Strict separation of `risk_level` (`HIGH`, `MEDIUM`, `LOW`, `UNABLE_TO_ASSESS`) from `verification_status` (`flagged`, `suspicious`, `no_known_threat_found`, `unverified`, `invalid_input`, `provider_unavailable`) to eliminate false passes.
- **Affected Area:** `backend/schemas/safety.py`, `backend/safety/engine.py`, `backend/tests/test_v8_result_contract.py`.
- **Impact:** API consumers and UI components have direct access to additive metadata while maintaining 100% backwards compatibility.
- **Evidence:** `backend/schemas/safety.py` lines 61-125, `backend/tests/test_v8_result_contract.py` (5 tests passing).
- **Status:** [Verified]

### 3. Integrated Action Bar & Privacy Redaction Utility
- **Change:** Implemented working result actions: "Analyze another message" (resets state smoothly to input), "Back to Analyze" in header navigation, and "Copy summary" with automatic privacy redaction (`frontend/src/utils/resultFormatters.js`). Redaction automatically masks OTPs, PINs, card numbers, and strips URL query parameters/tokens before copying to clipboard.
- **Reason:** Guarantee user safety and prevent confidential tokens from leaking when users share summaries with family, support, or cybercrime portals.
- **Affected Area:** `frontend/src/utils/resultFormatters.js`, `frontend/src/components/ResultDisplay.jsx`, `frontend/src/test/resultFormatters.test.js`.
- **Impact:** Clean, privacy-safe text summaries are copied to clipboard; query parameters (`?token=secret`) and credentials are never exposed in reports.
- **Evidence:** `frontend/src/utils/resultFormatters.js`, 5 unit tests in `frontend/src/test/resultFormatters.test.js`.
- **Status:** [Verified]

### 4. Detection Precision & Reference Scenario Alignment
- **Change:** Updated `URGENCY_PATTERNS` in `backend/safety/detector.py` to recognize immediate threat deadlines ("verify now", "act now", "blocked today") and integrated automatic URL destination indicator creation (`unverified_url_destination` / `flagged_url_destination`) in `SafetyEngine.analyze_text`.
- **Reason:** The reference example ("Your UPI account will be blocked today. Verify now to keep your account active. Link: https://secure-upi-help.example") contains 3 distinct warning signs: urgency/time pressure, deceptive account block threat, and an unverified destination link.
- **Affected Area:** `backend/safety/detector.py`, `backend/safety/engine.py`, `frontend/src/components/SafetyAnalyzer.jsx`.
- **Impact:** The exact reference scenario reliably yields 3 indicators and High Risk banner matching the visual reference asset.
- **Evidence:** Pytest session 64 passed, detector patterns lines 15-20.
- **Status:** [Verified]

### 5. Automated Verification & Quality Gates
- **Change:** Created `backend/tests/test_v8_result_contract.py` and `frontend/src/test/resultFormatters.test.js`. Updated application version to `8.0.0` in `backend/main.py`.
- **Reason:** Establish continuous automated regression barriers across backend contracts and frontend formatting logic.
- **Affected Area:** `backend/tests/test_v8_result_contract.py`, `frontend/src/test/resultFormatters.test.js`, `backend/main.py`.
- **Impact:** 64 backend tests passing (0.50s), 17 frontend tests passing (72ms), 0 oxlint warnings/errors, and Vite build passing (385ms).
- **Evidence:** `pytest` log (64 passed), `npm test` log (17 passed), `npm run lint` (0 warnings).
- **Status:** [Verified]

---

## [V6.0.0] - 2026-10-17

### 1. URL Safety Engine False-Pass Elimination & Hardening
- **Change:** Rewrote `URLChecker` to strictly enforce: *"No match is not proof of safety. Unknown results must stay unknown."* Unknown domains, reserved test suffixes, and unresolvable targets no longer receive a `LOW` risk pass; they return `status="unverified"` and `risk_level="UNABLE_TO_ASSESS"`.
- **Reason:** Users observed that fabricated or truncated URLs (e.g., `https://made-up-payment-check.invalid/login`) received `LOW` risk and "No known phishing indicators" badges because local blacklist indicators were empty.
- **Affected Area:** `backend/safety/url_checker.py`, `backend/schemas/safety.py`, `backend/safety/engine.py`.
- **Impact:** 100% of fabricated, test-reserved, unknown, and provider-unavailable URLs avoid pass-like verdicts.
- **Evidence:** Commit `2e670e4`, `backend/safety/url_checker.py` lines 40-350, 37 test cases in `backend/tests/test_v6_url_matrix.py`.
- **Status:** [Verified]

### 2. Structured Verification Status Architecture
- **Change:** Added `URLVerificationStatus` literal enum (`flagged`, `suspicious`, `no_known_threat_found`, `unverified`, `invalid_input`, `provider_unavailable`) to `URLCheckResponse` and `SafetyAssessmentResponse`.
- **Reason:** Decouple threat detection certainty from risk severity so that inconclusive results are never conflated with low-risk safe results.
- **Affected Area:** `backend/schemas/safety.py`, `backend/safety/url_checker.py`, `frontend/src/components/ResultDisplay.jsx`.
- **Impact:** API consumers and UI badges clearly differentiate confirmed threats, suspicious signals, official whitelist matches, and unverified/unknown links.
- **Evidence:** Commit `2e670e4`, `backend/schemas/safety.py` line 73.
- **Status:** [Verified]

### 3. URL Extraction from Plain Text Messages
- **Change:** Added `extract_urls_from_text()` in `detector.py` to extract all HTTP/HTTPS links from messages, sanitize trailing punctuation (`.`, `,`, `!`, `?`, `)`), deduplicate links, and populate `detected_urls` and `url_assessments` in `SafetyAssessmentResponse`.
- **Reason:** Enable users to review message findings and individually inspect contained links without auto-opening or navigating to untrusted destinations.
- **Affected Area:** `backend/safety/detector.py`, `backend/safety/engine.py`, `frontend/src/components/ResultDisplay.jsx`.
- **Impact:** Extracted links are presented as safe plain-text previews with an explicit "Inspect link" button. No user links are auto-opened.
- **Evidence:** Commit `2e670e4`, `backend/safety/detector.py` lines 280-315, `test_url_021_extract_url_with_trailing_punctuation`.
- **Status:** [Verified]

### 4. API Endpoints Compatibility Expansion
- **Change:** Added `/analyze` and `/analyze-url` route aliases (supporting both root and `/api/` prefixes) alongside classic `/api/check/*` endpoints. Added `reasons` and `recommendation` compatibility aliases to response schemas.
- **Reason:** Conform to V6 PRD contract specifications while maintaining 100% backward compatibility for existing clients.
- **Affected Area:** `backend/main.py`, `backend/schemas/safety.py`, `frontend/src/services/apiClient.js`.
- **Impact:** Legacy clients expecting `/analyze` with `message` body or new clients targeting `/analyze-url` succeed transparently.
- **Evidence:** Commit `2e670e4`, `backend/main.py` lines 118-140, `frontend/src/services/apiClient.js` lines 125-155.
- **Status:** [Verified]

### 5. Automated Matrix Test Suite (59 Tests)
- **Change:** Created `backend/tests/test_v6_url_matrix.py` implementing 25 URL test cases (`URL-001` through `URL-025`), 10 message regression tests (`MSG-001` through `MSG-010`), and API contract tests. Added frontend client tests in `apiClient.test.js`.
- **Reason:** Provide repeatable quality gates ensuring no regression on malformed, reserved, truncated, deceptive, or timeout URL scenarios.
- **Affected Area:** `backend/tests/test_v6_url_matrix.py`, `frontend/src/test/apiClient.test.js`.
- **Impact:** Automated test count increased from 22 to 59 in backend (100% pass) and from 10 to 12 in frontend (100% pass).
- **Evidence:** Commit `2e670e4`, `backend/tests/test_v6_url_matrix.py`, `npm test` and `pytest` logs.
- **Status:** [Verified]

### 6. Analyze Page Visual Redesign to Match Reference Screenshot
- **Change:** Redesigned `SafetyAnalyzer.jsx` and added `analyze.css` to replicate `docs/design-references/v6-analyze-page-reference.png`. Implemented header with ClearPay branding, breadcrumb navigation, eyebrow badge, green privacy reassurance banner, two-column layout (message/link input card, "A quick guide", dark navy "What we look for" card), lower pattern cards, and blue disclaimer banner.
- **Reason:** Meet V6 PRD visual and structural requirements while ensuring accessibility, responsiveness, and keyboard navigation.
- **Affected Area:** `frontend/src/components/SafetyAnalyzer.jsx`, `frontend/src/styles/analyze.css`, `frontend/src/components/ResultDisplay.jsx`.
- **Impact:** Analyze view visually matches user reference image; input modes (Message vs. Link) are explicitly switchable with example chips.
- **Evidence:** Commit `2e670e4`, `frontend/src/styles/analyze.css`, `docs/design-references/v6-analyze-page-reference.png`.
- **Status:** [Verified]

---

## [V5.0.0] - 2026-10-17

### 1. Public Landing Page Implementation
- **Change:** Created modular landing page components under `frontend/src/components/landing/` (`HeroSection`, `HeroDemoCard`, `TrustBar`, `FeatureOverviewSection`, `ThreeStepsSection`, `PrivacyCalloutSection`, `CtaBannerSection`, `LandingNavbar`, `LandingFooter`). Added `landing.css`.
- **Reason:** Implement V5 PRD requirements for a calm, trustworthy public presentation based on `docs/design-references/v5-landing-page-reference.png`.
- **Affected Area:** `frontend/src/components/landing/`, `frontend/src/styles/landing.css`.
- **Impact:** Public users entering at `/` see an educational landing page with interactive demonstration cards and links to `/analyze`.
- **Evidence:** Commit `0b2b611`, `frontend/src/components/landing/LandingPage.jsx`.
- **Status:** [Verified]

### 2. Client-Side Route Separation (`/` vs. `/analyze`)
- **Change:** Refactored `App.jsx` to manage lightweight client-side URL routing (`/` for landing page, `/analyze` for safety workspace) using standard browser History API (`popstate`, `pushState`).
- **Reason:** Allow users to navigate seamlessly between the public landing page and the analysis workspace without adding a heavy router dependency.
- **Affected Area:** `frontend/src/App.jsx`.
- **Impact:** Direct links or browser refreshes at `/analyze` render the analyzer directly; navigation to `/` renders the landing page.
- **Evidence:** Commit `0b2b611`, `frontend/src/App.jsx` lines 5-45.
- **Status:** [Verified]

---

## [V4.0.0] - 2026-10-17

### 1. Design Token System & Reusable UI Atom Library
- **Change:** Introduced CSS design tokens (`frontend/src/styles/tokens.css`) defining typography, spacing, radius, colors, and shadows. Created reusable UI atom components (`Button`, `Input`, `Textarea`, `Card`, `Badge`, `Alert`, `Modal`, `ConfirmDialog`, `LoadingSpinner`).
- **Reason:** Eliminate inline style drift, ensure WCAG 2.2 AA contrast compliance, and provide consistent component behavior.
- **Affected Area:** `frontend/src/styles/tokens.css`, `frontend/src/components/ui/`.
- **Impact:** Standardized UI atoms used across all check modals and drawers.
- **Evidence:** Commit `33ae43f`.
- **Status:** [Verified]

### 2. Centralized Frontend API Client
- **Change:** Implemented `frontend/src/services/apiClient.js` with `fetch` abort timeouts (8000ms), offline network detection, and structured `ApiError` classification (`RATE_LIMITED`, `SERVER_ERROR`, `NETWORK_ERROR`, `OFFLINE`). Added 10 unit tests in `frontend/src/test/apiClient.test.js`.
- **Reason:** Centralize HTTP communication, handle timeout/offline edge cases gracefully, and prevent unhandled promise rejections.
- **Affected Area:** `frontend/src/services/apiClient.js`, `frontend/src/test/apiClient.test.js`.
- **Impact:** Uniform error messages displayed across all forms; automated tests verify timeout and rate limit handling.
- **Evidence:** Commit `33ae43f`, `frontend/src/services/apiClient.js`.
- **Status:** [Verified]

### 3. Application Error Boundary
- **Change:** Added React `ErrorBoundary.jsx` wrapping top-level component tree to catch uncaught component rendering exceptions and display a recovery screen.
- **Reason:** Prevent white-screen crashes if third-party libraries (e.g., Tesseract.js or jsQR) fail unexpectedly.
- **Affected Area:** `frontend/src/components/ErrorBoundary.jsx`, `frontend/src/main.jsx`.
- **Impact:** Crashes are isolated to user-friendly error dialogs with reload options.
- **Evidence:** Commit `33ae43f`, `frontend/src/components/ErrorBoundary.jsx`.
- **Status:** [Verified]

---

## [V3.0.0] - 2026-10-17

### 1. Security Headers & Rate Limiting Middleware
- **Change:** Added `SecurityHeadersMiddleware` (`nosniff`, `DENY` X-Frame-Options, `strict-origin-when-cross-origin`) and in-memory token-bucket `RateLimitingMiddleware` (120 requests/window per IP) in `backend/main.py`.
- **Reason:** Protect the API against automated abuse, framing, and MIME sniffing attacks without storing user state.
- **Affected Area:** `backend/main.py`.
- **Impact:** Requests exceeding limits receive controlled HTTP 429 JSON responses; all responses contain security headers.
- **Evidence:** Commit `402315f`, `backend/main.py` lines 34-80.
- **Status:** [Verified]

### 2. Multilingual Localization (Hindi / Hinglish)
- **Change:** Implemented `backend/safety/languages.py` providing localized recommendations, golden rules, and uncertainty notes in Hindi (`hi`) and Hinglish (`hinglish`). Added language selector to frontend header.
- **Reason:** Expand accessibility for Indian regional language speakers vulnerable to digital payment fraud.
- **Affected Area:** `backend/safety/languages.py`, `backend/safety/engine.py`, `frontend/src/components/Header.jsx`.
- **Impact:** Output advice can be translated into colloquial Hindi or Hinglish while retaining deterministic rule scoring.
- **Evidence:** Commit `402315f`, `backend/safety/languages.py`.
- **Status:** [Verified]

### 3. User Feedback & Correction Recording
- **Change:** Created `FeedbackService` and endpoint `POST /api/feedback` to collect anonymous user corrections (`helpful`, `unclear`, `appears_incorrect`) without logging messages, credentials, or PII. Added `FeedbackModal.jsx`.
- **Reason:** Enable continuous rule improvement and benchmark tracking driven by user error reports.
- **Affected Area:** `backend/safety/feedback_service.py`, `backend/main.py`, `frontend/src/components/FeedbackModal.jsx`.
- **Impact:** Users can report false positives or missed scams; feedback count is exposed in `/api/health`.
- **Evidence:** Commit `402315f`, `backend/safety/feedback_service.py`.
- **Status:** [Verified]

### 4. Benchmark Evaluation Dataset & Report
- **Change:** Created `backend/tests/evaluation_dataset.json` (20 labeled samples across English, Hindi, and Hinglish) and `backend/tests/evaluate_model.py` generating accuracy, precision, and recall metrics.
- **Reason:** Validate rule baseline performance against realistic scam and legitimate transaction samples.
- **Affected Area:** `backend/tests/evaluate_model.py`, `backend/tests/evaluation_dataset.json`, `V3_EVALUATION_REPORT.md`.
- **Impact:** 100% benchmark accuracy documented on the 20-sample reference dataset.
- **Evidence:** Commit `402315f`, `V3_EVALUATION_REPORT.md`.
- **Status:** [Verified]

---

## [V2.0.0] - 2026-10-17

### 1. Multi-Modal Analysis: URL & QR Code Inspection
- **Change:** Added `URLChecker` (initial heuristics) and `QRService` (`backend/safety/qr_service.py`) inspecting UPI intent URIs (`upi://pay?...`) and URL payloads without executing transactions or navigating to destinations.
- **Reason:** Address payment fraud originating from QR codes and fake web links.
- **Affected Area:** `backend/safety/url_checker.py`, `backend/safety/qr_service.py`, `backend/main.py`.
- **Impact:** Identifies fraudulent collect requests, fake refund claims in QR notes, and typosquatted domains.
- **Evidence:** Commit `ccc9656`.
- **Status:** [Verified]

### 2. Client-Side Image OCR & QR Decoding
- **Change:** Added `ImageOCRCheck.jsx` using `tesseract.js` for on-device OCR and `UrlQrCheck.jsx` using `jsqr` for on-device QR image decoding.
- **Reason:** Allow users to scan payment screenshots and QR image files entirely on their own device without uploading images to an external server.
- **Affected Area:** `frontend/src/components/ImageOCRCheck.jsx`, `frontend/src/components/UrlQrCheck.jsx`.
- **Impact:** Image pixels and extracted text stay local until the user explicitly reviews, edits, and submits the text for checking.
- **Evidence:** Commit `0217b27`.
- **Status:** [Verified]

### 3. Chrome Browser Extension Prototype
- **Change:** Added Manifest V3 browser extension in `extension/` (`manifest.json`, `background.js`, `popup.html`, `popup.js`).
- **Reason:** Provide quick browser toolbar access for message safety checks.
- **Affected Area:** `extension/`.
- **Impact:** Users can open extension popup to inspect text via local backend API.
- **Evidence:** Commit `0217b27`, `extension/manifest.json`.
- **Status:** [Verified]

---

## [V1.0.0] - 2026-10-16

### 1. Initial Project Architecture & Rule-Based Safety Engine
- **Change:** Initial project setup establishing FastAPI backend, Pydantic schemas, rule-based keyword/regex pattern detector (`detector.py`), risk scoring (`risk.py`), and recommendation generator (`recommendations.py`). Created basic React web UI (`App.jsx`, `TextCheck.jsx`, `GuidedCheck.jsx`).
- **Reason:** Establish baseline MVP for digital payment scam prevention.
- **Affected Area:** `backend/`, `frontend/`.
- **Impact:** Core scam detection rules established for OTP theft, fake KYC threats, AnyDesk coercion, and QR collect traps.
- **Evidence:** Commits `03e1c42`, `5d69d16`, `2a5cb4a`.
- **Status:** [Verified]
