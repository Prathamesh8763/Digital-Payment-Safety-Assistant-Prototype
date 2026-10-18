# Current State Analysis

**Document Status:** Current as of V9.0 Release (October 18, 2026)  
**Classification:** System Architecture, Active Capabilities, Inconsistencies & Open Transitions  

---

## 1. System Overview & Technology Inventory

| Component | Path / Location | Technology | Status | Verification |
|---|---|---|---|---|
| **Backend API** | `backend/` | Python 3.14.7, FastAPI, Pydantic v2, Uvicorn (v9.0.0) | Active | [Verified] |
| **Frontend Web App** | `frontend/` | React 19.x, Vite 8.x, Lucide React, CSS Tokens | Active | [Verified] |
| **Browser Extension** | `extension/` | Chrome Manifest V3, Vanilla JS, Service Worker | Prototype | [Verified] |
| **On-Device OCR** | `frontend/src/components/ImageOCRCheck.jsx` | Tesseract.js (Client-side WASM) | Active | [Verified] |
| **On-Device QR** | `frontend/src/components/UrlQrCheck.jsx` | jsQR (Client-side Canvas Decoder) | Active | [Verified] |
| **Backend Test Suite** | `backend/tests/` | Pytest 9.1.1 (79 automated tests across 4 test suites) | Active | [Verified] |
| **Frontend Test Suite** | `frontend/src/test/` | Node.js Test Runner (22 tests across 3 suites) | Active | [Verified] |
| **Design Specifications** | `docs/design-references/` | PNG References (`v5-landing-page`, `v6-analyze-page`, `v8-analysis-result-reference`, `v9-guided-help-reference`) | Preserved | [Verified] |

---

## 2. Active Features & Workflows

### 2.1 Public Landing Page (`/`)
- **[Verified]** Clean, accessible marketing and education page based on `docs/design-references/v5-landing-page-reference.png`.
- **[Verified]** Features:
  - Top announcement banner with direct link to Guided Help (`/guided-help`).
  - ClearPay navigation bar with action CTAs (`I'm Not Sure` and `Analyze a message ↗`).
  - Hero section with interactive `HeroDemoCard` illustrating scam signal breakdown.
  - Three-step trust & confidence anchors.
  - Feature guidance cards (`#learn`) and process overview (`#how-it-works`).
  - Explicit privacy callout (`#privacy`) guaranteeing zero credential collection.
  - Direct client-side routing to `/analyze` and `/guided-help`.

### 2.2 Safety Analyzer Workspace (`/analyze`)
- **[Verified]** Rebuilt under V6 to match `docs/design-references/v6-analyze-page-reference.png`:
  - **Header:** ClearPay brand logo (`C`), navigation links, language picker (EN / HI / Hinglish), and `← Back to home` button.
  - **Breadcrumbs & Eyebrow:** `Home / Analyze a message` with `MESSAGE SAFETY CHECK` pill.
  - **Privacy Guarantee Banner:** Prominent light-green reassurance box confirming no passwords, PINs, or account numbers are collected.
  - **Guided Help Shortcut:** Interactive workspace banner on the guided tab directing users to the full `/guided-help` interactive experience.
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

### 2.3 Dedicated Analysis Result Experience (V8 Reference Fidelity)
- **[Verified]** Built directly from mandatory visual reference asset `docs/design-references/v8-analysis-result-reference.png`:
  - **Header Transition:** Displays `← Back to Analyze` button when viewing results, smoothly resetting back to the analysis input workspace without full page reload.
  - **Breadcrumbs & State Pill:** `Home / Analyze a message / Result` with an explicit top-right pill (`ILLUSTRATIVE EXAMPLE` or `ANALYSIS COMPLETED`).
  - **Eyebrow & Headline:** `ANALYSIS RESULT` pill above `Here's what we found.` and subhead `Review the warning signs and the link status, then choose a safer next step.`
  - **Wide Risk Summary Banner:** Prominent themed card (`high`, `medium`, `low`, `unverified`) with circular SVG icon, status tag (`HIGH RISK`), headline (`Pause before you click or pay.`), and right-hand white stat card displaying exact count (`3 warning signs`).
  - **Two-Column Middle Section:**
    - Left Card: **Warning signs found** with indicator count badge, circular warning icons, plain-language descriptions, and quoted evidence chips (or `UNVERIFIED URL` pill).
    - Right Card: **What to do next** with 3 numbered action steps (`Do not click the link`, `Do not share credentials or verify`, `Check your account independently`).
  - **Two-Column Lower Section:**
    - Left Card: **Message and link reviewed** displaying quoted message body in a tinted box and inline `LINK` chip with uppercase status badge (`UNVERIFIED`, `FLAGGED`, `CHECKED CLEAN`).
    - Right Card: **Analysis details** table with completed status rows (`Message pattern review: Completed`, `URL status: Unverified`, `Live reputation result: Not shown in this example`).
  - **Three-Column Interpret Guidance Section:** Explains the distinct meanings of `High risk`, `Unverified`, and `No known threat found`.
  - **Action Bar & Safety Redaction:** Working interactive buttons for `Analyze another message`, `Copy summary` (auto-strips credentials and query tokens via `resultFormatters.js`), `Report issue` feedback modal, and reference report identifier (`Example report ID: CP-7F24` or actual `REF-...`).

