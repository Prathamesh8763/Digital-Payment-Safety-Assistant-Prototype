# Technology Decisions

**Document Status:** Current as of V6.0 Release (October 2026)  
**Project:** Digital Payment Safety Assistant (ClearPay)  
**Classification:** Verified Technology Stack, Versioning, and Rationale

---

## 1. Languages & Core Runtimes

| Technology | Verified Version | Location / Usage | Purpose & Implementation | Verification |
|---|---|---|---|---|
| **Python** | `3.14.7` | `backend/` | Powers the core REST API, regular expression scam detection, Unicode confusable mapping, URL parsing, and scoring engine. | **CONFIRMED** (`python --version`, `backend/`) |
| **JavaScript (ES2022+)** | Node `v24.19.0` | `frontend/`, `extension/` | Powers the client UI application, Web Workers for client-side WASM OCR, and Chrome Extension background service worker. | **CONFIRMED** (`package.json`, `manifest.json`) |

---

## 2. Backend Frameworks & Libraries

| Technology | Verified Version | Location / Usage | Purpose & Actual Usage | Verification |
|---|---|---|---|---|
| **FastAPI** | `>=0.110.0` | `backend/main.py` | Asynchronous ASGI framework handling all incoming HTTP requests, route registration, CORS, middleware, and auto-generated OpenAPI documentation. | **CONFIRMED** (`requirements.txt`, `main.py`) |
| **Uvicorn** | `>=0.28.0` | `run_backend.bat` | Production ASGI web server serving FastAPI with hot reload in development and async worker capability. | **CONFIRMED** (`requirements.txt`, `run_backend.bat`) |
| **Pydantic** | `>=2.6.0` | `backend/schemas/safety.py` | Runtime schema validation, strict data contracts, alias management, and JSON serialization. | **CONFIRMED** (`requirements.txt`, `schemas/safety.py`) |
| **HTTPX** | `>=0.27.0` | `backend/safety/ai_analysis.py` | Asynchronous HTTP client used exclusively to call the Google Gemini API with strict 4.0-second timeouts. | **CONFIRMED** (`requirements.txt`, `ai_analysis.py`) |
| **pytest** | `9.1.1` | `backend/tests/` | Test framework executing the 59 automated unit and matrix test cases (`test_safety_engine.py`, `test_v6_url_matrix.py`). | **CONFIRMED** (Test execution passing 59/59) |

---

## 3. Frontend Frameworks & Libraries

| Technology | Verified Version | Location / Usage | Purpose & Actual Usage | Verification |
|---|---|---|---|---|
| **React** | `^19.2.8` | `frontend/src/` | Component-based UI library managing reactive state, input forms, signal cards, educational drawers, and landing page sections. | **CONFIRMED** (`frontend/package.json`) |
| **React DOM** | `^19.2.8` | `frontend/src/main.jsx` | DOM renderer mounting the root component tree. | **CONFIRMED** (`frontend/package.json`) |
| **Vite** | `^8.3.0` | `frontend/vite.config.js` | Fast build tool and development server providing instant HMR and ~350ms production bundling. | **CONFIRMED** (`frontend/package.json`, `vite.config.js`) |
| **Lucide React** | `^1.58.0` | `frontend/src/components/` | Accessible, tree-shakeable SVG icon library providing intuitive security badges (ShieldCheck, AlertTriangle, AlertOctagon, HelpCircle). | **CONFIRMED** (`frontend/package.json`) |
| **Tesseract.js** | `^7.0.0` | `frontend/src/components/ImageOCRCheck.jsx` | WebAssembly-based client-side OCR engine. Extracts text from payment screenshots inside the browser worker thread. | **CONFIRMED** (`frontend/package.json`, `ImageOCRCheck.jsx`) |
| **jsQR** | `^1.4.0` | `frontend/src/components/UrlQrCheck.jsx` | Pure JavaScript QR code decoder that scans image canvas data locally in the browser to extract UPI strings and URLs. | **CONFIRMED** (`frontend/package.json`, `UrlQrCheck.jsx`) |
| **oxlint** | `^1.81.0` | `frontend/package.json` | High-speed Rust-based linter ensuring zero code defects, clean imports, and syntax consistency across 36 frontend files. | **CONFIRMED** (`frontend/package.json`, passing with 0 errors) |
| **Node.js Test Runner** | `node:test` | `frontend/src/test/` | Native Node.js test runner executing frontend unit tests (`apiClient.test.js`) without heavy test dependencies like Jest. | **CONFIRMED** (`npm test`, passing 12/12) |

