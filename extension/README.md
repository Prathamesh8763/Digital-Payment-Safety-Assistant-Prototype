# Digital Payment Safety Assistant — Chrome Browser Extension (Manifest V3)

This extension allows users to safely check suspicious text or links directly from their browser without opening unsafe destinations.

---

## 1. How to Load in Chrome or Edge

1. Open your browser and navigate to `chrome://extensions/` (or `edge://extensions/`).
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click the **Load unpacked** button.
4. Select the `extension` folder located inside this project directory (`d:\Digital Payment Security Assitant\extension`).
5. Pin the **Digital Payment Safety Assistant** to your browser toolbar.

---

## 2. Features

- **Message Safety Check:** Paste any suspicious SMS, email, or chat message to see risk level, warning signs, and safe next actions.
- **Grab Selected Text:** Highlight text on any page and click *"Grab Selected Text"* to import it instantly into the assistant.
- **Link & URL Inspector:** Inspect links without opening them. Detects phishing typosquatting (e.g. `sbi-kyc.top`), raw IP hosts, and suspicious TLDs.
- **Context Menu:** Right-click any highlighted text on a webpage and select *"Check Safety with Payment Assistant"*.

---

## 3. Privacy & Security Rules (Manifest V3 Compliance)

1. **No Payment-Page Scraping:** The extension strictly forbids content capture on active banking and payment gateway portals (`billdesk`, `razorpay`, `payu`, `netbanking`, `sbi.co.in`, `hdfcbank.com`).
2. **Minimal Permissions:** Only uses `activeTab`, `storage`, and `contextMenus`. No broad host permissions (`<all_urls>` is NOT requested).
3. **No Automatic Navigation:** Links and QR codes are analyzed statically without navigating or executing remote code.
4. **Zero Credential Collection:** Does not collect or transmit passwords, PINs, OTPs, or financial secrets.