### 2.4 Guided Help Experience (`/guided-help`, V9 Reference Fidelity)
- **[Verified]** Built directly from mandatory visual reference asset `docs/design-references/v9-guided-help-reference.png`:
  - **Header & Navigation:** ClearPay logo, breadcrumb `Home / Guided help`, and `← Back to Analyze` or `← Back to Home` navigation links.
  - **Eyebrow & Headline:** `STEP-BY-STEP GUIDANCE` pill above `Tell us what's happening.` and subhead `Choose the situation that matches what you're dealing with. We'll ask a couple of quick questions and give you clear next steps.`
  - **Urgent Emergency Compromise Banner:** Red-accented emergency callout at the top with quick link to immediate steps for users who already shared an OTP, PIN, password, or approved an unexpected transfer.
  - **Scenario Selection Grid (3x2 Desktop):** 6 clearly articulated everyday payment situations:
    1. `I got a suspicious message` (Threats, prize claims, parcel updates, or unexpected requests).
    2. `Someone is asking me for money` (Buyer on an online marketplace, unknown caller, or supposed friend).
    3. `A link or website feels off` (Page looks strange, misspellings, or asking for card/bank details).
    4. `Someone wants me to scan a QR code` (Seller or stranger sent a QR code to 'receive' money).
    5. `Someone told me to install an app` (Caller claims to be technical support, bank, or utility agent).
    6. `I think I already paid or shared details` (Immediate containment steps, numbers to call, and damage control).
  - **Interactive Follow-Up Question Flow:**
    - Presents 2–4 targeted questions per scenario with plain-English radio options.
    - Preserves answers and allows stepping back or restarting at any point.
    - Includes explicit `Emergency Steps` button at every step.
  - **Tailored Plain-English Guidance Screen:**
    - Summary card with severity status badge (`HIGH RISK - DO NOT PROCEED`, `HIGH RISK - STOP IMMEDIATELY`, `PROCEED WITH CAUTION`, `ROUTINE PRECAUTIONS`).
    - Urgent Warning Banner for critical situations highlighting red flags.
    - Actionable Checklist (`What to do right now`) with numbered concrete steps.
    - `What NEVER to do` card highlighting high-risk behaviors (never enter PIN to receive money, never share OTP).
    - `Copy this checklist` button with positive clipboard feedback.
    - Deep-link transition to `/analyze` (`Analyze the specific message or link →`).
  - **Privacy Guarantee Modal:** Accessible from footer/nav, confirming no sensitive information or credentials are ever recorded.

