# Current State Analysis

**Document Status:** Current as of V6.0 Release (October 17, 2026)  
**Classification:** System Architecture, Active Capabilities, Inconsistencies & Open Transitions  

---

## 1. System Overview & Technology Inventory

| Component | Path / Location | Technology | Status | Verification |
|---|---|---|---|---|
| **Backend API** | `backend/` | Python 3.14.7, FastAPI, Pydantic, Uvicorn | Active | [Verified] |
| **Frontend Web App** | `frontend/` | React 19.x, Vite 8.x, Lucide React, CSS Tokens | Active | [Verified] |
| **Browser Extension** | `extension/` | Chrome Manifest V3, Vanilla JS, Service Worker | Prototype | [Verified] |
| **On-Device OCR** | `frontend/src/components/ImageOCRCheck.jsx` | Tesseract.js (Client-side WASM) | Active | [Verified] |
| **On-Device QR** | `frontend/src/components/UrlQrCheck.jsx` | jsQR (Client-side Canvas Decoder) | Active | [Verified] |
| **Backend Test Suite** | `backend/tests/` | Pytest 9.1.1 (59 automated tests) | Active | [Verified] |
| **Frontend Test Suite** | `frontend/src/test/` | Node.js Test Runner (12 tests) | Active | [Verified] |
| **Design Specifications** | `docs/design-references/` | PNG References (`v5-landing-page`, `v6-analyze-page`) | Preserved | [Verified] |

---

## 2. Active Features & Workflows

### 2.1 Public Landing Page (`/`)
- **[Verified]** Clean, accessible marketing and education page based on `docs/design-references/v5-landing-page-reference.png`.
- **[Verified]** Features:
  - Top announcement banner.
  - ClearPay navigation bar with action CTA (`Analyze a message ↗`).
  - Hero section with interactive `HeroDemoCard` illustrating scam signal breakdown.
  - Three-step trust & confidence anchors.
  - Feature guidance cards (`#learn`) and process overview (`#how-it-works`).
  - Explicit privacy callout (`#privacy`) guaranteeing zero credential collection.
  - Direct client-side routing to `/analyze`.

### 2.2 Safety Analyzer Workspace (`/analyze`)
- **[Verified]** Rebuilt under V6 to match `docs/design-references/v6-analyze-page-reference.png`:
  - **Header:** ClearPay brand logo (`C`), navigation links, language picker (EN / HI / Hinglish), and `← Back to home` button.
  - **Breadcrumbs & Eyebrow:** `Home / Analyze a message` with `MESSAGE SAFETY CHECK` pill.
  - **Privacy Guarantee Banner:** Prominent light-green reassurance box confirming no passwords, PINs, or account numbers are collected.
  - **Two-Column Primary Layout:**
    - **Left Column (Main Analysis Card):**
      - Explicit mode switcher: **Message** vs. **Link / URL** (with tab access to **"I'm Not Sure"** guided survey and **History**).
      - Textarea / input with live character counter (`0 / 2,000`).
      - Three pre-configured example chips (`Account blocked`, `Unexpected UPI request`, `Urgent payment demand`) that populate inputs without auto-submitting.
      - Yellow credential warning line: *"Never paste an OTP, UPI PIN, password, card number, or bank login."*
      - High-contrast royal blue submit CTA: `Analyze message →` / `Inspect link →`.
      - Processing reassurance note.
    - **Right Column:**
      - `A quick guide`: 3 numbered steps with colored badges and divider lines.
      - `What we look for`: High-contrast dark navy card (`#0b1329`) detailing 4 primary red flags (urgency, credential demands, payment manipulation, suspicious links).
  - **Lower Educational Section:**
    - Eyebrow: `BETTER TO PAUSE THAN GUESS`.
    - 3 pattern cards with colored top accent bars (`Pressure to act now`, `Secrets or credentials`, `Unusual payment steps`).
  - **Advisory Banner:** Blue banner reminding users that analysis is guidance, not a guarantee.
  - **Footer:** ClearPay educational disclaimer and privacy/help links.

