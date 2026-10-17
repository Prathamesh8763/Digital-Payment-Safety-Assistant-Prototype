# Data Schema

**Document Status:** Current as of V6.0 Release (October 2026)  
**Project:** Digital Payment Safety Assistant (ClearPay)  
**Classification:** Verified Data Architecture, Schemas, Entities, and Storage Invariants

---

## 1. Overview

The Digital Payment Safety Assistant (ClearPay) uses a **privacy-first, local-first, and strictly stateless data architecture**. 

Unlike conventional web applications that persist user communications, identities, and scan histories in a centralized database (such as PostgreSQL or MongoDB), ClearPay's primary analysis pipeline is **ephemeral**. User-submitted payment messages, phone call transcripts, payment links, and QR codes are processed strictly in-memory by the FastAPI safety engine and immediately discarded after returning the safety assessment.

Persistence in this project is intentionally minimized and segmented into two bounded tiers:
1. **Client-Side Device Storage (`window.localStorage`):** Stores user-managed analysis history and saved reports directly within the user's browser sandbox (capped at 30 records). This data never leaves the user's client device.
2. **Server-Side Anonymous Feedback Store (`backend/feedback_store.json`):** A retention-bounded, local JSON file (capped at 500 records) storing only anonymized user ratings (`helpful`, `unclear`, `appears_incorrect`) and random reference tokens (`reference_id`). Raw message text, sender details, phone numbers, OTPs, and credentials are intentionally excluded.

---

## 2. Data Storage Technology

| Storage Layer | Technology | Storage Medium | Verified Location | Persistence Lifecycle | Purpose |
|---|---|---|---|---|---|
| **Primary Analysis Engine** | In-Memory Python Runtime | RAM | `backend/safety/` | Ephemeral (duration of HTTP request) | Regex pattern matching, URL heuristics, risk calculation, and response generation. |
| **Server Feedback Store** | JSON Flat File | Local Disk (SSD/HDD) | `backend/feedback_store.json` | Persistent with FIFO retention ceiling (max 500 records) | Stores user ratings and error categories to improve detection accuracy without storing PII. |
| **Model Evaluation Dataset** | Static JSON Asset | Local Disk | `backend/tests/evaluation_dataset.json` | Static version-controlled dataset (20 labeled samples) | Ground-truth benchmark dataset for automated regression testing and accuracy evaluation. |
| **Client Analysis History** | Web Storage API (`localStorage`) | Browser Isolated Sandbox | Key: `payment_safety_assistant_history_v2` | Persistent on device until cleared (max 30 items) | Enables users to review their recent checks, export JSON reports, or delete records. |
| **Client Session State** | React In-Memory State | Browser Memory | React Component Tree (`useState`) | Session-only (resets on tab reload) | UI form state, active tab, language selection, OCR progress, and active analysis results. |
| **Server Persistence (RDBMS/NoSQL)** | **None** | N/A | N/A | **Zero Persistence** | Explicitly avoided to guarantee absolute privacy and zero credential leakage. |

---

## 3. Entities / Models

### 3.1 FeedbackRecord (Server Persistent Entity)

**Purpose:**  
Stores user feedback, correction reports, and satisfaction ratings regarding safety assessments. Strictly prohibits storage of raw message text, phone numbers, or payment credentials.

**Storage Location:** `backend/feedback_store.json` via `FeedbackService` (`backend/safety/feedback_service.py`).

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `feedback_id` | String | Yes | `fb_<10_hex_chars>` | Unique identifier for the feedback entry (e.g. `fb_8a17e27551`). |
| `timestamp` | String (ISO 8601) | Yes | Current UTC timestamp | Timestamp when feedback was submitted (e.g. `2026-10-17T15:02:55Z`). |
| `reference_id` | String | Yes | `"anonymous"` | Assessment reference identifier linking to an ephemeral session (e.g. `REF-TXT-TEST1234`). |
| `assessment_type` | String (Enum) | Yes | None | Category of assessment: `"text"`, `"guided"`, `"url"`, or `"qr"`. |
| `rating` | String (Enum) | Yes | None | User rating: `"helpful"`, `"unclear"`, or `"appears_incorrect"`. |
| `category` | String (Enum) | No | None | Feedback subcategory: `"false_alarm"`, `"missed_scam"`, `"unclear_explanation"`, or `"general"`. |
| `comments` | String | No | `None` | User comments truncated to maximum 300 characters. Sensitive credentials prohibited. |

