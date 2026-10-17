# End-to-End (E2E) Test Plan

**Project:** Digital Payment Safety Assistant (ClearPay)  
**Classification:** Critical User Journeys, UI State Transitions, and Browser Workflow Validation  
**Document Status:** Current as of V6.0 Architecture (October 2026)

---

## 1. E2E Testing Objectives

End-to-End testing validates that complete user journeys function across the full application lifecycle: from initial landing page navigation, through interactive form input, API request execution, dynamic result card rendering, local history persistence, and report export.

---

## 2. Critical User Journeys

### Journey 1: Landing Page to Analyzer Workspace Navigation
- **Preconditions:** Browser navigates to root URL (`/`).
- **Steps:**
  1. Verify top announcement banner, ClearPay navigation bar, and Hero headline are visible.
  2. Verify interactive `HeroDemoCard` renders sample scam breakdown correctly.
  3. Click primary CTA button: `"Analyze a message ↗"`.
  4. Verify client-side route changes to `/analyze`.
  5. Verify `SafetyAnalyzer` workspace mounts, showing breadcrumb `"Home / Analyze a message"`, privacy reassurance banner, two-column layout, and "What we look for" card.
- **Assertion:** Page switches instantly without full browser refresh or network 404 errors.

### Journey 2: Example Chip Selection, Analysis & Result Display
- **Preconditions:** User is on `/analyze` in Message mode.
- **Steps:**
  1. Click the `"Account blocked"` example chip.
  2. Verify the textarea is populated with the simulated bank KYC scam message.
  3. Verify character counter updates (e.g. `165 / 2,000`).
  4. Click `"Analyze message →"`.
  5. Verify loading state is displayed briefly.
  6. Verify result card renders with:
     - `HIGH RISK` badge in red.
     - Extracted warning indicators (e.g. `KYC expiry`, `Immediate action demand`).
     - Plain-language explanations ("Why this is suspicious").
     - Immediate defensive actions ("Never share your OTP or UPI PIN").
     - "Better to pause than guess" educational concept card.
- **Assertion:** Result matches V6 design reference layout; no unhandled console errors.

### Journey 3: Link Tab Switching & Passive Inspection
- **Preconditions:** User is on `/analyze`.
- **Steps:**
  1. Click the `"Link / URL"` tab in the mode switcher.
  2. Verify input placeholder changes to `"e.g. https://bank-secure-login.example/verify"`.
  3. Click the `"Official bank link"` example chip (`https://onlinesbi.sbi/portal`).
  4. Click `"Inspect link →"`.
  5. Verify result card renders `LOW RISK` with `No known threat found` badge.
  6. Click the `"Fake bank link"` example chip (`https://fake-bank-verify.example/confirm`).
  7. Click `"Inspect link →"`.
  8. Verify result card renders `UNABLE TO ASSESS` with `Unverified link` badge (false-pass elimination).
- **Assertion:** The target link is rendered as an unclickable plain-text preview; the browser never attempts to navigate to the target address.

### Journey 4: Local History Drawer, Export & Purge
- **Preconditions:** User has completed at least 2 safety checks.
- **Steps:**
  1. Click the `"History"` tab or icon in the analyzer header.
  2. Verify `HistoryDrawer` opens, displaying the 2 completed checks with timestamps, risk badges, and snippets.
  3. Click `"Export JSON"`.
  4. Verify a browser download is triggered with filename matching `safety_analysis_history_<YYYY-MM-DD>.json`.
  5. Delete one individual record; verify the record disappears from the list.
  6. Click `"Clear all"`.
  7. Confirm the action in the `ConfirmDialog` modal.
  8. Verify the list displays `"No saved analyses yet"`.
  9. Reload browser tab and verify `localStorage` remains empty.
- **Assertion:** User has total sovereignty over local history data.

### Journey 5: Guided "I'm Not Sure" Questionnaire
- **Preconditions:** User is on `/analyze`.
- **Steps:**
  1. Click `"I'm Not Sure"` tab.
  2. Step through the 6 guided questions:
     - Select `"Unknown phone call"`.
     - Select `"Claimed account was blocked"`.
     - Select `"Asked me to install AnyDesk or QuickSupport"`.
     - Select `"Yes, felt immediate pressure"`.
     - Select `"No money demanded directly"`.
     - Select `"Yes, asked for sensitive screen access"`.
  3. Click `"Analyze My Situation"`.
  4. Verify result card renders `HIGH RISK` with `Remote Access Takeover` red flag.
- **Assertion:** Form state navigates forward and back; submission yields correct synthesized assessment.