### 2.5 URL Safety Engine & False-Pass Elimination
- **[Verified]** Foundational Invariant: *"No match is not proof of safety. Unknown results must stay unknown."*
- **[Verified]** Verification Status Mapping:
  - `flagged`: Confirmed threat match, brand typosquatting, or executable installer download (`.apk`, `.exe`).
  - `suspicious`: URL shortener (`bit.ly`, `tinyurl.com`), suspicious TLD (`.top`, `.xyz`, etc.), deceptive userinfo prefix (`trusted.example@attacker.invalid`), or plain unencrypted HTTP on sensitive paths.
  - `no_known_threat_found`: Verified official financial domain (`onlinesbi.sbi`, `hdfcbank.com`, etc.) with valid HTTPS.
  - `unverified`: Syntactically valid URL on an unknown domain, RFC 2606/6761 reserved test domain (`.invalid`, `.example`, `.test`, `.localhost`), or private IP (`127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, AWS/GCP metadata `169.254.169.254`). **Never passes as safe.**
  - `invalid_input`: Malformed scheme (e.g. `ht!tp://`), dangerous scheme (`javascript:`, `data:`, `intent:`), missing host, illegal host characters, control characters, or length > 2,000.
  - `provider_unavailable`: Reputation provider timeout, HTTP 429/5xx, or network failure.
- **[Verified]** Safe URL Normalization: Automatically prefixes `https://` to scheme-less inputs, displays a real-time preview, and preserves the original input without altering host or path.
- **[Verified]** Adversarial Defenses (SEC-001 through SEC-030): Robust regex and validation against script injection, credential leakage, cut-off URLs, and deceptive punycode domains.

### 2.6 Multimodal Services & Tooling
- **[Verified]** Text Message Analysis (`/api/check/text`, `/analyze`): Pattern detection across 10 scam categories with severity scoring and payment fraud overrides.
- **[Verified]** Guided Help Engine (`/api/guided-help`, `/guided-help`): Full interactive question trees and safety guidance for 6 everyday scenarios.
- **[Verified]** "I'm Not Sure" Guided Check (`/api/check/guided`): Legacy step-by-step survey assessing sender claim, requested action, urgency, and sensitive data requests.
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

## 5. Resolved & Detected Inconsistencies

1. **Test Count & Documentation Alignment:**
   - *Previous Status:* `README.md` and old documentation referenced outdated counts (22 or 59 tests).
   - *Current Status:* Implementation has **79 backend tests** and **22 frontend tests**. All documentation updated in `changelog.md` and `current-state.md`.
   - *Resolution:* [Resolved]

2. **FastAPI Application Version Metadata:**
   - *Previous Status:* In `backend/main.py`, FastAPI app version was lagging at older versions.
   - *Current Status:* FastAPI version in `backend/main.py` is updated to `9.0.0` across application definition, `root()`, and `health_check()`.
   - *Resolution:* [Resolved]

3. **URLhaus / Web Risk Reputation Providers:**
   - *Current State:* External API keys remain optional. When unconfigured, the backend reports `checks_unavailable: ["external_reputation_provider_not_configured"]`. The engine safely evaluates heuristics in-memory without breaking.
   - *Status:* [Verified Current State]

---

## 6. Known Incomplete Changes & Pending Transitions

1. **Live Threat Reputation Provider:**
   - Provider selection (Google Web Risk Lookup API vs. Safe Browsing vs. local hash lists) is documented but requires external credentials and commercial terms review before live deployment.
2. **Hindi & Regional Language Parity for V9 Guided Help UI:**
   - While backend localized advice (`languages.py`) supports Hindi and Hinglish, the static UI copy of the redesigned V9 Guided Help page (labels, scenario descriptions, questions) is currently English-first.
3. **Browser Extension Modernization (P2):**
   - Updating `extension/` to support direct link inspection and V9 status badges is queued for a future release cycle.

---

## 7. Verification Summary Matrix

| Capability | Tested Status | Test Command | Result |
|---|---|---|---|
| Backend Safety Engine Regression | Automated | `pytest backend/tests/test_safety_engine.py` | 22 / 22 Passed |
| URL Matrix (URL-001 to URL-025) | Automated | `pytest backend/tests/test_v6_url_matrix.py` | 25 / 25 Passed |
| Message Regression (MSG-001 to MSG-010) | Automated | `pytest backend/tests/test_v6_url_matrix.py` | 10 / 10 Passed |
| API Contracts (`/analyze`, `/analyze-url`) | Automated | `pytest backend/tests/test_v6_url_matrix.py` | 2 / 2 Passed |
| V8 Result Contract & Health Version | Automated | `pytest backend/tests/test_v8_result_contract.py` | 5 / 5 Passed |
| V9 Adversarial & Security Tests (SEC-001 to SEC-030) | Automated | `pytest backend/tests/test_v9_adversarial_security.py` | 15 / 15 Passed |
| **Total Backend Pytest Suite** | Automated | `pytest backend/tests` | **79 / 79 Passed** (0.64s) |
| Frontend API Client Suite | Automated | `npm test` (`api.test.js`) | 12 / 12 Passed |
| Frontend Result Formatter Suite | Automated | `npm test` (`resultFormatters.test.js`) | 5 / 5 Passed |
| Frontend Guided Help Suite | Automated | `npm test` (`guidedHelp.test.js`) | 5 / 5 Passed |
| **Total Frontend Test Suite** | Automated | `npm test` | **22 / 22 Passed** (68ms) |
| Frontend Code Quality | Automated | `npm run lint` (`oxlint`) | **0 Errors, 0 Warnings** |
| Production Build Compilation | Automated | `npm run build` (`vite build`) | **Clean Build** (1.36s) |