### 2.3 URL Safety Engine & False-Pass Elimination
- **[Verified]** Foundational Invariant: *"No match is not proof of safety. Unknown results must stay unknown."*
- **[Verified]** Verification Status Mapping:
  - `flagged`: Confirmed threat match, brand typosquatting, or executable installer download (`.apk`, `.exe`).
  - `suspicious`: URL shortener (`bit.ly`, `tinyurl.com`), suspicious TLD (`.top`, `.xyz`, etc.), deceptive userinfo prefix (`trusted.example@attacker.invalid`), or plain unencrypted HTTP on sensitive paths.
  - `no_known_threat_found`: Verified official financial domain (`onlinesbi.sbi`, `hdfcbank.com`, etc.) with valid HTTPS.
  - `unverified`: Syntactically valid URL on an unknown domain, RFC 2606/6761 reserved test domain (`.invalid`, `.example`, `.test`, `.localhost`), or private IP (`127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, AWS/GCP metadata `169.254.169.254`). **Never passes as safe.**
  - `invalid_input`: Malformed scheme (e.g. `ht!tp://`), dangerous scheme (`javascript:`, `data:`, `intent:`), missing host, illegal host characters, control characters, or length > 2,000.
  - `provider_unavailable`: Reputation provider timeout, HTTP 429/5xx, or network failure.
- **[Verified]** Safe URL Normalization: Automatically prefixes `https://` to scheme-less inputs, displays a real-time preview, and preserves the original input without altering host or path.
- **[Verified]** URL Extraction from Messages: Detects all HTTP/HTTPS links in text, sanitizes trailing sentence punctuation, deduplicates, and renders plain-text previews with an isolated `Inspect link →` button.

### 2.4 Multimodal Services & Tooling
- **[Verified]** Text Message Analysis (`/api/check/text`, `/analyze`): Pattern detection across 10 scam categories with severity scoring and payment fraud overrides.
- **[Verified]** "I'm Not Sure" Guided Check (`/api/check/guided`): Step-by-step survey assessing sender claim, requested action, urgency, and sensitive data requests.
- **[Verified]** QR Code Inspection (`/api/check/qr`): Decodes UPI intent parameters (`pa`, `pn`, `am`, `tn`) and warns that entering a UPI PIN only sends money out.
- **[Verified]** Multilingual Support (`languages.py`): Localized explanations, golden rules, and uncertainty notes for English, Hindi (`hi`), and Hinglish (`hinglish`).
- **[Verified]** Local Session History (`HistoryDrawer.jsx`): Client-side browser `localStorage` (max 30 records) with individual record delete and clear-all actions.
- **[Verified]** User Feedback Workflow (`/api/feedback`): Submits anonymous accuracy ratings (`helpful`, `unclear`, `appears_incorrect`) without storing messages or credentials.

---

## 3. Current Architecture & Operational Patterns

### 3.1 Network Fetch & SSRF Invariant
- **[Verified]** The backend **never** connects directly to, crawls, downloads from, or follows redirects from any user-submitted URL or IP address.
- **[Verified]** All URL evaluations operate entirely in-memory using parsing, string/TLD heuristics, local official domain directories, and optional mocked/configured reputation adapters.

### 3.2 Privacy & Secret Management
- **[Verified]** Audit logs in `backend/main.py` record method, path, status, and duration (`GET /api/... -> 200 (1.2ms)`). No message bodies, URL query parameters, or credentials are logged.
- **[Verified]** Password fields embedded in URL userinfo (`user:pass@host`) are redacted to `user:***` before appearing in results or logs.

### 3.3 Rate Limiting & Security Headers
- **[Verified]** In-memory token bucket rate limiter restricts clients to 120 requests/minute per IP, returning HTTP 429 on exhaustion.
- **[Verified]** Security headers applied to all responses: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-XSS-Protection: 1; mode=block`.

---

## 4. Deprecated, Unreferenced, or Superseded Components

| Component | Location | Current Status | Rationale |
|---|---|---|---|
| `Header.jsx` | `frontend/src/components/Header.jsx` | Unreferenced | [Verified] Superseded in V6 by `SafetyAnalyzer.jsx`'s integrated header to ensure exact compliance with `v6-analyze-page-reference.png`. |
| `TextCheck.jsx` | `frontend/src/components/TextCheck.jsx` | Unreferenced in `/analyze` | [Verified] Message checking form was inlined into `SafetyAnalyzer.jsx` to support V6 character counters, example chips, and layout requirements. |
| `UrlQrCheck.jsx` | `frontend/src/components/UrlQrCheck.jsx` | Unreferenced in `/analyze` | [Verified] Link checking was inlined into `SafetyAnalyzer.jsx` for V6 URL normalization preview and example chips. QR decoding remains available in component file. |

---

## 5. Detected Contradictions & Inconsistencies

1. **Test Count Discrepancy in `README.md`:**
   - *Documentation:* `README.md` lines 55 states: `Testing: Pytest (22 backend unit tests) + Benchmark Evaluator...`
   - *Implementation:* The actual test suite now has **59 backend tests** (22 in `test_safety_engine.py` + 37 in `test_v6_url_matrix.py`).
   - *Status:* [Verified Contradiction]

2. **FastAPI Application Version Metadata:**
   - *Documentation / Code:* In `backend/main.py` line 30, the FastAPI application metadata specifies `version="3.0.0"` and description mentions `V3 Multi-Modal...`.
   - *Implementation:* The project is currently at V6.0.0.
   - *Status:* [Verified Contradiction]

3. **Browser Extension API Contract Lag:**
   - *Code:* `extension/popup.js` calls `/api/check/text` and renders output based on V2/V3 fields (`risk_level`, `why_suspicious`, `recommended_actions`).
   - *Implementation:* It does not consume the V6 `/analyze-url` endpoint or display V6 verification statuses (`unverified`, `no_known_threat_found`, etc.).
   - *Status:* [Verified Contradiction]

4. **URLhaus / Web Risk Reputation Providers:**
   - *Documentation:* V6 PRD discusses integration of Google Web Risk, Safe Browsing, and URLhaus.
   - *Implementation:* No external API keys or network clients are enabled. The backend reports `checks_unavailable: ["external_reputation_provider_not_configured"]`.
   - *Status:* [Verified Current State]

---

## 6. Known Incomplete Changes & Pending Transitions

1. **Live Threat Reputation Provider:**
   - Provider selection (Google Web Risk Lookup API vs. Safe Browsing vs. local hash lists) is documented but requires external credentials and commercial terms review before live deployment.
2. **Hindi & Regional Language Parity for V6 Analyze UI:**
   - While backend localized advice (`languages.py`) supports Hindi and Hinglish, the static UI copy of the redesigned V6 Analyze page (labels, guide text, feature cards) is currently English-first.
3. **Browser Extension Modernization (P2):**
   - Updating `extension/` to support direct link inspection and V6 status badges is queued for a future release cycle.

---

## 7. Verification Summary Matrix

| Capability | Tested Status | Test Command | Result |
|---|---|---|---|
| Backend Safety Engine Regression | Automated | `pytest backend/tests/test_safety_engine.py` | 22 / 22 Passed |
| URL Matrix (URL-001 to URL-025) | Automated | `pytest backend/tests/test_v6_url_matrix.py` | 25 / 25 Passed |
| Message Regression (MSG-001 to MSG-010) | Automated | `pytest backend/tests/test_v6_url_matrix.py` | 10 / 10 Passed |
| API Contracts (`/analyze`, `/analyze-url`) | Automated | `pytest backend/tests/test_v6_url_matrix.py` | 2 / 2 Passed |
| Total Backend Pytest Suite | Automated | `pytest backend/tests` | **59 / 59 Passed** (0.43s) |
| Frontend API Client Suite | Automated | `npm test` | **12 / 12 Passed** (61ms) |
| Frontend Code Quality | Automated | `npm run lint` (`oxlint`) | **0 Errors, 0 Warnings** |
| Production Build Compilation | Automated | `npm run build` (`vite build`) | **Clean Build** (350ms) |
