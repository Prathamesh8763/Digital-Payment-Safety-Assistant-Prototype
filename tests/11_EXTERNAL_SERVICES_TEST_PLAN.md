# External Services Test Plan

**Project:** Digital Payment Safety Assistant (ClearPay)  
**Classification:** External API Integrations, Fallback Protocols, Timeouts, and Provider Simulation  
**Document Status:** Current as of V6.0 Architecture (October 2026)

---

## 1. External Service Inventory

| External Service | Provider | Purpose | Status in Codebase | Network Dependency |
|---|---|---|---|---|
| **Google Gemini API** | Google (`generativelanguage.googleapis.com`) | Optional AI-assisted plain-language explanation of scam tactics | Implemented in `backend/safety/ai_analysis.py` | Optional (only if `GEMINI_API_KEY` is present) |
| **Google Web Risk / Safe Browsing** | Google Cloud | Live malicious URL domain reputation checking | Architected interface in `backend/safety/url_checker.py` | **Unconfigured / Stubbed** (Graceful fallback) |
| **URLhaus Threat Feed** | abuse.ch | Live zero-day phishing / malware URL feed | Architected interface in `backend/safety/url_checker.py` | **Unconfigured / Stubbed** (Graceful fallback) |

---

## 2. Google Gemini API Integration Test Specifications

### 2.1 Invocation Protocol & Payload
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}`
- **Method:** `POST` via `httpx.AsyncClient` with `timeout=4.0` seconds.
- **Payload Structure:**
  ```json
  {
    "contents": [{"parts": [{"text": "<strict prompt with baseline findings>"}]}],
    "generationConfig": {
      "temperature": 0.2,
      "responseMimeType": "application/json"
    }
  }
  ```
- **Expected Response Format:** JSON containing exactly `{"contextual_summary": "..."}`.

### 2.2 Test Scenarios & Invariant Assertions

| Test Case | Condition | Expected Behavior | Invariant |
|---|---|---|---|
| **Missing API Key** | `GEMINI_API_KEY` is unset or empty | `enhance_assessment()` immediately returns baseline | **Zero Delay:** No HTTP request is initiated. `ai_enhanced=False`. |
| **Successful AI Call** | Mock returns 200 with valid `contextual_summary` | Populates `ai_analysis_summary` and sets `ai_enhanced=True`, `confidence_rating="Hybrid"` | **Non-Overriding:** Baseline `risk_level` and `indicators` remain 100% untouched. |
| **API Timeout (>4.0s)** | Mock simulates slow network or hanging socket | `httpx.TimeoutException` caught; returns baseline | **Resilience:** Request completes within 4.1s; user is never blocked. |
| **API HTTP Error (500/503/429)** | Mock returns non-200 status code | Logs warning; silently returns baseline | **Zero Crash:** Application logs warning without leaking message body. |
| **Malformed JSON Response** | Mock returns non-JSON or missing `contextual_summary` | Catches JSON decode error; returns baseline | **Schema Safety:** Response strictly validates against Pydantic model. |

---

## 3. External Threat Feed Simulation Test Specifications

### 3.1 Unconfigured Baseline Test (Current Production State)
- **Condition:** No external reputation API keys are configured.
- **Expected Behavior:**
  - `URLChecker.analyze_url()` executes local heuristics (official whitelist, TLD rules, homographs).
  - Populates `checks_unavailable: ["external_reputation_provider_not_configured"]`.
  - Does NOT attempt outbound network connections.
  - Returns appropriate risk (`no_known_threat_found`, `unverified`, or `flagged`).

### 3.2 Provider Simulator Integration (`provider_simulator`)
- `URLChecker.__init__(provider_simulator=...)` supports a test double simulating external feed responses.
- **Test Scenarios:**
  - Simulator returns `threat_found=True` for a whitelisted domain (e.g. compromised subdomain) $\rightarrow$ `status="flagged"`, `risk_level="HIGH"`.
  - Simulator times out $\rightarrow$ `status="unverified"`, `checks_unavailable` records provider timeout.
  - Simulator reports unknown $\rightarrow$ Enforces false-pass elimination (`status="unverified"`).