**Primary Key:** `feedback_id` (Unique hex string)  
**Foreign Keys:** None (Loose correlation via `reference_id` token)  
**Retention Policy:** FIFO bounded array; when record count exceeds `500`, older records are truncated (`records = records[-500:]`).

---

### 3.2 LocalHistoryItem (Client Persistent Entity)

**Purpose:**  
Stores recent analysis results on the user's local machine, allowing offline review, report export, and manual record deletion.

**Storage Location:** Browser `window.localStorage` under key `payment_safety_assistant_history_v2`.

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | String | Yes | `'hist_' + Date.now()` | Unique client-generated record identifier. |
| `timestamp` | String (ISO 8601) | Yes | `new Date().toISOString()` | Client timestamp of assessment completion. |
| `type` | String (Enum) | Yes | None | Assessment mode: `'message'`, `'link'`, `'guided'`, or `'qr'`. |
| `risk_level` | String (Enum) | Yes | None | Risk severity rating: `'LOW'`, `'MEDIUM'`, `'HIGH'`, or `'UNABLE_TO_ASSESS'`. |
| `risk_score` | Integer | Yes | None | Calculated risk score (0 to 100). |
| `summary` | String | Yes | None | One-sentence plain-language safety conclusion. |
| `sample_snippet` | String | No | `undefined` | Snippet of user input truncated to 120 characters with ellipsis. |
| `assessment` | Object | Yes | None | Full serialized assessment response (`SafetyAssessmentResponse` or `URLCheckResponse`). |

**Primary Key:** `id`  
**Foreign Keys:** None  
**Retention Policy:** Client-side sliding window; capped at the 30 most recent records. Users can delete individual items or execute a full clear.

---

### 3.3 SafetyAssessmentResponse (In-Memory Core Data Model)

**Purpose:**  
The definitive output model of the safety engine, returned across `/analyze`, `/api/analyze`, `/api/check/text`, and `/api/check/guided`.

**Implementation:** Pydantic Model (`backend/schemas/safety.py`).

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `risk_level` | `RiskLevel` (Enum) | Yes | None | Overall risk: `"LOW"`, `"MEDIUM"`, `"HIGH"`, or `"UNABLE_TO_ASSESS"`. |
| `risk_score` | Integer (0-100) | Yes | None | Calibrated numerical risk score where 0 = very safe and 100 = critical threat. |
| `summary` | String | Yes | None | High-level non-technical summary of findings. |
| `status` | String | No | `"analyzed"` | Processing status code. |
| `input_type` | String | Yes | `"message"` | Type of input processed (`"message"` or `"guided"`). |
| `detected_categories` | List[String] | Yes | `[]` | Matched scam taxonomy tags (e.g. `["Credential Theft", "Urgency Manipulation"]`). |
| `indicators` | List[`DetectedIndicator`] | Yes | `[]` | Structured list of granular red flags detected in the message. |
| `why_suspicious` | List[String] | Yes | `[]` | Plain-language bulleted explanations of why specific elements pose risks. |
| `reasons` | List[String] | No | Copies `why_suspicious` | Alias for V6 PRD contract compatibility. |
| `recommended_actions` | List[String] | Yes | `[]` | Immediate defensive steps the user should take (e.g. "Do not share OTP"). |
| `recommendation` | String | No | First item of actions | Primary single recommendation alias for V6 contract compatibility. |
| `educational_concept` | `EducationalConcept` | Yes | None | Preventive concept card and golden payment safety rule. |
| `detected_urls` | List[String] | No | `[]` | Extracted HTTP/HTTPS URLs discovered within the plain-text message. |
| `url_assessments` | List[Dict] | No | `[]` | Embedded URL check assessment objects for each detected URL. |
| `checks_performed` | List[String] | Yes | `[]` | Audit list of heuristics executed (e.g. `["text_pattern_matching", "credential_check"]`). |
| `checks_unavailable` | List[String] | Yes | `[]` | Heuristics or external providers that could not be run. |
| `checked_at` | String (ISO 8601) | No | Current timestamp | Timestamp of assessment completion. |
| `is_safe_practice` | Boolean | Yes | `False` | True if the message represents normal, safe banking notifications. |
| `ai_enhanced` | Boolean | Yes | `False` | True if Google Gemini API contributed an explanation summary. |
| `ai_analysis_summary` | String | No | `None` | Contextual narrative generated by Gemini (if configured and successful). |
| `confidence_rating` | String | No | `"Deterministic Rule Baseline"` | Methodology indicator (`"Deterministic Rule Baseline"` or `"Hybrid"`). |
| `reference_id` | String | Yes | `"REF-SAFETY-0000"` | Random privacy-safe audit reference token. |
| `uncertainty_note` | String | Yes | Standard caution | Explicit statement that low-risk is not a guarantee of safety. |
| `language` | String | Yes | `"en"` | Output language code (`"en"`, `"hi"`, or `"hinglish"`). |
| `disclaimer` | String | Yes | Standard disclaimer | Legal and educational safety disclaimer. |

