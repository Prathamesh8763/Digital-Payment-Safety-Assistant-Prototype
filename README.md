# Digital Payment Safety Assistant (V3)

[![Python](https://img.shields.io/badge/Python-3.14%2B-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-3.0.0-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF.svg)](https://vitejs.dev)
[![Extension](https://img.shields.io/badge/Manifest-V3-success.svg)](extension/manifest.json)
[![Evaluation](https://img.shields.io/badge/Benchmark_Accuracy-100%25-brightgreen.svg)](V3_EVALUATION_REPORT.md)

A privacy-conscious digital-payment safety assistant designed to help people recognize fraud, inspect suspicious links and QR codes, pause before taking risky financial actions, and learn safe verification habits.

---

## 1. V3 New Capabilities & Quality Hardening

- **Multi-Language Support (FR-05):**
  - **English**, **हिंदी (Hindi)**, and **Hinglish** (colloquial Hindi-English mix) support.
  - Indian context translations for risk titles, actionable safety steps, and educational Golden Rules (e.g. *"पिन केवल पैसे भेजने के लिए होता है, पैसे प्राप्त करने के लिए कभी नहीं"*).
- **Explicit Uncertainty & Evidence Bounds (FR-01 / FR-03):**
  - Communicates detectable evidence bounds transparently.
  - Distinguishes *"High risk indicators detected"*, *"Some warning signs found"*, and *"No strong warning signs detected"*.
  - Explicit warning: **A low-risk score is never presented as proof of safety.**
  - Privacy-safe reference ID (`REF-TXT-XXXXXX`) generated for every assessment.
- **Safe User Feedback & Correction Workflow (FR-04):**
  - Feedback endpoint (`POST /api/feedback`) allows rating assessments (Helpful, Unclear, Appears Incorrect).
  - Rate-limited and bounded storage. **Never requires or records original messages or credentials.**
- **Operational Security & Abuse Hardening (FR-09 / FR-11):**
  - Security headers middleware (`nosniff`, `DENY` clickjacking protection, `strict-origin-when-cross-origin`).
  - In-memory rate limiting middleware per client IP (120 req/min).
  - **Privacy-Safe Audit Logging:** Strictly redacts and excludes raw message contents, audio, and credentials from application logs.
- **V3 Benchmark Evaluation Suite (FR-02):**
  - Versioned labeled dataset (`backend/tests/evaluation_dataset.json`) with 20 real-world samples.
  - Automated evaluation script (`backend/tests/evaluate_model.py`) measuring precision, recall, false-positive rate, and breakdown by category and language.

---

## 2. Core Principles & Privacy by Design

- **Prevention Over Education Alone:** Helps users pause before making irreversible payments or sharing credentials.
- **Explain, Don't Just Warn:** Avoids generic *"SCAM DETECTED"* banners; breaks down specific reasons and guidance.
- **Privacy by Design:** **Never** requests, accepts, or stores OTPs, UPI PINs, CVVs, card numbers, passwords, or banking logins.
- **No Payment Page Scraping:** The browser extension strictly excludes active banking portals (`billdesk`, `razorpay`, `payu`, `netbanking`, `sbi.co.in`, etc.).
- **Deterministic Rule Baseline:** An explainable, testable rule-based engine serves as the reliable core foundation.

---

## 3. Technology Stack

- **Backend:** Python + FastAPI + Pydantic + Uvicorn
- **Safety Engine:** Rule-based detection + URL Inspector + QR Service + Language Localizer + Feedback Service
- **Frontend:** React 19 + Vite + Lucide Icons + Tesseract.js (On-Device OCR) + jsQR (On-Device QR Decoder)
- **Extension:** Chrome Manifest V3 + Service Worker
- **Testing:** Pytest (22 unit tests) + Benchmark Evaluator (`evaluate_model.py`)

---

## 4. Project Structure

```text
Digital Payment Security Assitant/
├── backend/
│   ├── safety/
│   │   ├── detector.py          # Keyword, regex & indicator pattern matching
│   │   ├── risk.py              # Risk scoring (0-100) & level calculation
│   │   ├── recommendations.py   # Plain-language reasons & awareness concepts
│   │   ├── url_checker.py       # Safe URL parsing & typosquatting detection
│   │   ├── qr_service.py        # Safe UPI intent and QR payload inspection
│   │   ├── ai_analysis.py       # Optional AI enhancement with rule fallback
│   │   ├── languages.py         # Hindi and Hinglish localizations (FR-05)
│   │   ├── feedback_service.py  # Rate-limited user feedback handler (FR-04)
│   │   └── engine.py            # Safety Engine coordinator
│   ├── schemas/
│   │   └── safety.py            # Pydantic schemas (V3 multi-language & feedback)
│   ├── tests/
│   │   ├── test_safety_engine.py# Pytest test suite (22 unit tests)
│   │   ├── evaluate_model.py    # Benchmark evaluation script
│   │   └── evaluation_dataset.json # Labeled test dataset (20 samples)
│   ├── main.py                  # FastAPI REST API with security headers & rate limiting
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx       # App bar with Language Selector (EN / HI / Hinglish)
│   │   │   ├── TextCheck.jsx    # Text check form + VoiceInput
│   │   │   ├── VoiceInput.jsx   # Web Speech API speech-to-text
│   │   │   ├── ImageOCRCheck.jsx# On-device screenshot OCR with Tesseract.js
│   │   │   ├── UrlQrCheck.jsx   # Safe Link and QR code inspector (jsQR)
│   │   │   ├── GuidedCheck.jsx  # 5-step guided questionnaire wizard
│   │   │   ├── HistoryDrawer.jsx# Local-first saved reports & deletion
│   │   │   ├── FeedbackModal.jsx# User feedback rating and correction form
│   │   │   └── ResultDisplay.jsx# Color-coded risk meter & uncertainty bounds
│   │   ├── App.jsx              # V3 tabs, language state & state manager
│   │   └── index.css            # Responsive styles
│   ├── package.json
│   └── vite.config.js
├── extension/
│   ├── manifest.json            # Chrome Manifest V3 configuration
│   ├── popup.html               # Extension UI popup
│   ├── popup.js                 # Popup controller & API client
│   ├── background.js            # Background service worker (Context Menu)
│   └── README.md                # Extension setup & privacy policy
├── run_all.bat                  # Single-click Windows launcher for both servers
├── run_backend.bat              # Backend launcher
├── run_frontend.bat             # Frontend launcher
├── V3_EVALUATION_REPORT.md      # V3 quality benchmark evaluation report
├── .env.example
└── README.md
```

---

## 5. Quick Start (Windows)

### Option A: One-Click Launch (Recommended)
Double-click `run_all.bat` or run:
```cmd
run_all.bat
```
- Backend runs at: `http://127.0.0.1:8000` (API Docs at `http://127.0.0.1:8000/docs`)
- Frontend runs at: `http://localhost:5173`

---

### Option B: Manual Setup

#### 1. Start Backend
```powershell
cd backend
.\.venv\Scripts\python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Start Frontend
```powershell
cd frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

#### 3. Load Browser Extension
1. Open Chrome or Edge and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked** and select the `extension` folder in this project:
   `d:\Digital Payment Security Assitant\extension`

---

## 6. Running Automated Tests & Benchmark Evaluation

### 1. Pytest Test Suite (22 unit tests)
```powershell
backend\.venv\Scripts\pytest backend\tests -v
```

### 2. Benchmark Quality Evaluation
```powershell
backend\.venv\Scripts\python backend/tests/evaluate_model.py
```
Output:
```text
=================================================================
DIGITAL PAYMENT SAFETY ASSISTANT - V3 BENCHMARK EVALUATION
=================================================================
Total Test Samples:          20
Accuracy:                    100.0%
Precision:                   100.0%
Recall (Scam Detection):     100.0%
False Positive Rate:         0.0%
False Negative Rate:         0.0%
Legitimate Safe Rate:        100.0%

Results by Category:
  • Fake KYC / Account Suspension    4/4 correct
  • Prize / Reward Scam              1/1 correct
  • Fake Refund Scam                 1/1 correct
  • Credential Theft (OTP/PIN/CVV)   2/2 correct
  • Remote Access Takeover           1/1 correct
  • UPI QR / Collect Scam            1/1 correct
  • Normal / Legitimate Transaction  7/7 correct
  • Part-Time Job / Task Scam        1/1 correct
  • Malicious Link / Phishing        2/2 correct

Results by Language:
  • en           19/19 correct
  • hinglish     1/1 correct
=================================================================
```

---

## 7. Limitations & Scope

- **Advisory Only:** Risk assessments are an assistance mechanism, not an absolute guarantee.
- **No Direct Bank Integration:** Does not intercept transactions or interface with NPCI/banks.
- **Privacy Assurance:** Never asks for or stores UPI PINs, OTPs, or financial secrets.
