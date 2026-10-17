# Security Test Plan

**Project:** Digital Payment Safety Assistant (ClearPay)  
**Classification:** Defensive Security Boundaries, Attack Surface Hardening, and Privacy Guardrails  
**Document Status:** Current as of V6.0 Architecture (October 2026)

---

## 1. Security Testing Objectives

Because ClearPay operates as a defensive utility handling potentially sensitive data in high-stress user contexts, automated security tests must strictly enforce:
1. **Zero Credential Retention / Logging:** Sensitive financial secrets must never be logged or persisted.
2. **SSRF Immunity:** Target URLs must be inspected purely passively without outbound network sockets.
3. **Abuse Resilience:** Rate limiting and input bounds must protect against DoS attacks.
4. **Adversarial Input Hardening:** Deceptive userinfo, homographs, and unicode tricks must be caught.

---

## 2. Security Test Matrix

| Security Domain | Threat / Attack Vector | Verification Mechanism | Expected Defended Behavior | Priority |
|---|---|---|---|---|
| **Privacy & Leakage** | Log inspection leaks OTP, UPI PIN, or bank passwords | Log interceptor test | Raw message contents and credentials NEVER appear in standard logs. | **P0** |
| **SSRF** | Target URL probes internal metadata (`169.254.169.254`) or loopback | Socket interception test | Zero network calls or HTTP requests are made to the analyzed domain. | **P0** |
| **Integrity** | False-Pass: Zero-day phishing domain received as safe | Matrix test suite | Non-whitelisted domains return `unverified` and `UNABLE_TO_ASSESS`. | **P0** |
| **Phishing Deception** | Userinfo trick: `https://onlinesbi.sbi@scammer.top/login` | Lexical parser test | Userinfo `onlinesbi.sbi` is isolated; destination host `scammer.top` is flagged. | **P0** |
| **Phishing Deception** | Unicode IDN homograph: `https://xn--sbi-9ha.com` | Punycode converter test | Non-ASCII lookalike characters detected; brand impersonation triggered. | **P0** |
| **Denial of Service** | Volumetric flooding (>120 requests in 60s) | Rate limiter test | Requests beyond 120 per minute receive HTTP 429 JSON response. | **P0** |
| **Denial of Service** | Massive payload injection (>50,000 characters) | Pydantic validator test | Payloads over 2,500 chars (text) or 5,000 chars (URL) rejected with HTTP 422. | **P1** |
| **Browser Security** | Clickjacking / iframe embedding | Header validator test | `X-Frame-Options: DENY` strictly enforced on all responses. | **P1** |
| **Browser Security** | MIME-type confusion / sniffing attacks | Header validator test | `X-Content-Type-Options: nosniff` strictly enforced on all responses. | **P1** |
| **CORS Abuse** | Arbitrary untrusted origin requesting credentials | CORS middleware test | Origins restricted to configured whitelist; credentials only allowed for trusted origins. | **P1** |

---

## 3. Detailed Security Test Specifications

### 3.1 Anti-Credential Logging Audit Test
- **Test:** Submit a test message containing high-risk credentials:
  ```json
  {"text": "My SBI OTP is 492819 and my netbanking password is SecretPassword123!"}
  ```
- **Execution:** Capture all logs emitted by `safety.api` during request processing.
- **Assertion:**
  - `assert "492819" not in captured_logs`
  - `assert "SecretPassword123" not in captured_logs`
  - Only audit metadata (e.g. `POST /api/check/text -> 200 (X.Xms)`) is present.

### 3.2 SSRF Passive Inspection Test
- **Test:** Submit sensitive destination URLs:
  - `http://169.254.169.254/latest/meta-data/` (AWS/GCP metadata)
  - `http://127.0.0.1:8000/internal-admin`
  - `http://localhost:3000`
- **Execution:** Mock `socket.socket.connect` and `urllib.request.urlopen` to raise an error if any network connection is attempted.
- **Assertion:**
  - Request completes with HTTP 200.
  - Zero socket connections are opened.
  - Host is correctly categorized as `is_ip_address=True`, `status="unverified"`.

### 3.3 Deceptive Userinfo Phishing Test
- **Test:** Submit: `https://onlinesbi.sbi:secure@fake-kyc-update.xyz/login.apk`
- **Execution:** Pass URL to `URLChecker.analyze_url()`.
- **Assertion:**
  - `domain == "fake-kyc-update.xyz"`
  - `status == "flagged"`
  - `is_suspicious_tld == True`
  - The legitimate bank brand in the userinfo part does NOT trick the checker into assigning a safe rating.
