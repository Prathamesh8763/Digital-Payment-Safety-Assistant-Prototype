# Test Strategy

**Project:** Digital Payment Safety Assistant (ClearPay)  
**Classification:** Quality Architecture, Test Philosophy, and Test Framework Specifications  
**Document Status:** Current as of V6.0 Architecture (October 2026)

---

## 1. Project Test Objective

The primary objective of the testing strategy for the Digital Payment Safety Assistant is to **guarantee high-stakes accuracy, deterministic repeatability, and safety invariant preservation**. 

Because ClearPay operates as a defensive triage tool for vulnerable citizens facing financial scams and coercion:
- **False-Pass Elimination is P0:** The system must never falsely certify an unknown, fabricated, or unverified link as safe (`LOW` risk).
- **Sub-Millisecond Determinism:** Pattern matching and URL checks must evaluate locally and predictably without external network flakiness.
- **Privacy Assurance:** Tests must verify that raw user communications and payment credentials are never leaked to logs or external services.

---

## 2. Detected Test Frameworks & Directory Conventions

The repository is structured as a dual-tier architecture with separate test runners optimized for each language runtime:

| Tier | Language | Test Framework | Test Directory | Execution Command | Status |
|---|---|---|---|---|---|
| **Backend API & Safety Engine** | Python 3.14.7 | `pytest` 9.1.1 | `backend/tests/` | `backend\.venv\Scripts\python.exe -m pytest backend/tests` | **Active** (59 tests passing) |
| **Frontend Web Client** | JavaScript (ESM) | Node.js Native Test Runner (`node:test`) | `frontend/src/test/` | `npm test` (inside `frontend/`) | **Active** (12 tests passing) |
| **Static Code Quality** | JavaScript / JSX | `oxlint` 1.81.0 | `frontend/` | `npm run lint` (inside `frontend/`) | **Active** (0 warnings, 0 errors) |
| **Project-Level Test Strategy** | Markdown Documentation | Specification | `tests/` (Root) | N/A (Documentation only) | **Active** |

---

## 3. Tiered Testing Strategy

### 3.1 Unit Testing Strategy
- **Backend Core:**
  - Test individual regex patterns in `backend/safety/detector.py` (credential solicitation, urgency, fear threats, impersonation, remote access apps, fake rewards).
  - Test risk calculation algorithms in `backend/safety/risk.py`.
  - Test URL normalization, IDN homograph translation, and TLD categorization in `backend/safety/url_checker.py`.
  - Test UPI intent URI query parsing in `backend/safety/qr_service.py`.
- **Frontend Core:**
  - Test `apiClient.js` request formatting, response normalization, abort timeout handling (8000ms), and custom `ApiError` classification (`RATE_LIMITED`, `SERVER_ERROR`, `NETWORK_ERROR`, `OFFLINE`).

### 3.2 Integration Testing Strategy
- **API Gateway & Middleware Integration:**
  - Use Starlette/FastAPI `TestClient` to send synthetic HTTP requests through the middleware stack (`SecurityHeadersMiddleware`, `RateLimitingMiddleware`).
  - Verify route backward compatibility: `/analyze` and `/api/check/text`, `/analyze-url` and `/api/check/url`.
  - Validate response payload serialization against Pydantic V2 schemas (`SafetyAssessmentResponse`, `URLCheckResponse`).
- **Engine Coordination:**
  - Verify that `SafetyEngine.analyze_text()` successfully orchestrates `detector.py`, URL extraction, `url_checker.py`, and recommendation synthesis.

### 3.3 Regression & Benchmark Testing Strategy
- **Matrix Regression Suite (`test_v6_url_matrix.py`):**
  - Evaluates 25 explicit URL scenarios (`URL-001` through `URL-025`) covering malformed URLs, IPv4/IPv6 literals, RFC reserved TLDs (`.invalid`, `.test`), typosquats, and homoglyphs.
  - Evaluates 10 full-length message scenarios (`MSG-001` through `MSG-010`) covering multimodal scam scripts.
- **Labeled Benchmark Dataset (`backend/tests/evaluation_dataset.json`):**
  - 20 labeled samples across English, Hindi, and Hinglish evaluated by `evaluate_model.py` to ensure 100% accuracy, precision, and recall against known scam patterns.

### 3.4 E2E Strategy (End-to-End)
- Lightweight browser journey validation covering:
  - Landing page navigation $\rightarrow$ `/analyze` routing.
  - Example chip selection $\rightarrow$ form populate $\rightarrow$ submission $\rightarrow$ result card rendering.
  - Local history drawer $\rightarrow$ record persistence $\rightarrow$ single deletion $\rightarrow$ full wipe.

---

## 4. What Should NOT Be Tested

To avoid fragile tests and maintain execution speed:
1. **Third-Party Internal Implementations:** Do not test internal mechanics of Tesseract.js WASM or jsQR library internals; test only our component wrapper interfaces and fallback handling.
2. **Live External Network Outbound Calls:** Never send live requests to real scam URLs, live banking portals, or live external reputation feeds during automated tests.
3. **Pure CSS Visual Polish:** Avoid brittle pixel-matching snapshot tests; verify presence of semantic elements, accessibility attributes (`aria-*`), and responsive class tokens instead.
4. **FastAPI Framework Internals:** Do not test whether FastAPI parses JSON; test our Pydantic validation rules and error responses.

---

## 5. Test Priorities

- **P0 (Critical Safety Invariants & Security):**
  - False-pass elimination: Unknown or fabricated domains must never return `LOW` risk.
  - Rate limiting enforcement: IPs exceeding 120 req/min must be throttled.
  - Logging hygiene: Zero logging of raw message bodies or credentials.
  - Memory bounds: Large payloads (>2,500 chars for text, >5,000 for URLs) rejected with HTTP 400.
- **P1 (Core Features):**
  - Accurate categorization of high-risk scam scripts (OTP theft, fake KYC, AnyDesk coercion, QR collect traps).
  - Accurate extraction of URLs with trailing punctuation.
  - Centralized API client error handling and retry bounds.
- **P2 (Usability & Accessibility):**
  - Multilingual localization (Hindi and Hinglish translation of recommendations).
  - Client-side history storage and retention limits (sliding window of 30).
  - Feedback submission and rolling retention (500 records).
- **P3 (Edge Polish):**
  - Character counter dynamics in the UI.
  - Breadcrumb navigation and example chip population.

---

## 6. Test Execution Philosophy

1. **Deterministic Fast Execution:** The entire automated test suite (59 backend tests + 12 frontend tests) must execute in under 2 seconds.
2. **Offline-First:** All unit, integration, and regression tests must pass without an active internet connection.
3. **Zero State Pollution:** Tests must not write persistent artifacts to git-tracked directories or create uncleaned background processes.
