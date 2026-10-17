# API Test Plan

**Project:** Digital Payment Safety Assistant (ClearPay)  
**Classification:** REST Endpoints, Input Validation, Response Schema Contracts, and Error Taxonomy  
**Document Status:** Current as of V6.0 Architecture (October 2026)

---

## 1. API Surface Overview

The ClearPay backend exposes 8 public HTTP REST endpoints. Tests must verify both modern V6 endpoint paths and legacy V1-V3 backward-compatibility aliases:

| Method | Endpoint | Supported Aliases | Request Model | Response Model | Status |
|---|---|---|---|---|---|
| `POST` | `/analyze` | `/api/analyze`, `/api/check/text` | `LegacyAnalyzeRequest` / `TextCheckRequest` | `SafetyAssessmentResponse` | **P0** |
| `POST` | `/analyze-url` | `/api/analyze-url`, `/api/check/url` | `URLCheckRequest` | `URLCheckResponse` | **P0** |
| `POST` | `/api/check/guided` | N/A | `GuidedCheckRequest` | `SafetyAssessmentResponse` | **P1** |
| `POST` | `/api/check/qr` | N/A | `QRCheckRequest` | `QRCheckResponse` | **P1** |
| `POST` | `/api/feedback` | N/A | `FeedbackRequest` | `FeedbackResponse` | **P2** |
| `GET` | `/api/health` | N/A | None | Health JSON Dictionary | **P1** |
| `GET` | `/api/scenarios` | N/A | None | List of Scenario Objects | **P2** |
| `GET` | `/api/evaluation/benchmark` | N/A | None | `EvaluationMetrics` | **P2** |

---

## 2. Endpoint Test Specifications

### 2.1 `POST /analyze` (Message Analysis)
- **Positive Test Cases:**
  - Standard scam message (impersonation + urgency + OTP) $\rightarrow$ 200 OK, `risk_level="HIGH"`, `indicators` non-empty.
  - Normal transaction notification ("Paid ₹40 at Sharma Tea Stall via UPI") $\rightarrow$ 200 OK, `risk_level="LOW"`, `is_safe_practice=True`.
  - Multilingual payload (`language="hi"` or `"hinglish"`) $\rightarrow$ 200 OK, localized advice in Hindi/Hinglish.
  - Text containing embedded URL (`"Click http://bank-update.top/login.apk"`) $\rightarrow$ 200 OK, `detected_urls` contains URL, `url_assessments` populated.
- **Negative / Edge Test Cases:**
  - Empty string $\rightarrow$ 400 Bad Request (`detail="Please provide a message or description of at least 3 characters."`).
  - Whitespace-only string (`"   "`) $\rightarrow$ 400 Bad Request.
  - Text length > 2,500 characters $\rightarrow$ 422 Unprocessable Entity (Pydantic validation).
  - Legacy body structure (`{"message": "..."}` instead of `{"text": "..."}`) $\rightarrow$ 200 OK (compatibility alias).

### 2.2 `POST /analyze-url` (URL Inspection)
- **Positive Test Cases:**
  - Official bank URL (`https://onlinesbi.sbi`) $\rightarrow$ 200 OK, `status="no_known_threat_found"`, `risk_level="LOW"`.
  - Phishing brand domain (`http://sbi-kyc-verify.top/login.apk`) $\rightarrow$ 200 OK, `status="flagged"`, `risk_level="HIGH"`.
  - Unknown fabricated domain (`https://unknown-tax-portal.invalid`) $\rightarrow$ 200 OK, `status="unverified"`, `risk_level="UNABLE_TO_ASSESS"`.
  - Private IP (`http://192.168.1.1/login`) $\rightarrow$ 200 OK, `status="unverified"`, `is_ip_address=True`.
- **Negative / Edge Test Cases:**
  - Empty URL string $\rightarrow$ 422 Unprocessable Entity (`min_length=1`).
  - URL exceeding 5,000 characters $\rightarrow$ 422 Unprocessable Entity.
  - Missing protocol (`sbi.co.in`) $\rightarrow$ 200 OK, automatically prepends `https://`.

### 2.3 `POST /api/check/qr` (QR Payload Analysis)
- **Positive Test Cases:**
  - Legitimate merchant UPI payload (`upi://pay?pa=merchant@upi&pn=Store&am=100`) $\rightarrow$ 200 OK, `payload_type="upi_intent"`.
  - Reverse collect trap (`upi://pay?pa=scam@upi&am=5000` with context "receive money") $\rightarrow$ 200 OK, `risk_level="HIGH"`, `qr_receive_trap` indicator.
  - QR containing web URL (`https://bank-kyc.top`) $\rightarrow$ 200 OK, `payload_type="url"`, passes through URL checker.
- **Negative / Edge Test Cases:**
  - Empty payload $\rightarrow$ 400 Bad Request (`"QR payload cannot be empty."`).

### 2.4 `POST /api/feedback` (User Rating)
- **Positive Test Cases:**
  - Valid submission (`feedback_rating="helpful"`, `assessment_type="text"`) $\rightarrow$ 200 OK, `status="success"`, `feedback_id` populated.
  - Valid correction (`feedback_rating="appears_incorrect"`, `feedback_category="false_alarm"`) $\rightarrow$ 200 OK.
- **Negative / Edge Test Cases:**
  - Rapid repeated submissions (<3.0s from same IP) $\rightarrow$ 200 OK with `status="rate_limited"`, `feedback_id="throttled"`.
  - Long comments (>500 chars) $\rightarrow$ 422 Unprocessable Entity.

---

## 3. Global Middleware Verification

- **Security Headers Test:**
  - Inspect response headers on any endpoint:
    - Assert `X-Content-Type-Options == "nosniff"`.
    - Assert `X-Frame-Options == "DENY"`.
    - Assert `Referrer-Policy == "strict-origin-when-cross-origin"`.
    - Assert `X-XSS-Protection == "1; mode=block"`.
- **Rate Limiting Test:**
  - Send 120 consecutive requests within 60s $\rightarrow$ 200 OK.
  - Send 121st request $\rightarrow$ 429 Too Many Requests (`{"detail": "Rate limit exceeded..."}`).