---

### 3.4 DetectedIndicator (Sub-Entity)

**Purpose:**  
Represents a specific, granular red flag or behavioral anomaly identified during text, link, or QR inspection.

**Implementation:** Pydantic Model (`backend/schemas/safety.py`).

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | String | Yes | None | Stable programmatic identifier (e.g. `sensitive_credential_solicitation`). |
| `name` | String | Yes | None | Human-readable title of the warning indicator. |
| `description` | String | Yes | None | Detailed explanation of why this indicator signals a scam. |
| `severity` | String (Enum) | Yes | None | Severity level: `"low"`, `"medium"`, or `"high"`. |
| `matched_clues` | List[String] | No | `[]` | Sanitized clue labels or terms that triggered the rule match. |

---

### 3.5 EducationalConcept (Sub-Entity)

**Purpose:**  
Teaches the user a permanent, transferable rule of digital payment safety to prevent future victimization.

**Implementation:** Pydantic Model (`backend/schemas/safety.py`).

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `title` | String | Yes | None | Title of the concept (e.g. `"The Golden Rule of UPI PIN"`). |
| `concept` | String | Yes | None | Core principle (e.g. `"UPI PIN is ONLY required to SEND money"`). |
| `golden_rule` | String | Yes | None | Actionable rule for life (e.g. `"Never enter your PIN to receive money"`). |

---

### 3.6 URLCheckResponse (In-Memory URL Data Model)

**Purpose:**  
The definitive response model returned across `/analyze-url`, `/api/analyze-url`, and `/api/check/url`. Enforces false-pass elimination rules.