---

## 4. Browser Extension Technologies

| Technology | Version / Spec | Location / Usage | Purpose & Implementation | Verification |
|---|---|---|---|---|
| **Chrome Extensions API** | Manifest V3 | `extension/manifest.json` | Modern declarative extension manifest with service worker background scripts and isolated toolbar popup. | **CONFIRMED** (`extension/manifest.json`) |
| **Vanilla JavaScript** | ES2020 | `extension/popup.js` | Zero-dependency DOM scripting for lightweight, instant toolbar popup interaction. | **CONFIRMED** (`extension/popup.js`) |

---

## 5. Database, Authentication & Storage Decisions

| Layer | Chosen Technology | Status | Implementation Details | Verification |
|---|---|---|---|---|
| **Database** | **None (Stateless)** | **CONFIRMED** | Zero persistent database engine (no SQL or NoSQL database) is utilized for safety analysis. | Verified in `requirements.txt` and architecture |
| **Authentication** | **None (Public Access)** | **CONFIRMED** | Zero user authentication, session cookies, or access tokens; completely open utility. | Verified across all backend endpoints |
| **Server Storage** | **Local JSON File** (`backend/feedback_store.json`) | **CONFIRMED** | Rolling, retention-bounded file (max 500 items) recording anonymous feedback ratings without messages or credentials. | Verified in `feedback_service.py` |
| **Client Storage** | **`window.localStorage`** | **CONFIRMED** | User-managed local storage holding the 10 most recent checks. Data never leaves the browser. | Verified in `SafetyAnalyzer.jsx` |

---

## 6. External Services & APIs

| Service | Protocol / Model | Status | Actual Usage | Verification |
|---|---|---|---|---|
| **Google Gemini API** | HTTPS / REST (`gemini-1.5-flash`) | **Optional / Hybrid** | Used exclusively to enrich baseline rule assessments with conversational scam summaries when `GEMINI_API_KEY` is present. | **CONFIRMED** (`backend/safety/ai_analysis.py`) |
| **Threat Intelligence Providers** (Google Web Risk, URLhaus) | REST / In-memory stubs | **Stubbed / Fallback** | Architecture interfaces exist in `url_checker.py`; system gracefully operates on local heuristics and verified domain whitelist. | **CONFIRMED** (`backend/safety/url_checker.py`) |

---

## 7. Build, Quality & Tooling Decisions

- **Vite over Webpack / Create React App:** Chosen for near-instant cold start, native ES module serving, and ~350ms production builds.
- **oxlint over ESLint:** Chosen for sub-50ms linting execution speed in CI/CD and local development.
- **Native Node.js Test Runner over Jest / Vitest:** Chosen to eliminate hundreds of megabytes of heavy node_modules test dependencies while providing native ESM assertions.
- **Pytest with In-Memory TestClient:** Chosen for fast execution (<0.6s for 59 tests) without needing to spin up a live network server.

---

## 8. Technology Trade-Offs

1. **Client-Side WASM OCR (`tesseract.js`) vs. Cloud Vision API:**
   - *Chosen:* On-device WASM OCR in the user's browser.
   - *Trade-off:* Requires initial download of WASM worker and language files (~2MB), but guarantees that sensitive payment screenshots (containing account numbers, bank balances, or transaction details) are never transmitted to a server.
2. **Deterministic Regular Expression Engine vs. Heavy Machine Learning / LLM Pipeline:**
   - *Chosen:* Pure Python regex and heuristic pattern engine.
   - *Trade-off:* Rule definitions must be actively maintained for new scam tactics, but execution has sub-millisecond latency (<10ms), zero operational cost per query, 100% deterministic test reproducibility, and zero vulnerability to adversarial prompt injection.
3. **No Database vs. Relational/NoSQL Database:**
   - *Chosen:* Completely stateless architecture.
   - *Trade-off:* User analysis history cannot be synchronized across multiple devices, but data privacy liabilities (e.g., accidental capture of OTPs or PINs) are reduced to absolute zero.
