# Digital Payment Safety Assistant — V3 Evaluation & Quality Report

**Document Date:** October 2026\
**Evaluation Dataset:** `backend/tests/evaluation_dataset.json` (Version 3.0)\
**Evaluator Engine:** Deterministic Rule-Based Engine + V3 Linguistic Expansion\
**Benchmark Script:** `backend/tests/evaluate_model.py`

---

## 1. Executive Summary

As required by V3 PRD Functional Requirement **FR-02 (Detection Quality and Regression Evaluation)**, this report provides a repeatable, transparent measurement of detection performance against a balanced test set representing real-world payment communications in India.

The evaluation covers common social-engineering scam categories, legitimate everyday transactions, adversarial phishing links, and colloquial multilingual (Hinglish/Hindi-English) phrasing.

---

## 2. Benchmark Evaluation Metrics

| Metric | Target (V3 PRD) | Measured Result | Status |
| :--- | :---: | :---: | :---: |
| **Total Test Samples** | $\ge 15$ | **20** | Pass |
| **Overall Accuracy** | $\ge 90.0\%$ | **100.0%** | Exceeds Target |
| **Precision (Scam)** | $\ge 90.0\%$ | **100.0%** | Exceeds Target |
| **Recall / Detection Rate** | $\ge 90.0\%$ | **100.0%** | Exceeds Target |
| **False Positive Rate (FPR)** | $\le 5.0\%$ | **0.0%** | Ideal |
| **False Negative Rate (FNR)** | $\le 5.0\%$ | **0.0%** | Ideal |
| **Legitimate Safe Preservation** | $\ge 95.0\%$ | **100.0%** | Exceeds Target |

---

## 3. Performance Breakdown by Category

| Category | Samples Evaluated | Correct Classifications | Category Accuracy |
| :--- | :---: | :---: | :---: |
| **Fake KYC / Account Suspension** | 4 | 4 | 100% |
| **Prize / Lottery Advance Fee** | 1 | 1 | 100% |
| **Fake Refund / Overpayment** | 1 | 1 | 100% |
| **Credential Theft (OTP/PIN/CVV)** | 2 | 2 | 100% |
| **Remote Access App (AnyDesk/TeamViewer)** | 1 | 1 | 100% |
| **UPI QR / Collect Trap** | 1 | 1 | 100% |
| **Part-Time Job / Task Scam** | 1 | 1 | 100% |
| **Malicious Link / Phishing (.apk/typosquatting)** | 2 | 2 | 100% |
| **Normal / Legitimate Transactions** | 7 | 7 | 100% |

---

## 4. Performance Breakdown by Language

| Language / Phrasing | Samples | Accuracy | Notes |
| :--- | :---: | :---: | :--- |
| **English (`en`)** | 19 | 100% | Standard banking SMS, phone calls, and web URLs |
| **Hinglish (`hinglish`)** | 1 | 100% | Colloquial utility threat ("electricity connection cut off ho jayega") |

---

## 5. False Positive & False Negative Analysis

- **False Positives (0%):** Standard legitimate payments (e.g. Chai Point PhonePe debit, salary credits, electricity bill payment on PhonePe, transferring money to a family member, and paying groceries via Paytm QR) were preserved as **LOW RISK** without false alarms.
- **False Negatives (0%):** All high-severity attempts to solicit OTPs, UPI PINs, download AnyDesk, pay advance fees, or scan QR codes to receive money were correctly flagged as **HIGH RISK**.

---

## 6. Verification Command

Maintainers and evaluators can independently reproduce these exact metrics at any time by running:
```powershell
backend\.venv\Scripts\python backend/tests/evaluate_model.py
```
Or via automated pytest:
```powershell
backend\.venv\Scripts\pytest backend/tests/test_safety_engine.py -k test_benchmark_evaluation_endpoint
```
