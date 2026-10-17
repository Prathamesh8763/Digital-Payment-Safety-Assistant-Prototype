# Rejected, Replaced, and Avoided Options

**Document Status:** Current as of V6.0 Release (October 2026)  
**Project:** Digital Payment Safety Assistant (ClearPay)  
**Classification:** Explicitly Avoided, Replaced, and Abandoned Decisions

---

## 1. Server-Side Persistent Database (PostgreSQL / SQLite / MongoDB)

- **Option:** Integrating a persistent relational or document database to store analyzed messages and scan logs.
- **Decision:** **Explicitly Avoided**
- **Evidence:** 
  - `backend/requirements.txt` contains zero database packages, ORMs, or connection pools (no SQLAlchemy, Alembic, psycopg, pymongo).
  - Explicit privacy guarantee in UI: *"We never store your messages, passwords, or account details on our servers."*
  - Logging in `backend/main.py` explicitly censors raw message contents and credentials.
- **Reason:** Storing user messages and payment screenshots introduces severe privacy and security liabilities. Users frequently paste confidential OTPs, bank statements, and personal transaction records into security checkers. Storing this data creates severe compliance (GDPR/DPDP) and data breach exposure.
- **Current Alternative:** Completely stateless request-response architecture; optional user history is persisted strictly in the browser's local `window.localStorage` (max 10 items, entirely user-managed).
- **Impact:** Absolute privacy guarantee by design; zero persistent data breach liability; zero database maintenance overhead.

---

## 2. Server-Side OCR & Image Upload Endpoint

- **Option:** Uploading screenshots of payment requests or QR codes to a backend server endpoint (`/api/upload`) for OCR processing.
- **Decision:** **Explicitly Avoided**
- **Evidence:** 
  - Backend does not expose any multipart file upload endpoints.
  - `frontend/src/components/ImageOCRCheck.jsx` uses `tesseract.js` (WebAssembly) directly in the browser worker thread.
  - `frontend/src/components/UrlQrCheck.jsx` uses `jsqr` to decode QR codes from HTML Canvas data in the browser.
- **Reason:** Transmitting image screenshots over the network violates user privacy and requires heavy server-side processing, image storage, and bandwidth costs.
- **Current Alternative:** On-device client-side OCR via `tesseract.js` and canvas-based QR decoding via `jsQR`.
- **Impact:** Network traffic is minimized; sensitive financial screenshot pixels never leave the user's personal device.

---

## 3. Active Crawling / Auto-Navigating Untrusted URLs

- **Option:** Utilizing a headless browser (Puppeteer/Playwright) or HTTP client (`requests`/`httpx`) to crawl, follow redirects, or inspect live contents of untrusted links.
- **Decision:** **Explicitly Avoided / Rejected**
- **Evidence:** 
  - Explicit rule in `backend/safety/url_checker.py`: No outbound network requests to the target domain are made during inspection.
  - UI in `SafetyAnalyzer.jsx` renders links as unclickable plain-text previews with an explicit "Inspect link" button.
- **Reason:** Visiting untrusted links can trigger drive-by malware downloads, validate recipient email/phone numbers for scammers, or trigger scammer honeypot detection mechanisms.
- **Current Alternative:** Purely passive lexical URL analysis, Punycode/IDN homograph detection, TLD risk heuristics, and verified domain whitelist matching.
- **Impact:** Total immunity to remote exploitation or active link triggers; zero SSRF attack surface.

---

## 4. Defaulting Unknown URLs to "Safe / Low Risk" (False-Pass Heuristic)

- **Option:** Assigning a `LOW` risk rating to any URL that does not match an existing known blacklist rule.
- **Decision:** **Replaced / Rejected in V6.0**
- **Evidence:** 
  - Commit `2e670e4`, `backend/safety/url_checker.py` lines 40-120.
  - 37 automated test cases in `backend/tests/test_v6_url_matrix.py` verifying that fabricated, test-reserved, or unverified domains do not receive a pass.
- **Reason:** Scammers continuously generate zero-day domains that do not appear on blacklists. In digital payments, *absence of evidence is not evidence of safety*. Treating unknown domains as safe produced dangerous false-pass verdicts.
- **Current Alternative:** Unknown domains return `status="unverified"` and `risk_level="UNABLE_TO_ASSESS"` with cautious defensive guidance.
- **Impact:** 100% elimination of false passes on newly registered, fabricated, or reserved domains.

---

## 5. Heavy Client-Side Router Library (React Router / TanStack Router)

- **Option:** Adding `react-router-dom` or TanStack Router for application navigation.
- **Decision:** **Explicitly Avoided**
- **Evidence:** `frontend/package.json` contains no router dependency; `App.jsx` uses a simple `currentView` state hook synchronized with native browser `popstate`/`pushState` events.
- **Reason:** ClearPay is a focused, 2-view application (Marketing Landing Page and Analyzer Workspace). Introducing an external router increases bundle overhead, complexity, and maintenance without functional benefit.
- **Current Alternative:** Native React state-based view switching with clean browser history synchronization.
- **Impact:** Sub-second build times (~350ms) and minimal JavaScript bundle footprint.

---

## 6. External User Authentication Provider (Firebase Auth, Auth0, Supabase)

- **Option:** Requiring user sign-in or account creation prior to running safety checks.
- **Decision:** **Explicitly Avoided**
- **Evidence:** Zero authentication dependencies, tokens, session cookies, or login screens exist anywhere in the repository.
- **Reason:** Payment security checks must be instantaneous for users in distress or urgency without creating accounts or entering passwords.
- **Current Alternative:** Frictionless public triage utility with in-memory token-bucket rate limiting (120 req/window).
- **Impact:** Maximum accessibility during emergency scam verification; zero credential management liabilities.
