# Digital Payment Safety Assistant (V2)

[![Python](https://img.shields.io/badge/Python-3.14%2B-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-2.0.0-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF.svg)](https://vitejs.dev)
[![Extension](https://img.shields.io/badge/Manifest-V3-success.svg)](extension/manifest.json)
[![Evaluation](https://img.shields.io/badge/Benchmark_Accuracy-100%25-brightgreen.svg)](backend/tests/evaluate_model.py)

A responsive, multi-modal, privacy-conscious digital-payment safety assistant designed to help people recognize fraudulent situations, inspect suspicious links and QR codes, pause before taking risky financial actions, and learn safe verification habits.

---

## 1. V2 New Features & Capabilities

- **Multi-Modal Input Modes:**
  - **Text Safety Check:** Type or paste any suspicious SMS, WhatsApp message, or phone call summary.
  - **Voice Input (Speech-to-Text):** Dictate messages using native browser speech recognition. Transcript is reviewed and editable before submission.
  - **Screenshot & Image OCR:** Upload a screenshot; text is extracted **on-device** using `tesseract.js` in your browser. Raw images are never sent to external servers.
  - **Link & URL Inspector:** Inspect web links safely without visiting them. Detects phishing typosquatting (e.g., `sbi-kyc-verify.top`), raw IP hosts, and suspicious TLDs.
  - **QR Code Inspector:** Upload a QR code image to decode on-device with `jsqr`. Safely analyzes UPI payment intents (`upi://pay?...`) and links without initiating payments or opening browser tabs.
  - **Guided "I'm Not Sure" Wizard:** 5-step guided questionnaire for users who cannot explain what happened.
  - **Local-First History & Saved Reports:** Past assessments are saved only to `localStorage` on your device. Users can review, delete, clear, or export reports without exposing credentials.
- **AI-Assisted Explanation Enhancement (FR-03):**
  - Supplements the deterministic rule engine with optional Google Gemini natural-language contextual analysis.
  - Strict fallback to deterministic rules if offline or if no API key is configured.
- **Browser Extension (FR-08):**
  - Chrome/Edge Manifest V3 extension with minimal permissions (`activeTab`, `storage`, `contextMenus`).
  - Allows quick checking and right-click context menu analysis.
  - **Security policy:** Strictly excluded from running on active banking and payment gateway portals (`billdesk`, `razorpay`, `payu`, `netbanking`, `onlinesbi`, etc.).
- **Repeatable Benchmark Evaluation Suite:**
  - Labeled dataset (`backend/tests/evaluation_dataset.json`) with automated precision, recall, and false-positive evaluation.

---

## 2. Core Principles & Privacy by Design

- **Prevention Over Education Alone:** Helps users pause before making irreversible payments or sharing credentials.
- **Explain, Don't Just Warn:** Avoids generic *"SCAM DETECTED"* banners; breaks down specific reasons and guidance.
- **Privacy by Design:** **Never** requests, accepts, or stores OTPs, UPI PINs, CVVs, card numbers, passwords, or banking logins.
- **Human Decision Remains With User:** Uses transparent guidance (*"Potential payment scam"*) rather than false claims of absolute certainty.
- **Deterministic Rule Baseline:** An explainable, testable rule-based engine serves as the reliable core foundation.

---

## 3. Technology Stack

- **Backend:** Python + FastAPI + Pydantic + Uvicorn
- **Safety Engine:** Rule-based detection + URL Inspector + QR Service + Optional AI Enhancement
- **Frontend:** React 19 + Vite + Lucide Icons + Tesseract.js (On-Device OCR) + jsQR (On-Device QR Decoder)
- **Extension:** Chrome Manifest V3 + Service Worker
- **Testing:** Pytest (18 unit tests) + Benchmark Evaluator (`evaluate_model.py`)

---

## 4. Project Structure

```text
Digital Payment Security Assitant/
├── backend/
│   ├── safety/
│   │   ├── detector.py          # Keyword, regex & indicator pattern matching
│   │   ├── risk.py              # Deterministic risk scoring (0-100) & risk levels
│   │   ├── recommendations.py   # Plain-language reasons, actions & awareness concepts
│   │   ├── url_checker.py       # Safe URL parsing & typosquatting detection
│   │   ├── qr_service.py        # Safe UPI intent and QR payload inspection
│   │   ├── ai_analysis.py       # Optional AI enhancement with safe rule fallback
│   │   └── engine.py            # Safety Engine coordinator
│   ├── schemas/
│   │   └── safety.py            # Pydantic request & response schemas
│   ├── tests/
│   │   ├── test_safety_engine.py# Pytest test suite (18 tests covering all flows)
│   │   ├── evaluate_model.py    # Benchmark evaluation script
│   │   └── evaluation_dataset.json # Labeled test dataset
│   ├── main.py                  # FastAPI REST API with CORS
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx       # App bar & Privacy by Design notice
│   │   │   ├── TextCheck.jsx    # Text check form + VoiceInput
│   │   │   ├── VoiceInput.jsx   # Web Speech API speech-to-text
│   │   │   ├── ImageOCRCheck.jsx# On-device screenshot OCR with Tesseract.js
│   │   │   ├── UrlQrCheck.jsx   # Safe Link and QR code inspector (jsQR)
│   │   │   ├── GuidedCheck.jsx  # 5-step guided questionnaire wizard
│   │   │   ├── HistoryDrawer.jsx# Local-first saved reports & deletion
│   │   │   └── ResultDisplay.jsx# Color-coded risk meter & guidance
│   │   ├── App.jsx              # V2 tabs and state manager
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
1. Open Chrome/Edge and go to `chrome://extensions/`.
2. Turn on **Developer mode** (top-right).
3. Click **Load unpacked** and select the `extension` folder.

---

## 6. Running Automated Tests & Benchmark Evaluation

### 1. Pytest Test Suite (18 tests)
```powershell
backend\.venv\Scripts\pytest backend\tests -v
```
All 18 tests covering scam detection, URL phishing, QR code analysis, guided check, and API validation run and pass in ~0.5s.

### 2. Benchmark Quality Evaluation
```powershell
backend\.venv\Scripts\python backend/tests/evaluate_model.py
```
Output:
```text
============================================================
DIGITAL PAYMENT SAFETY ASSISTANT - V2 BENCHMARK EVALUATION
============================================================
Total Test Samples:          15
Accuracy:                    100.0%
Precision:                   100.0%
Recall (Scam Detection):     100.0%
False Positive Rate:         0.0%
False Negative Rate:         0.0%
Legitimate Safe Rate:        100.0%
============================================================
```

---

## 7. Limitations & Scope

- **Advisory Only:** Risk assessments are an assistance mechanism, not an absolute guarantee.
- **No Direct Bank Integration:** Does not intercept transactions or interface with NPCI/banks.
- **Privacy Assurance:** Never asks for or stores UPI PINs, OTPs, or financial secrets.