**Implementation:** Pydantic Model (`backend/schemas/safety.py`).

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `risk_level` | `RiskLevel` (Enum) | Yes | None | Calculated risk: `"LOW"`, `"MEDIUM"`, `"HIGH"`, or `"UNABLE_TO_ASSESS"`. |
| `risk_score` | Integer (0-100) | Yes | None | Numerical risk score. |
| `status` | `URLVerificationStatus` | Yes | `"unverified"` | Categorical status (`"flagged"`, `"suspicious"`, `"no_known_threat_found"`, `"unverified"`, `"invalid_input"`, `"provider_unavailable"`). |
| `input_type` | String | Yes | `"url"` | Identifies payload type. |
| `url_submitted` | String | Yes | None | Exact raw URL input received from the user. |
| `normalized_url` | String | Yes | None | Canonicalized URL string after scheme addition and punycode normalization. |
| `domain` | String | Yes | None | Extracted destination hostname/domain. |
| `protocol` | String | Yes | None | Extracted protocol (`"http"`, `"https"`, `"unknown"`). |
| `is_https` | Boolean | Yes | None | True if protocol is HTTPS with SSL/TLS. |
| `is_shortened` | Boolean | Yes | None | True if domain matches URL shortener services (e.g. `bit.ly`, `tinyurl.com`). |
| `is_ip_address` | Boolean | Yes | None | True if hostname is a raw IPv4 or IPv6 address. |
| `is_suspicious_tld` | Boolean | Yes | None | True if top-level domain belongs to high-abuse registries (e.g. `.top`, `.xyz`, `.apk`). |
| `impersonated_brand` | String | No | `None` | Financial institution or brand targeted by typosquatting/homograph (e.g. `"State Bank of India (SBI)"`). |
| `indicators` | List[`DetectedIndicator`] | Yes | `[]` | Detected URL threat indicators. |
| `why_suspicious` | List[String] | Yes | `[]` | Explanations of why the link is dangerous or unverified. |
| `recommended_actions` | List[String] | Yes | `[]` | Concrete user advice (e.g. "Do not open link", "Inspect domain directly"). |
| `checks_performed` | List[String] | Yes | `[]` | Passive heuristics performed. |
| `checks_unavailable` | List[String] | Yes | `[]` | Providers not configured. |
| `checked_at` | String (ISO 8601) | No | Current timestamp | Timestamp of inspection. |
| `educational_concept` | `EducationalConcept` | Yes | None | URL safety concept card. |
| `reference_id` | String | Yes | `"REF-URL-0000"` | Audit token. |
| `uncertainty_note` | String | Yes | Standard warning | Notes link was inspected passively without fetching destination. |
| `language` | String | Yes | `"en"` | Language code. |
| `disclaimer` | String | Yes | Standard disclaimer | Educational advisory disclaimer. |

---

### 3.7 QRCheckResponse (In-Memory QR Data Model)

**Purpose:**  
Represents the safety breakdown of decoded QR code strings (e.g. `upi://pay` or embedded URLs).

**Implementation:** Pydantic Model (`backend/schemas/safety.py`).

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `risk_level` | `RiskLevel` (Enum) | Yes | None | Risk rating (`"LOW"`, `"MEDIUM"`, `"HIGH"`, `"UNABLE_TO_ASSESS"`). |
| `risk_score` | Integer (0-100) | Yes | None | Numerical risk score. |
| `payload_type` | String (Enum) | Yes | None | Payload category: `"upi_intent"`, `"url"`, `"text"`, or `"unknown"`. |
| `raw_payload_preview` | String | Yes | None | Truncated preview of raw QR payload string. |
| `parsed_details` | Dict[String, Any] | Yes | `{}` | Extracted parameters (`payee_vpa`, `payee_name`, `amount`, `transaction_note`, `merchant_code`). |
| `indicators` | List[`DetectedIndicator`] | Yes | `[]` | Detected QR warning signs (e.g. "Scan QR to Receive Money Trap"). |
| `why_suspicious` | List[String] | Yes | `[]` | Why this QR request poses a risk. |
| `recommended_actions` | List[String] | Yes | `[]` | Prescribed actions. |
| `educational_concept` | `EducationalConcept` | Yes | None | Educational lesson on QR payments. |
| `reference_id` | String | Yes | `"REF-QR-0000"` | Audit token. |
| `uncertainty_note` | String | Yes | Standard warning | Notes scanning can only deduct money. |

---

### 3.8 Request Models (API Input Contracts)

| Model Name | Endpoint | Fields | Constraints |
|---|---|---|---|
| `TextCheckRequest` | `/api/check/text`, `/analyze`, `/api/analyze` | `text` (str), `use_ai` (bool=False), `language` (str="en") | `text`: min 3, max 2500 chars |
| `GuidedCheckRequest` | `/api/check/guided` | `contact_source` (str), `sender_claim` (str), `requested_action` (str), `has_urgency_pressure` (bool), `demands_money` (bool), `asks_sensitive_data` (bool), `additional_notes` (str?), `use_ai` (bool), `language` (str) | `additional_notes`: max 1000 chars |
| `URLCheckRequest` | `/api/check/url`, `/analyze-url`, `/api/analyze-url` | `url` (str), `context` (str?), `language` (str="en") | `url`: min 1, max 5000 chars; `context`: max 500 chars |
| `QRCheckRequest` | `/api/check/qr` | `payload` (str), `context` (str?), `language` (str="en") | `payload`: min 1, max 4000 chars; `context`: max 500 chars |
| `FeedbackRequest` | `/api/feedback` | `reference_id` (str?), `assessment_type` (str enum), `feedback_rating` (str enum), `feedback_category` (str enum?), `comments` (str?) | `comments`: max 500 chars; `reference_id`: max 64 chars |

