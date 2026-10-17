# Test Planning Matrix

**Project:** Digital Payment Safety Assistant (ClearPay)  
**Classification:** Verification Matrix Across Areas, Behaviors, Test Types, and Priorities  
**Document Status:** Current as of V6.0 Architecture (October 2026)

---

## Priority Legend
- **P0:** Security, privacy breach, false-pass regression, core service outage.
- **P1:** Core scam detection, URL verification, QR trap detection, primary user analysis workflows.
- **P2:** Educational concepts, multilingual localization, user feedback loop, local history management.
- **P3:** UI state polish, example chips, character counters, layout edge cases.

---

## Comprehensive Test Planning Matrix

| Area | Verified Behavior | Unit | Integration | E2E | Priority | Existing Coverage |
|---|---|:---:|:---:|:---:|:---:|---|
| **Safety Engine** | Detect OTP / UPI PIN / MPIN solicitation | Yes | Yes | Yes | **P0** | `test_safety_engine.py` (Covered) |
| **Safety Engine** | Detect KYC account suspension / block threats | Yes | Yes | Yes | **P0** | `test_safety_engine.py` (Covered) |
| **Safety Engine** | Detect Remote Access Tools (AnyDesk, TeamViewer) | Yes | Yes | Yes | **P0** | `test_safety_engine.py` (Covered) |
| **Safety Engine** | Detect Fake Refund / Overpayment reversal traps | Yes | Yes | No | **P1** | `test_safety_engine.py` (Covered) |
| **Safety Engine** | Detect Lottery / Lucky Draw advance fee fraud | Yes | Yes | No | **P1** | `test_safety_engine.py` (Covered) |
| **Safety Engine** | Preserve legitimate payment notification debits | Yes | Yes | Yes | **P1** | `test_safety_engine.py` (Covered) |
| **Safety Engine** | Calculate risk scores (0-100) and severity tiers | Yes | Yes | No | **P1** | `test_safety_engine.py` (Covered) |
| **URL Checker** | False-Pass Elimination: Unknown domain $\rightarrow$ `unverified` | Yes | Yes | Yes | **P0** | `test_v6_url_matrix.py` (Covered) |
| **URL Checker** | False-Pass Elimination: Reserved TLD (`.invalid`, `.test`) | Yes | Yes | No | **P0** | `test_v6_url_matrix.py` (Covered) |
| **URL Checker** | Private / Loopback IP address detection | Yes | Yes | No | **P0** | `test_v6_url_matrix.py` (Covered) |
| **URL Checker** | Deceptive userinfo stripping (`safe@attacker.com`) | Yes | Yes | No | **P0** | `test_v6_url_matrix.py` (Covered) |
| **URL Checker** | Punycode / IDN homograph detection (`xn--...`) | Yes | Yes | No | **P0** | `test_v6_url_matrix.py` (Covered) |
| **URL Checker** | Malicious extension detection (`.apk`, `.exe`, `.scr`) | Yes | Yes | Yes | **P0** | `test_v6_url_matrix.py` (Covered) |
| **URL Checker** | Official authorized bank whitelist verification | Yes | Yes | Yes | **P1** | `test_v6_url_matrix.py` (Covered) |
| **URL Checker** | Suspicious abuse TLD detection (`.top`, `.xyz`, etc.) | Yes | Yes | No | **P1** | `test_v6_url_matrix.py` (Covered) |
| **URL Checker** | URL shortener detection (`bit.ly`, `tinyurl.com`) | Yes | Yes | No | **P1** | `test_v6_url_matrix.py` (Covered) |
| **URL Extraction** | Extract HTTP/HTTPS links from plain text | Yes | Yes | No | **P1** | `test_v6_url_matrix.py` (Covered) |
| **URL Extraction** | Strip trailing punctuation (`.`, `,`, `!`, `?`, `)`) | Yes | Yes | No | **P1** | `test_v6_url_matrix.py` (Covered) |
| **QR Code Service** | Parse `upi://pay` URI parameters (`pa`, `pn`, `am`) | Yes | Yes | No | **P1** | `test_safety_engine.py` (Covered) |
| **QR Code Service** | Flag "Scan QR to receive money" reverse collect trap | Yes | Yes | Yes | **P0** | `test_safety_engine.py` (Covered) |
| **QR Code Service** | Embedded URL fallback in QR payload | Yes | Yes | No | **P1** | `test_safety_engine.py` (Covered) |
| **Guided Check** | Synthesize questionnaire answers into risk assessment | Yes | Yes | No | **P1** | `test_safety_engine.py` (Covered) |
| **Localization** | Localize recommendations into Hindi (`hi`) | Yes | Yes | No | **P2** | `test_safety_engine.py` (Covered) |
| **Localization** | Localize recommendations into Hinglish (`hinglish`) | Yes | Yes | No | **P2** | `test_safety_engine.py` (Covered) |
| **Feedback Loop** | Record anonymous ratings in `feedback_store.json` | Yes | Yes | No | **P2** | `test_safety_engine.py` (Covered) |
| **Feedback Loop** | Enforce 500-item FIFO retention bound on feedback | Yes | Yes | No | **P2** | Covered in unit test |
| **Feedback Loop** | Throttle feedback submissions (max 1 per 3s/IP) | Yes | Yes | No | **P2** | Covered in unit test |
| **API Gateway** | Route aliases (`/analyze`, `/analyze-url`, `/api/check/*`) | No | Yes | No | **P1** | `test_v6_url_matrix.py` (Covered) |
| **API Gateway** | Rate Limiting Middleware (120 req/min token bucket) | No | Yes | No | **P0** | `apiClient.test.js` (Covered) |
| **API Gateway** | Security Headers (`nosniff`, `DENY`, `strict-origin`) | No | Yes | No | **P0** | Verified in middleware |
| **API Gateway** | Privacy Audit Log: Suppress raw message bodies | No | Yes | No | **P0** | Verified in logger |
| **Frontend Client** | `apiClient.js` 8000ms AbortController timeout | Yes | No | No | **P1** | `apiClient.test.js` (Covered) |
| **Frontend Client** | `ApiError` classification (`RATE_LIMITED`, `OFFLINE`) | Yes | No | No | **P1** | `apiClient.test.js` (Covered) |
| **Frontend Vision** | On-device WASM OCR text extraction (`tesseract.js`) | Yes | No | Yes | **P1** | Manual / E2E candidate |
| **Frontend Vision** | On-device Canvas QR decoding (`jsqr`) | Yes | No | Yes | **P1** | Manual / E2E candidate |
| **Frontend Storage**| Save assessment to `localStorage` (max 30 items) | Yes | No | Yes | **P2** | Manual / E2E candidate |
| **Frontend Storage**| Export timestamped JSON report from history | Yes | No | Yes | **P2** | Manual / E2E candidate |
| **Frontend Storage**| Clear single history item or clear all records | Yes | No | Yes | **P2** | Manual / E2E candidate |
| **Frontend UI** | Example chips populate input without auto-submit | Yes | No | Yes | **P3** | Manual / E2E candidate |
| **Frontend UI** | Character counter enforcement (0 / 2,000) | Yes | No | No | **P3** | Manual / E2E candidate |
| **AI Augmentation** | Graceful fallback when `GEMINI_API_KEY` is missing | Yes | Yes | No | **P1** | Verified in `ai_analysis.py` |
| **AI Augmentation** | HTTPX timeout handling (4.0s) for Gemini calls | Yes | Yes | No | **P1** | Verified in `ai_analysis.py` |
