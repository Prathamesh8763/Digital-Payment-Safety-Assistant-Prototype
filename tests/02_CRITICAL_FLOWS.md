# Critical Application Flows

**Project:** Digital Payment Safety Assistant (ClearPay)  
**Classification:** Verified End-to-End Business Workflows and Critical Failure Paths  
**Document Status:** Current as of V6.0 Architecture (October 2026)

---

## Flow 1: Urgent Scam & Coercion Message Analysis

- **Flow:** User submits a suspicious message, SMS, or phone call scenario to verify whether it is a scam.
- **Purpose:** Protect users from financial loss, unauthorized debits, and credential theft by identifying social engineering tactics in real time.
- **Entry Point:** 
  - Frontend: `SafetyAnalyzer.jsx` (Message tab) $\rightarrow$ `apiClient.analyzeMessage()`.
  - Backend API: `POST /analyze` (or `POST /api/analyze`, `POST /api/check/text`).
- **Major Dependencies:**
  - `backend/safety/engine.py:SafetyEngine`
  - `backend/safety/detector.py:detect_indicators_in_text()`
  - `backend/safety/risk.py:calculate_risk()`
  - `backend/safety/recommendations.py:generate_recommendations()`
- **Expected Success Behavior:**
  - System returns HTTP 200 with `SafetyAssessmentResponse`.
  - Matched scam indicators (e.g. `sensitive_credential_solicitation`, `urgency_pressure`) are extracted with explanations.
  - Overall `risk_level` correctly evaluates to `"HIGH"` (or `"MEDIUM"`).
  - Clear defensive actions ("Never share your OTP or UPI PIN") and educational Golden Rule are rendered.
  - If URLs are detected inside the message, they are extracted, sanitized, and evaluated.
- **Important Failure Cases:**
  - User submits empty string or less than 3 characters $\rightarrow$ HTTP 400 Bad Request.
  - User submits payload over 2,500 characters $\rightarrow$ Pydantic validation error (HTTP 422).
  - Client IP exceeds 120 requests in 60 seconds $\rightarrow$ HTTP 429 Too Many Requests.
  - Backend is unreachable $\rightarrow$ Frontend displays `ApiError` with retry guidance.
- **Risk if Broken:** Critical. A false negative (missing a scam) results in direct financial loss or identity theft for a victim.
- **Recommended Test Type:** Unit (regex rules) + Integration (API contracts) + Regression (benchmark dataset).

---

## Flow 2: URL Safety Verification & False-Pass Elimination

- **Flow:** User inputs a suspicious web address, shortened link, or extracted URL for inspection.
- **Purpose:** Identify phishing sites, typosquatted banking domains, fake APK download links, and unverified web destinations without exposing the user to drive-by malware.
- **Entry Point:**
  - Frontend: `SafetyAnalyzer.jsx` (Link tab) $\rightarrow$ `apiClient.analyzeUrl()`.
  - Backend API: `POST /analyze-url` (or `POST /api/analyze-url`, `POST /api/check/url`).
- **Major Dependencies:**
  - `backend/safety/url_checker.py:URLChecker`
  - `urllib.parse:urlsplit`
  - `ipaddress:ip_address`
- **Expected Success Behavior:**
  - Known official bank domain with HTTPS (`https://onlinesbi.sbi`) $\rightarrow$ `status="no_known_threat_found"`, `risk_level="LOW"`.
  - Known phishing/typosquatted brand (`http://sbi-kyc-verify.top/login.apk`) $\rightarrow$ `status="flagged"`, `risk_level="HIGH"`.
  - Fabricated, private IP, or unknown domain (`https://random-unknown-pay.invalid`) $\rightarrow$ `status="unverified"`, `risk_level="UNABLE_TO_ASSESS"` (Never defaulting to LOW).
  - Link is rendered as a plain-text preview with no automatic navigation or outbound HTTP traffic.
- **Important Failure Cases:**
  - Missing URL scheme $\rightarrow$ System canonicalizes protocol (`https://`) gracefully.
  - Deceptive userinfo trick (`https://google.com@evil.com`) $\rightarrow$ System strips userinfo and evaluates `evil.com`.
  - Punycode homograph attack (`https://xn--sbi-9ha.com`) $\rightarrow$ System detects non-ASCII confusable characters.
- **Risk if Broken:** Severe (P0). Falsely marking an unverified or unknown URL as "safe" tricks victims into logging into phishing portals.
- **Recommended Test Type:** Unit (matrix `URL-001` to `URL-025`) + Integration (`test_v6_url_matrix.py`).

---

## Flow 3: UPI QR Code & Reverse Collect Trap Inspection

- **Flow:** User checks a QR code payload or payment request string (e.g. `upi://pay?...`).
- **Purpose:** Prevent the widespread "Enter your UPI PIN to receive money" scam where victims scan a QR code expecting a refund/payment but actually authorize an outgoing debit.
- **Entry Point:**
  - Frontend: `UrlQrCheck.jsx` (or decoded QR input) $\rightarrow$ `apiClient.checkQr()`.
  - Backend API: `POST /api/check/qr`.