---

### 3.9 EvaluationSample (Static Benchmark Model)

**Purpose:**  
Represents labeled ground-truth samples for regression testing and quality gate evaluations.

**Storage Location:** `backend/tests/evaluation_dataset.json`.

**Fields:**
- `id` (String): Unique test ID (e.g. `eval_01`).
- `text` (String): Representative scam or legitimate message.
- `expected_risk` (String): Expected risk level (`HIGH` or `LOW`).
- `category` (String): Ground truth taxonomy category.
- `language` (String): Language code (`en`, `hi`, `hinglish`).

---

## 4. Authentication Data

- **Verified Status:** **Zero Authentication Data.**
- There are no user tables, profiles, password hashes, salt keys, session tokens, JWTs, OAuth tokens, or authorization scopes anywhere in the codebase.
- ClearPay operates as a completely anonymous, friction-free utility.
- Requests are decoupled from user identities; IP addresses are read in-memory solely for ephemeral rate limiting (120 req/min) and are discarded without persistent storage.

---

## 5. Security & Data Integrity

1. **Anti-Leakage Logging (FR-07/FR-10):**
   - The FastAPI backend logger (`logging.getLogger("safety.api")`) logs HTTP paths, status codes, and execution timings (`main.py` lines 76-79), but strictly prohibits logging request bodies, message texts, or credentials.
2. **In-Memory Rate Limiting:**
   - Token bucket rate limiter (`RateLimitingMiddleware`) tracks request timestamps in a Python dictionary (`client_request_history`) per IP, pruning timestamps older than 60 seconds. No external Redis or database cache is used.
3. **HTTP Security Headers:**
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `X-XSS-Protection: 1; mode=block`
4. **Input Boundary Enforcement:**
   - Pydantic models strictly enforce string bounds (e.g. max 2,500 characters for message text, max 5,000 for URLs) to prevent Denial-of-Service and memory exhaustion attacks.
5. **False-Pass Elimination Invariant:**
   - In `backend/safety/url_checker.py`, URLs that do not match an official domain whitelist or confirmed malicious rules cannot receive `LOW` risk; they are marked `unverified` with `risk_level="UNABLE_TO_ASSESS"`.

---

## 6. Storage & File Structure

The project maintains zero cloud object storage buckets (no AWS S3, Google Cloud Storage, or Supabase Storage). Local file persistence is restricted to:
- `backend/feedback_store.json`: Local flat JSON array storing rolling feedback entries.
- `backend/tests/evaluation_dataset.json`: Static reference dataset.
- Browser `localStorage`: Key `payment_safety_assistant_history_v2`.

---

## 7. Database Functions & Triggers

Because ClearPay operates without a SQL or document database, there are **no database-level functions, procedures, or triggers**.

Equivalent business logic triggers are implemented at the application layer:
- `FeedbackService._append_to_store()`: Enforces automatic FIFO truncation when the feedback array exceeds 500 records.
- `SafetyAnalyzer.saveToHistory()`: Enforces client-side sliding window truncation (max 30 items).
- `RateLimitingMiddleware.dispatch()`: Automatically prunes expired client IP timestamps on each incoming request.

---

## 8. Important Constraints & Data Integrity Rules

1. **No Sensitive Credential Storage:** System rules strictly prohibit persisting OTPs, PINs, bank accounts, or passwords.
2. **Passive URL Parsing:** Target URLs submitted for inspection are never pinged, followed, or resolved over the network.
3. **Deterministic Integrity:** AI output (Gemini) can only supplement educational explanations; it is structurally incapable of downgrading a deterministic `HIGH` risk assessment.

---

## 9. Unknown / Unverified Information

- **External Threat Feeds:** Integration models for Google Web Risk, Safe Browsing, and URLhaus exist as architectural interfaces in `url_checker.py`, but live production database schemas for threat feeds are not configured in this repository.
