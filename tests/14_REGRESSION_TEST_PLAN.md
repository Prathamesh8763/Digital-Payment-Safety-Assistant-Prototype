# Regression Test Plan

**Project:** Digital Payment Safety Assistant (ClearPay)  
**Classification:** Automated Regression Suites, Quality Gates, and Benchmark Baselines  
**Document Status:** Current as of V6.0 Architecture (October 2026)

---

## 1. Regression Testing Strategy

Regression testing in ClearPay protects against heuristic degradation, false-pass reintroduction, and legitimate payment misclassification. Every commit and release must satisfy two automated quality gates before deployment:
1. **The 35-Case URL & Message Matrix Suite (`test_v6_url_matrix.py`)**
2. **The 20-Sample Multilingual Labeled Benchmark Suite (`evaluation_dataset.json`)**

---

## 2. Gate 1: URL & Message Regression Matrix (`test_v6_url_matrix.py`)

This suite exercises 25 distinct URL scenarios (`URL-001` through `URL-025`) and 10 end-to-end message scenarios (`MSG-001` through `MSG-010`):

### 2.1 URL Regression Matrix (URL-001 to URL-025)

| Case ID | Scenario / Input | Expected Status | Expected Risk | Invariant Protected |
|---|---|---|---|---|
| **URL-001** | `https://onlinesbi.sbi/portal` | `no_known_threat_found` | `LOW` | Legitimate bank portal preservation |
| **URL-002** | `https://hdfcbank.com/netbanking` | `no_known_threat_found` | `LOW` | Legitimate bank portal preservation |
| **URL-003** | `http://onlinesbi.sbi/login` (HTTP plain) | `suspicious` | `MEDIUM` | Insecure HTTP on banking brand |
| **URL-004** | `http://sbi-kyc-verify.top/login.apk` | `flagged` | `HIGH` | Typosquat + abuse TLD + APK |
| **URL-005** | `https://hdfc-account-unblock.xyz/verify` | `flagged` | `HIGH` | Phishing brand + abuse TLD |
| **URL-006** | `https://bit.ly/bank-urgent-update` | `suspicious` | `MEDIUM` | Obfuscated URL shortener |
| **URL-007** | `https://tinyurl.com/sbi-portal` | `suspicious` | `MEDIUM` | Obfuscated URL shortener |
| **URL-008** | `https://made-up-payment-check.invalid/login` | `unverified` | `UNABLE_TO_ASSESS` | **False-pass elimination on reserved TLD** |
| **URL-009** | `https://secure-bank-login.test/auth` | `unverified` | `UNABLE_TO_ASSESS` | **False-pass elimination on test TLD** |
| **URL-010** | `https://random-unknown-shop-12345.com` | `unverified` | `UNABLE_TO_ASSESS` | **False-pass elimination on unknown domain** |
| **URL-011** | `http://192.168.1.1/router-login` | `unverified` | `UNABLE_TO_ASSESS` | Private IP range protection |
| **URL-012** | `http://127.0.0.1:8000/api` | `unverified` | `UNABLE_TO_ASSESS` | Loopback IP address protection |
| **URL-013** | `http://10.0.0.5/admin` | `unverified` | `UNABLE_TO_ASSESS` | Private Class A IP protection |
| **URL-014** | `https://legitimate.example@evil-attacker.top/login` | `flagged` | `HIGH` | Deceptive userinfo stripping |
| **URL-015** | `https://sbi.co.in@phishing-target.xyz/auth` | `flagged` | `HIGH` | Deceptive userinfo stripping |
| **URL-016** | `https://pay.google.com/about` | `no_known_threat_found` | `LOW` | Official payment app whitelist |
| **URL-017** | `https://phonepe.com/business` | `no_known_threat_found` | `LOW` | Official payment app whitelist |
| **URL-018** | `https://rbi.org.in/scripts/BS_PressReleaseDisplay.aspx` | `no_known_threat_found` | `LOW` | Central bank portal whitelist |
| **URL-019** | `https://npci.org.in/what-we-do/upi/product-overview` | `no_known_threat_found` | `LOW` | NPCI regulatory portal whitelist |
| **URL-020** | `http://download-update-bank.icu/setup.exe` | `flagged` | `HIGH` | Dangerous executable extension |
| **URL-021** | Text with trailing punctuation: `Visit https://onlinesbi.sbi/login.` | `no_known_threat_found` | `LOW` | Trailing punctuation sanitization |
| **URL-022** | Deceptive scheme: `javascript:alert(1)` | `invalid_input` | `UNABLE_TO_ASSESS` | Non-HTTP scheme rejection |
| **URL-023** | IP address: `http://169.254.169.254/latest/meta-data` | `unverified` | `UNABLE_TO_ASSESS` | Cloud metadata IP protection |
| **URL-024** | Punycode IDN homograph: `https://xn--sbi-9ha.com` | `flagged` | `HIGH` | Non-ASCII character detection |
| **URL-025** | Empty string or whitespace | `invalid_input` | `UNABLE_TO_ASSESS` | Empty input validation |

### 2.2 Message Regression Suite (MSG-001 to MSG-010)
- `MSG-001`: Fake Bank KYC Suspension SMS (`HIGH`)
- `MSG-002`: OLX QR Code "Enter PIN to Receive" Scam (`HIGH`)
- `MSG-003`: Electricity Disconnection Bill Threat (`HIGH`)
- `MSG-004`: Remote Access Takeover via AnyDesk / QuickSupport (`HIGH`)
- `MSG-005`: Lottery Win / Advance Fee Registration Scam (`HIGH`)
- `MSG-006`: Overpayment / Accidental Transfer Collect Trap (`HIGH`)
- `MSG-007`: Legitimate Tea Stall Merchant Payment via Google Pay (`LOW`, `is_safe_practice=True`)
- `MSG-008`: Legitimate Electricity Bill Payment via PhonePe (`LOW`, `is_safe_practice=True`)
- `MSG-009`: Hinglish Electricity Disconnection Coercion (`HIGH`)
- `MSG-010`: Courier / Customs Police Threat Intimidation (`HIGH`)

---

## 3. Gate 2: Labeled Benchmark Quality Gate (`evaluate_model.py`)

Executed via `backend/tests/evaluate_model.py` against `backend/tests/evaluation_dataset.json`:

```text
==================================================
ClearPay V3 Model Evaluation Benchmark
==================================================
Total Labeled Samples Evaluated : 20
Accuracy Percentage            : 100.0%
Precision Percentage           : 100.0%
Recall Percentage              : 100.0%
Scam Detection Rate            : 100.0% (16/16 scams caught)
Legitimate Preservation Rate   : 100.0% (4/4 legitimate preserved)
False Positive Rate            : 0.0%
False Negative Rate            : 0.0%
==================================================
```

### Quality Gate Pass Criteria:
1. **Scam Detection Rate:** Must be $\ge 98.0\%$. (Zero tolerance for missing credential theft).
2. **Legitimate Preservation Rate:** Must be $\ge 95.0\%$. (Prevents alert fatigue from false alarms).
3. **Accuracy Percentage:** Must be $\ge 98.0\%$.
4. **Execution Time:** Must complete in $< 1.0$ second.
