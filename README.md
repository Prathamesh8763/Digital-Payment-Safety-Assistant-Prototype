# Digital Payment Safety Assistant (ClearPay - V5)

[![Python](https://img.shields.io/badge/Python-3.14%2B-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-3.0.0-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF.svg)](https://vitejs.dev)
[![Design](https://img.shields.io/badge/Design-V5_Landing_Page-0284c7.svg)](docs/design-references/v5-landing-page-reference.png)
[![Accessibility](https://img.shields.io/badge/Accessibility-WCAG_2.2_AA-blueviolet.svg)](frontend/src/styles/tokens.css)
[![Evaluation](https://img.shields.io/badge/Benchmark_Accuracy-100%25-brightgreen.svg)](V3_EVALUATION_REPORT.md)

A calm, privacy-first digital-payment safety assistant designed to help people recognize fraud, inspect suspicious messages and QR codes, pause before taking risky financial actions, and learn safe verification habits.

---

## 1. V5 Public Landing Page & Design Specification

- **Primary Design Reference (`docs/design-references/v5-landing-page-reference.png`):**
  - Fully implements the visual design, typography hierarchy, section sequence, and palette defined in the reference image.
  - Recreated with editable, accessible React components and responsive CSS (not a flattened screenshot).
- **Public Website Information Architecture:**
  - **`/` (Public Landing Page):**
    - **Top Announcement Bar:** Subtle notice with direct navigation to how it works.
    - **Main Navigation Bar:** ClearPay brand mark, navigation links (`How it works`, `Learn`, `Privacy`), and high-contrast `Analyze a message ↗` action CTA.
    - **Hero Section:** Clear headline (`Pause before you pay. Know before you trust.`), `Check a message` CTA, `How it works` anchor, and privacy reassurance.
    - **Interactive Demo Card:** Live preview of suspicious SMS message evaluation with `HIGH RISK` warning signs and actionable safe next steps.
    - **Trust & Confidence Bar:** Process anchors (`01 Understand the warning signs`, `02 Get a clear next step`, `03 Stay in control`).
    - **Feature Overview Section (`#learn`):** Three distinct guidance cards for suspicious messages, urgency pressure, and safer verification steps.
    - **Three Simple Steps Section (`#how-it-works`):** Dark navy contrast section (`01 Share the message`, `02 Review the signals`, `03 Choose a safe next step`).
    - **Privacy Callout Section (`#privacy`):** Visible privacy guarantees confirming zero credential collection and zero transaction execution.
    - **Vibrant Blue CTA Banner:** Final high-visibility call-to-action to check a message.
    - **Footer:** Brand notice, educational disclaimer, and anchor links.
  - **`/analyze` (Safety Analysis Workspace):**
    - The complete multimodal analysis suite: Text Check, Voice Input, Screenshot OCR, Link & QR Inspector, "I'm Not Sure" Guided Wizard, Local History Drawer, and Feedback Workflow.
    - Includes a convenient `← Home` return link in the header.

---

## 2. Core Principles & Privacy by Design

- **Prevention Over Education Alone:** Helps users pause before making irreversible payments or sharing credentials.
- **Explain, Don't Just Warn:** Avoids generic *"SCAM DETECTED"* banners; breaks down specific reasons and guidance.
- **Privacy by Design:** **Never** requests, accepts, or stores OTPs, UPI PINs, CVVs, card numbers, passwords, or banking logins.
- **No Payment Page Scraping:** The browser extension strictly excludes active banking portals (`billdesk`, `razorpay`, `payu`, `netbanking`, `sbi.co.in`, etc.).
- **Deterministic Rule Baseline:** An explainable, testable rule-based engine serves as the reliable core foundation.

---

## 3. Technology Stack

- **Backend:** Python 3.14 + FastAPI + Pydantic + Uvicorn
- **Safety Engine:** Rule-based detection + URL Inspector + QR Service + Language Localizer + Feedback Service
- **Frontend:** React 19 + Vite 8 + Lucide Icons + Tesseract.js (On-Device OCR) + jsQR (On-Device QR Decoder)
- **Design System:** Custom CSS tokens (`tokens.css`) + Landing styles (`landing.css`) + Shared UI atom library (`components/ui/`)
- **Extension:** Chrome Manifest V3 + Service Worker
- **Testing:** Pytest (22 backend unit tests) + Benchmark Evaluator (`evaluate_model.py`) + Frontend Unit Tests (`node --test`)

---

## 4. Project Structure

```text
Digital Payment Security Assitant/
├── docs/
│   └── design-references/
│       └── v5-landing-page-reference.png # Preserved visual design reference
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
│   │   │   ├── landing/         # V5 Landing Page Components
│   │   │   │   ├── TopAnnouncementBar.jsx     # Dark top announcement bar
│   │   │   │   ├── LandingNavbar.jsx          # Header with logo, links, and CTA
│   │   │   │   ├── HeroSection.jsx            # Two-column hero with headline
│   │   │   │   ├── HeroDemoCard.jsx           # Interactive message safety demo card
│   │   │   │   ├── TrustBar.jsx               # 3-step trust & confidence anchors
│   │   │   │   ├── FeatureOverviewSection.jsx # Guidance cards (learn)
│   │   │   │   ├── ThreeStepsSection.jsx      # Dark navy process steps
│   │   │   │   ├── PrivacyCalloutSection.jsx  # Privacy guarantees callout
│   │   │   │   ├── CtaBannerSection.jsx       # Vibrant blue CTA banner
│   │   │   │   ├── LandingFooter.jsx          # Footer with brand & links
│   │   │   │   └── LandingPage.jsx            # Assembled Landing Page view
│   │   │   ├── ui/              # V4/V5 Shared UI Atom System
│   │   │   │   ├── Alert.jsx        # Live-region accessible alert banners
│   │   │   │   ├── Badge.jsx        # Risk badge with non-color status cues
│   │   │   │   ├── Button.jsx       # Button with variants, sizes & touch targets
│   │   │   │   ├── Card.jsx         # Card elevation container
│   │   │   │   ├── ConfirmDialog.jsx# Destructive confirmation modal
│   │   │   │   ├── Input.jsx        # Accessible text input
│   │   │   │   ├── LoadingSpinner.jsx # Accessible animated loading spinner
│   │   │   │   ├── Modal.jsx        # Native HTML <dialog> modal with showModal()
│   │   │   │   └── Textarea.jsx     # Accessible textarea with character count
│   │   │   ├── SafetyAnalyzer.jsx # Full multimodal safety analysis workspace
│   │   │   ├── ErrorBoundary.jsx# Global UI crash recovery screen
│   │   │   ├── Header.jsx       # App bar with Language Selector & Home link
│   │   │   ├── TextCheck.jsx    # Text check form + VoiceInput
│   │   │   ├── VoiceInput.jsx   # Web Speech API speech-to-text
│   │   │   ├── ImageOCRCheck.jsx# On-device screenshot OCR with Tesseract.js
│   │   │   ├── UrlQrCheck.jsx   # Safe Link and QR code inspector (jsQR)
│   │   │   ├── GuidedCheck.jsx  # 5-step guided questionnaire wizard
│   │   │   ├── HistoryDrawer.jsx# Local-first saved reports & deletion
│   │   │   ├── FeedbackModal.jsx# User feedback rating and correction form
│   │   │   └── ResultDisplay.jsx# Color-coded risk meter & honest uncertainty bounds
│   │   ├── services/
│   │   │   └── apiClient.js     # Centralized API client (timeout, offline, error mapping)
│   │   ├── styles/
│   │   │   ├── tokens.css       # Design tokens (colors, spacing, focus rings)
│   │   │   └── landing.css      # V5 landing page responsive styles
│   │   ├── test/
│   │   │   └── apiClient.test.js# Frontend test suite
│   │   ├── App.jsx              # Client router (`/` -> Landing, `/analyze` -> Workspace)
│   │   ├── main.jsx             # React root wrapped in ErrorBoundary
│   │   └── index.css            # Responsive styles importing design tokens
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

## 6. Running Tests & Quality Verification

### 1. Frontend Unit Tests (10 tests)
```powershell
cd frontend
npm test
```

### 2. Frontend Linter (0 warnings, 0 errors)
```powershell
cd frontend
npm run lint
```

### 3. Frontend Production Build
```powershell
cd frontend
npm run build
```

### 4. Backend Pytest Suite (22 unit tests)
```powershell
backend\.venv\Scripts\pytest backend\tests -v
```

### 5. Benchmark Quality Evaluation
```powershell
backend\.venv\Scripts\python backend/tests/evaluate_model.py
```

---

## 7. Limitations & Scope

- **Advisory Only:** Risk assessments are an assistance mechanism, not an absolute guarantee.
- **Honest Uncertainty:** Low risk indicates absence of known scam patterns; vigilance is always required.
- **No Direct Bank Integration:** Does not intercept transactions or interface with NPCI/banks.
- **Privacy Assurance:** Never asks for or stores UPI PINs, OTPs, or financial secrets.
