# Integration Test Plan

**Project:** Digital Payment Safety Assistant (ClearPay)  
**Classification:** Cross-Module Communication, Service Interoperability, and Gateway Integration  
**Document Status:** Current as of V6.0 Architecture (October 2026)

---

## 1. Integration Scope

Integration testing verifies that independent modules, services, and tier boundaries interact seamlessly without contract mismatches or silent failures.

Key Integration Touchpoints:
1. **Frontend `apiClient.js` ↔ Backend FastAPI Gateway**
2. **`SafetyEngine` ↔ `Detector` ↔ `URLChecker` ↔ `Risk` ↔ `Recommendations`**
3. **`QRService` ↔ `URLChecker` (Payload Forwarding)**
4. **`SafetyEngine` ↔ `AIAnalysisService` (Fallback Integration)**
5. **`SafetyEngine` ↔ `Languages` (Multilingual Serialization)**

---

## 2. Integration Test Scenarios

### 2.1 Frontend Client ↔ Backend Gateway Integration
- **Test:** Verify `apiClient.js` correctly serializes payloads, manages timeouts, and parses JSON responses from live/mocked FastAPI endpoints.
- **Scenarios:**
  - `apiClient.analyzeMessage()` $\rightarrow$ calls `/analyze`, correctly populates `reasons` and `indicators`.
  - `apiClient.analyzeUrl()` $\rightarrow$ calls `/analyze-url`, correctly preserves `status="unverified"` and `risk_level="UNABLE_TO_ASSESS"`.
  - `apiClient.checkQr()` $\rightarrow$ calls `/api/check/qr`, extracts `parsed_details`.
  - Gateway returns HTTP 429 $\rightarrow$ `apiClient` wraps error in `ApiError` with code `RATE_LIMITED`.
  - Gateway returns HTTP 500 $\rightarrow$ `apiClient` wraps error in `ApiError` with code `SERVER_ERROR`.
  - Network disconnect $\rightarrow$ `apiClient` detects offline status and sets code `OFFLINE`.
- **Existing Coverage:** `frontend/src/test/apiClient.test.js` (12 tests passing).

### 2.2 SafetyEngine Pipeline Coordination
- **Test:** Verify `SafetyEngine.analyze_text()` coordinates parsing, scoring, URL extraction, and recommendation generation.
- **Scenarios:**
  - Submit message containing both urgency cues and a malicious link (`"Urgent: verify at http://bank.top/login.apk"`).
  - Verify that:
    - Text heuristics detect `urgency_pressure` and `malicious_link_instruction`.
    - URL extraction extracts `http://bank.top/login.apk`.
    - `URLChecker` evaluates the extracted link as `HIGH` risk with `flagged` status.
    - `url_assessments` contains the child assessment.
    - Composite risk level evaluates to `HIGH`.
- **Existing Coverage:** `backend/tests/test_safety_engine.py` and `test_v6_url_matrix.py:test_url_021`.

### 2.3 QRService ↔ URLChecker Link Routing
- **Test:** Verify that QR payloads containing web URLs are forwarded to the URL safety engine.
- **Scenarios:**
  - Submit QR payload: `https://fake-lottery.xyz/claim`.
  - Verify `QRService` recognizes `payload_type="url"` and calls `URLChecker.analyze_url()`.
  - Assert indicators and suspicious reasons from the URL check are merged into the `QRCheckResponse`.
- **Existing Coverage:** `backend/tests/test_safety_engine.py:test_qr_url_forwarding`.

### 2.4 SafetyEngine ↔ AI Analysis Fallback Integration
- **Test:** Verify that secondary AI reasoning integrates without compromising the deterministic baseline.
- **Scenarios:**
  - When `GEMINI_API_KEY` is not present $\rightarrow$ returns baseline assessment immediately with `ai_enhanced=False` and `confidence_rating="Deterministic Rule Baseline"`.
  - When `GEMINI_API_KEY` is present but mock Gemini call times out (>4.0s) $\rightarrow$ catches `httpx.TimeoutException`, logs warning, and cleanly returns baseline without crashing.
  - When Gemini returns malformed JSON $\rightarrow$ catches `json.JSONDecodeError` and cleanly returns baseline.
- **Existing Coverage:** `backend/tests/test_safety_engine.py:test_ai_fallback_integration`.

### 2.5 SafetyEngine ↔ Multilingual Translation Integration
- **Test:** Verify that localization modifies text representations without corrupting risk scores or indicator identifiers.
- **Scenarios:**
  - Submit text check with `language="hi"` (Hindi) and `language="hinglish"`.
  - Verify `recommended_actions`, `golden_rule`, and `uncertainty_note` are localized.
  - Verify that programmatic `indicator.id`, `risk_level`, and `risk_score` remain standard and unmutated.
- **Existing Coverage:** `backend/tests/test_safety_engine.py:test_localization_hindi`.
