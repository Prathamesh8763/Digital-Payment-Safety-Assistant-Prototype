# Test Environment & Isolation Specification

**Project:** Digital Payment Safety Assistant (ClearPay)  
**Classification:** Test Runtimes, Isolation Boundaries, Environment Variables, and Mocking Strategy  
**Document Status:** Current as of V6.0 Architecture (October 2026)

---

## 1. Local & Test Execution Environments

The testing architecture is separated into two isolated, offline-first execution environments:

| Environment | Host Runtime | Execution Path | Isolation Mechanism |
|---|---|---|---|
| **Backend Test Suite** | Python 3.14.7 | `backend/` | Isolated Python Virtualenv (`backend/.venv/`), in-process Starlette ASGI `TestClient` (no open network sockets). |
| **Frontend Test Suite** | Node.js v24.19.0 | `frontend/` | Native Node.js test runner (`node:test`), mocked `globalThis.fetch`, in-memory mock DOM. |

---

## 2. Database & Persistence Strategy

- **Database Strategy:** **N/A (Stateless Application)**
  - There is NO SQL database (PostgreSQL, MySQL, SQLite) or NoSQL database (MongoDB, DynamoDB) in this project.
  - Zero database migrations or test database spinning is required.
- **File Persistence Isolation (`feedback_store.json`):**
  - Production feedback is stored at `backend/feedback_store.json`.
  - When running tests on `FeedbackService`, tests should target a temporary file path or mock `FEEDBACK_FILE_PATH` using `pytest`'s built-in `tmp_path` fixture to avoid polluting the local feedback store.
- **Client Storage Isolation (`localStorage`):**
  - Browser tests isolate storage by initializing clean mock storage dictionaries before each test suite and clearing keys in `afterEach` hooks.

---

## 3. Environment Variables & Test Configuration

Tests must execute without requiring any live API secrets. The test runner uses the following environment configuration:

| Variable | Test Default Value | Purpose | Notes |
|---|---|---|---|
| `GEMINI_API_KEY` | `""` (Empty string) | Disables live external calls to Google Gemini API | Ensures tests run 100% deterministic baseline logic. |
| `ALLOWED_ORIGINS` | `"http://localhost:5173,http://127.0.0.1:5173"` | Configures CORS origin validation | Allows local test origins. |
| `TESTING` | `"true"` | Signals test runtime | Suppresses extraneous standard output logs. |

> [!IMPORTANT]
> Real production API keys (e.g. valid `GEMINI_API_KEY` or Google Cloud credentials) **MUST NOT** be set or checked into version control.

---

## 4. Mocked & Sandbox Services

### 4.1 External AI Provider (Google Gemini)
- **Status:** **MOCKED IN TESTS**
- **Implementation:** Tests verify fallback behavior by ensuring `GEMINI_API_KEY` is unset. For AI-enhancement tests, `httpx.AsyncClient.post` is mocked using `unittest.mock.AsyncMock` or custom transport returning canned JSON responses (`{"contextual_summary": "Test summary"}`).
- **Invariant:** Tests must NEVER make live outbound HTTPS calls to `https://generativelanguage.googleapis.com`.

### 4.2 External Threat Intelligence Feeds (Web Risk, Safe Browsing, URLhaus)
- **Status:** **NOT CURRENTLY AVAILABLE / STUBBED**
- **Implementation:** `URLChecker` uses an optional `provider_simulator` parameter in `__init__`. In tests, passing a simulator allows testing provider timeout, malicious rating, or provider error states without network traffic.

### 4.3 Web Worker & Canvas (Tesseract.js / jsQR)
- **Status:** **STUBBED IN UNIT TESTS**
- **Implementation:** Node.js native unit tests do not run browser WebAssembly workers or WebGL canvas contexts. Frontend unit tests cover the API client and data transforms; WASM OCR is tested via manual browser verification or dedicated headless browser fixtures.

---

## 5. Production Resources That MUST NOT Be Used

1. **NO Live Scammer URLs:** Tests must never ping or navigate to live phishing links, malware URLs, or dynamic DNS hosts. All test URLs must use RFC 2606 / 6761 reserved domains (`.invalid`, `.test`, `.example`, `.localhost`) or static synthetic strings.
2. **NO Live Banking APIs:** Tests must never connect to live UPI switches, NPCI payment gateways, or banking netbanking portals.
3. **NO Production Telemetry / Remote Endpoints:** Tests must not emit outbound telemetry to remote cloud monitoring endpoints.

---

## 6. Test Cleanup Requirements

1. **Zero Git Dirt:** Automated test runs must leave no temporary files, test JSON dumps, or modified configurations in the repository.
2. **Pytest Cache:** Pytest caches bytecodes in `.pytest_cache/` (which is excluded via `.gitignore`).
3. **Feedback Store Preservation:** If a test exercises `FeedbackService._append_to_store()`, the test must restore `backend/feedback_store.json` to its pre-test state or execute inside a temporary directory.