- **Major Dependencies:**
  - `backend/safety/qr_service.py:QRService`
  - `backend/safety/url_checker.py:URLChecker`
- **Expected Success Behavior:**
  - Parses payee VPA (`pa`), payee name (`pn`), amount (`am`), and note (`tn`).
  - If user context includes "receive money", "buyer", or "refund", flags `qr_receive_trap` with `risk_level="HIGH"`.
  - Renders explicit warning: *"Scanning a QR code can ONLY send money from your account. You NEVER enter a PIN to receive money."*
- **Important Failure Cases:**
  - Empty or corrupt payload $\rightarrow$ HTTP 400 Bad Request.
  - Payload contains an embedded malicious URL rather than a UPI URI $\rightarrow$ Automatically routes payload to `URLChecker`.
- **Risk if Broken:** High (P1). Users fall victim to OLX/marketplace payment reversal scams.
- **Recommended Test Type:** Unit (UPI parsing) + Integration (QR endpoint).

---

## Flow 4: On-Device Screenshot Text Extraction (OCR)

- **Flow:** User drops a screenshot of an SMS, WhatsApp chat, or payment error into the web browser.
- **Purpose:** Allow non-technical users who cannot easily copy/paste text to inspect images without uploading sensitive financial screenshot images to a cloud server.
- **Entry Point:**
  - Frontend: `ImageOCRCheck.jsx`.
- **Major Dependencies:**
  - `tesseract.js` (WebAssembly OCR engine running in browser Web Worker).
- **Expected Success Behavior:**
  - Image file is read via `FileReader` locally in browser memory.
  - WASM worker processes image canvas and returns extracted text string.
  - Extracted text is placed into an editable textarea for user confirmation.
  - Image bytes never cross the network.
- **Important Failure Cases:**
  - Image resolution too low or blurry $\rightarrow$ Returns empty or garbled text; prompts user to type manually.
  - Unsupported image format $\rightarrow$ Client validates file extension/MIME before processing.
  - Worker fails or runs out of browser memory $\rightarrow$ `ErrorBoundary.jsx` catches crash and shows recovery prompt.
- **Risk if Broken:** Medium (P2). Degrades accessibility for users who rely on screenshots, forcing manual transcription.
- **Recommended Test Type:** Frontend component integration test + Error boundary fallback test.

---

## Flow 5: Local Analysis History & User Data Control

- **Flow:** User views past checks, exports a timestamped JSON safety report, or clears history.
- **Purpose:** Give users transparency and offline access to their scan history while preserving zero-retention server privacy.
- **Entry Point:**
  - Frontend: `HistoryDrawer.jsx` and `SafetyAnalyzer.jsx:saveToHistory()`.
- **Major Dependencies:**
  - Browser `window.localStorage` API (`payment_safety_assistant_history_v2`).
- **Expected Success Behavior:**
  - Each completed check automatically prepends a summary record to local storage.
  - List is bounded to 30 items (oldest dropped via FIFO).
  - Clicking "Export JSON" triggers instant local file download (`safety_analysis_history_<date>.json`).
  - Clicking "Clear all" opens confirmation modal; confirming deletes the `localStorage` key.
- **Important Failure Cases:**
  - Browser private/incognito mode restricts storage access $\rightarrow$ Graceful in-memory fallback.
  - Corrupted JSON in `localStorage` $\rightarrow$ `loadStoredHistory()` catches syntax error and defaults to `[]`.
- **Risk if Broken:** Low-Medium (P3). User loses local report history, but safety analysis remains functional.
- **Recommended Test Type:** Frontend unit test (`apiClient.test.js` storage mocks) + Component testing.

---

## Flow 6: Anonymous Feedback & Continuous Learning

- **Flow:** User marks an assessment as "Helpful" or reports an inaccurate finding ("False alarm", "Missed scam").
- **Purpose:** Gather field accuracy metrics to refine heuristic patterns without collecting personal identifiable information.
- **Entry Point:**
  - Frontend: `FeedbackModal.jsx` $\rightarrow$ `apiClient.submitFeedback()`.
  - Backend API: `POST /api/feedback`.
- **Major Dependencies:**
  - `backend/safety/feedback_service.py:FeedbackService`.
  - Storage: `backend/feedback_store.json`.
- **Expected Success Behavior:**
  - Validates feedback rating and assessment type.
  - Appends record to `feedback_store.json` (bounded to 500 items).
  - Returns HTTP 200 with unique `feedback_id`.
  - `GET /api/health` increments `feedback_entries_count`.
- **Important Failure Cases:**
  - Submissions more frequent than 1 per 3 seconds per IP $\rightarrow$ Returns status `"rate_limited"` without crashing.
  - User attempts to include long commentary $\rightarrow$ Truncated to 300 characters.
- **Risk if Broken:** Low (P3). Developer feedback loop is interrupted; core safety checks are unaffected.
- **Recommended Test Type:** Integration test (`test_safety_engine.py:test_feedback_recording`).
