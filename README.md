# Digital Payment Safety Assistant (V1)

[![Python](https://img.shields.io/badge/Python-3.14%2B-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-1.0.0-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF.svg)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-Apache%202.0-lightgrey.svg)](LICENSE)

A responsive, privacy-conscious digital-payment safety assistant designed to help people with limited payment knowledge recognize potentially fraudulent situations, pause before taking risky actions, and learn safe verification habits.

---

## 1. Project Overview

Digital-payment scams often succeed because users do not understand how digital payments work, do not recognize social-engineering manipulation, or act quickly under pressure.

This project implements a **rule-based safety engine** and a **responsive web interface** to:
1. Allow users to describe a suspicious situation or answer guided questions.
2. Identify warning indicators (impersonation, urgency, threats, advance fees, sensitive credential requests).
3. Assign a transparent risk level (**LOW**, **MEDIUM**, **HIGH**).
4. Explain *why* the situation is suspicious in plain, non-technical language.
5. Provide actionable, safe next steps.
6. Teach the core digital-payment safety concept involved (e.g., *"UPI PIN is only for sending money, never for receiving"*).

---

## 2. Core Principles & Privacy by Design

- **Prevention Over Education Alone:** Helps users pause before making irreversible payments or sharing credentials.
- **Explain, Don't Just Warn:** Avoids generic *"SCAM DETECTED"* banners; breaks down specific reasons and guidance.
- **Privacy by Design:** **Never** requests, accepts, or stores OTPs, UPI PINs, CVVs, card numbers, passwords, or banking logins.
- **Human Decision Remains With User:** Uses transparent, probabilistic guidance (*"Potential payment scam"*) rather than false claims of absolute certainty.
- **No External AI Black Box Required for V1:** Powered by a deterministic, transparent rule engine that is predictable, testable, and viva-ready.

---

## 3. Technology Stack

- **Backend:** Python + FastAPI + Pydantic
- **Safety Engine:** Deterministic rule-based pattern matching (regex, indicator scoring, context mapping)
- **Frontend:** React 19 + Vite + Lucide Icons + Responsive CSS
- **Testing:** Pytest + FastAPI TestClient (HTTPX)
- **Platforms:** Desktop & Mobile browsers (Chrome, Edge, Safari, Firefox)

---

## 4. Project Structure

```text
Digital Payment Security Assitant/
├── backend/
│   ├── safety/
│   │   ├── __init__.py
│   │   ├── detector.py          # Keyword, regex & indicator pattern matching
│   │   ├── risk.py              # Deterministic risk scoring (0-100) & risk levels
│   │   ├── recommendations.py   # Plain-language reasons, actions & awareness concepts
│   │   └── engine.py            # Safety Engine coordinator (Text & Guided modes)
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── safety.py            # Pydantic request & response schemas
│   ├── tests/
│   │   └── test_safety_engine.py# Pytest test suite (Scams, Legitimate cases, Validation)
│   ├── main.py                  # FastAPI REST API & CORS setup
│   └── requirements.txt         # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx       # App bar & Privacy by Design notice
│   │   │   ├── TextCheck.jsx    # Text safety check form & 1-click test scenarios
│   │   │   ├── GuidedCheck.jsx  # "I'm Not Sure" 5-step guided questionnaire
│   │   │   └── ResultDisplay.jsx# Risk meter, explanations, checklist & helpline
│   │   ├── App.jsx              # Main tab coordinator & API integration
│   │   ├── index.css            # Responsive, touch-friendly styling
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── run_all.bat                  # 1-click Windows launcher for both servers
├── run_backend.bat              # Backend launcher
├── run_frontend.bat             # Frontend launcher
├── .env.example                 # Environment configuration template
└── README.md
```

---

## 5. Quick Start (Windows)

### Prerequisites
- **Python 3.10+** (Tested with Python 3.14)
- **Node.js 18+** & **npm**

### Option A: One-Click Launch (Recommended)
Double-click `run_all.bat` or run:
```cmd
run_all.bat
```
This opens two terminal windows:
- Backend running at `http://127.0.0.1:8000` (API Docs at `http://127.0.0.1:8000/docs`)
- Frontend running at `http://localhost:5173`

---

### Option B: Manual Setup

#### 1. Setup & Start Backend
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Setup & Start Frontend
In a new terminal:
```powershell
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 6. Running Automated Tests

To run the automated test suite covering all scam patterns, legitimate non-scam comparisons, and input validation:

```powershell
backend\.venv\Scripts\pytest backend\tests -v
```

Expected output:
```text
backend/tests/test_safety_engine.py::test_health_check PASSED
backend/tests/test_safety_engine.py::test_demonstration_scenarios_endpoint PASSED
backend/tests/test_safety_engine.py::test_fake_bank_support PASSED
backend/tests/test_safety_engine.py::test_fake_kyc_account_blocking PASSED
backend/tests/test_safety_engine.py::test_fake_refund_overpayment PASSED
backend/tests/test_safety_engine.py::test_prize_lottery_advance_fee PASSED
backend/tests/test_safety_engine.py::test_remote_access_anydesk PASSED
backend/tests/test_safety_engine.py::test_upi_pin_to_receive PASSED
backend/tests/test_safety_engine.py::test_legitimate_tea_stall_payment PASSED
backend/tests/test_safety_engine.py::test_legitimate_bill_payment PASSED
backend/tests/test_safety_engine.py::test_guided_mode_high_risk PASSED
backend/tests/test_safety_engine.py::test_guided_mode_legitimate PASSED
backend/tests/test_safety_engine.py::test_empty_input_validation PASSED

======================== 13 passed in 0.38s ========================
```

---

## 7. Demonstration Scenarios

The web interface includes built-in one-click scenarios representing the PRD V1 evaluation suite:

| Scenario | Input Summary | Expected Risk | Core Detection Reason |
| :--- | :--- | :---: | :--- |
| **Fake Bank Support** | Caller claims SBI account debited; asks for OTP | **HIGH** | Secret credential request (OTP/PIN) |
| **Fake KYC Block Threat** | SMS threatens account blocking today; click APK link | **HIGH** | Fear/threat coercion + suspicious APK |
| **Accidental Refund Trap** | "Sent ₹5000 by mistake, scan QR to refund" | **HIGH** | Refund overpayment manipulation |
| **Lottery Win Advance Fee** | "Won ₹25,000, pay ₹499 fee first to claim" | **HIGH** | Advance fee for reward |
| **Screen Share App** | "Install AnyDesk app to help refund payment" | **HIGH** | Remote access takeover |
| **UPI PIN to Receive** | "Scan QR and enter UPI PIN to receive money" | **HIGH** | QR / Receive PIN deception |
| **Legitimate Tea Stall** | "Paid ₹40 at Sharma Tea Stall via Google Pay" | **LOW** | Normal debit confirmation, no scam triggers |
| **Legitimate Bill Pay** | "Paid electricity bill on official app" | **LOW** | Standard utility bill payment |

---

## 8. Limitations & Scope

- **Advisory Only:** Risk assessments are an assistance tool, not a guarantee.
- **No Direct Bank Integration:** Does not intercept transactions or interface directly with NPCI/banks.
- **Future Scope (V2-V4):** Voice interaction, screenshot/OCR image analysis, browser extension context warnings, and multilingual assistance.
