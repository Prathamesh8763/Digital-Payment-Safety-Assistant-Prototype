# Risk-Based Test Plan

**Project:** Digital Payment Safety Assistant (ClearPay)  
**Classification:** Project-Specific Risk Analysis and Targeted Verification Gates  
**Document Status:** Current as of V6.0 Architecture (October 2026)

---

## 1. Risk: False-Pass Regression on Unknown / Fabricated URLs

- **Evidence:** `backend/safety/url_checker.py` lines 40-120 and commit `2e670e4`. Previous versions defaulted unflagged domains to `LOW` risk because no blacklist rule triggered.
- **Affected Files / Modules:** `backend/safety/url_checker.py`, `backend/schemas/safety.py`, `backend/tests/test_v6_url_matrix.py`.
- **Failure Scenario:** A user receives an SMS with a newly registered malicious domain (`https://customs-tax-clearance.top/pay`). Because the domain is not in a local static blacklist, an unhardened checker assigns `LOW` risk ("No known phishing indicators"). The user trusts the verdict and loses money.
- **Impact:** Critical (P0). Complete failure of user trust; direct financial victimization.
- **Required Test:** Automated test matrix asserting that unknown domains, private IPs, and RFC reserved domains (`.invalid`, `.test`) strictly return `status="unverified"` and `risk_level="UNABLE_TO_ASSESS"`.
- **Priority:** **P0**

---

## 2. Risk: Inadvertent Sensitive Credential Logging

- **Evidence:** `backend/main.py` lines 76-79 and privacy constraints (FR-07/FR-10). The API handles user-pasted text that often contains confidential OTPs, UPI PINs, card numbers, or passwords.
- **Affected Files / Modules:** `backend/main.py`, `backend/safety/detector.py`.
- **Failure Scenario:** A developer introduces `logger.info(f"Checking text: {payload.text}")` for debugging, which dumps real bank account numbers, OTPs, or passwords into server log files or cloud logging collectors (e.g. CloudWatch / Google Cloud Logging).
- **Impact:** Critical (P0). Catastrophic privacy breach; violation of DPDP / GDPR regulations.
- **Required Test:** Integration test scanning standard log output during request processing to assert that raw message content, passwords, or PINs never appear in log records.
- **Priority:** **P0**

---

## 3. Risk: Server-Side Request Forgery (SSRF) via Target URL Crawling

- **Evidence:** `backend/safety/url_checker.py` lines 62-70: *"Inspects URLs without external outbound network calls (SSRF-safe)."*
- **Affected Files / Modules:** `backend/safety/url_checker.py`.
- **Failure Scenario:** A feature is added to "preview" or "fetch favicon" of the submitted URL using `urllib.request` or `httpx.get()`. An attacker submits `http://169.254.169.254/latest/meta-data/` or `http://localhost:8000/internal-admin`, allowing access to cloud instance metadata or internal services.
- **Impact:** Critical (P0). Full infrastructure takeover or cloud credential leakage.
- **Required Test:** Code audit and test asserting that `URLChecker.analyze_url()` makes zero outbound socket connections or HTTP requests during evaluation.
- **Priority:** **P0**

---

## 4. Risk: Rate Limiting Bypass & Denial of Service (DoS)

- **Evidence:** `backend/main.py` lines 47-82 (`RateLimitingMiddleware` with 120 req/min per IP window).
- **Affected Files / Modules:** `backend/main.py`.
- **Failure Scenario:** Malicious bots send thousands of concurrent requests with massive text bodies (>100,000 characters), consuming server CPU on regex evaluation and causing an outage for legitimate users.
- **Impact:** High (P1). Service denial during scam spikes.
- **Required Test:**
  - Send 121 requests within 60 seconds from the same client IP and assert HTTP 429 response.
  - Submit payloads exceeding schema length bounds (2,500 chars for text) and assert immediate HTTP 422 rejection before regex execution.
- **Priority:** **P1**

---

## 5. Risk: Reverse Collect Scam Misclassification (QR Code)

- **Evidence:** `backend/safety/qr_service.py` lines 44-56 (`qr_receive_trap` rule). Scammers tell victims to scan a QR code to "receive" funds.
- **Affected Files / Modules:** `backend/safety/qr_service.py`, `backend/tests/test_safety_engine.py`.
- **Failure Scenario:** A user scans an OLX buyer's QR code. The engine fails to parse the context keyword "receive" or fails to detect the `upi://pay` scheme, returning a benign status. The victim authorizes the transaction and has funds debited.
- **Impact:** High (P1). Direct payment fraud victimization.
- **Required Test:** Unit test with payload `upi://pay?pa=scammer@upi&am=5000` combined with context `"buyer sent this to receive money"` asserting deterministic `HIGH` risk and `qr_receive_trap` indicator.
- **Priority:** **P1**

---

## 6. Risk: External AI Provider Timeout or Outage

- **Evidence:** `backend/safety/ai_analysis.py` lines 32-77. Google Gemini API is used optionally for contextual summaries.
- **Affected Files / Modules:** `backend/safety/ai_analysis.py`, `backend/safety/engine.py`.
- **Failure Scenario:** The Google Gemini API experiences latency or outage, or the user enters an invalid `GEMINI_API_KEY`. An unhandled exception crashes the request or delays user triage past the 4.0-second timeout.
- **Impact:** Medium (P2). Poor user experience during an urgent scam situation.
- **Required Test:** Integration test simulating Gemini API timeout (>4.0s) and HTTP 500 error, asserting that the engine cleanly falls back to the deterministic baseline with `ai_enhanced=False` and HTTP 200.
- **Priority:** **P2**

---

## 7. Risk: Feedback Store Disk Bloat

- **Evidence:** `backend/safety/feedback_service.py` lines 8-10 (`FEEDBACK_FILE_PATH` and `MAX_FEEDBACK_ENTRIES = 500`).
- **Affected Files / Modules:** `backend/safety/feedback_service.py`.
- **Failure Scenario:** Automated bots spam `/api/feedback`, continuously appending entries to `feedback_store.json` until the server runs out of disk space.
- **Impact:** Medium (P2). Server disk exhaustion.
- **Required Test:** Unit test appending 550 mock feedback records and verifying that the store size strictly remains capped at 500 records.
- **Priority:** **P2**

---

## 8. Risk: Unicode Homograph Brand Spoofing (IDN Deception)

- **Evidence:** `backend/safety/url_checker.py` lines 29-53 (`FINANCIAL_TARGET_BRANDS` and `OFFICIAL_AUTHORIZED_DOMAINS`).
- **Affected Files / Modules:** `backend/safety/url_checker.py`.
- **Failure Scenario:** Scammer registers `https://sbí.com` (using Latin small letter i with acute: `\u00ED`). Visually identical to SBI, but punycode converts to `xn--sb-oja.com`. If the engine only checks ASCII, it misses the brand impersonation.
- **Impact:** High (P1). Phishing site goes undetected.
- **Required Test:** Test case submitting punycode lookalike domain and verifying detection of non-ASCII characters and brand impersonation.
- **Priority:** **P1**
