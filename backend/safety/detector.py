import re
from typing import List, Tuple, Dict, Any

# Pattern definitions for Rule-Based Detection

SENSITIVE_CREDENTIAL_PATTERNS = [
    (r"\b(otp|one[-\s]?time[-\s]?password)\b", "OTP (One-Time Password)"),
    (r"\b(upi[-\s]?pin|mpin|atm[-\s]?pin|card[-\s]?pin|secret[-\s]?pin)\b", "UPI PIN / MPIN / ATM PIN"),
    (r"\b(cvv|cvc|card[-\s]?verification)\b", "Card CVV/CVC"),
    (r"\b(netbanking\s+password|login\s+password|bank\s+password)\b", "Bank / Netbanking Password"),
    (r"\b(share|tell|send|enter|give|type)\s+(your\s+)?(pin|otp|password|cvv)\b", "Direct credential solicitation"),
    (r"\b(16[-\s]?digit|card\s+number|debit\s+card\s+details|credit\s+card\s+details)\b", "Debit/Credit Card Details")
]

URGENCY_PATTERNS = [
    (r"\b(immediately|right\s+now|urgent|urgently|hurry|asap|without\s+delay)\b", "Immediate action demand"),
    (r"\b(within\s+\d+\s*(hours?|hrs?|mins?|minutes?)|in\s+\d+\s*(hours?|minutes?))\b", "Short time limit"),
    (r"\b(today\s+itself|before\s+(tonight|midnight|evening))\b", "Strict same-day deadline"),
    (r"\b(last\s+chance|final\s+warning|limited\s+time|expires\s+soon)\b", "Artificial urgency / last chance")
]

FEAR_THREAT_PATTERNS = [
    (r"\b(account\s+(will\s+be\s+)?(blocked|frozen|suspended|deactivated|closed|stopped))\b", "Account blocking threat"),
    (r"\b(kyc\s+(suspended|expired|failed|pending|not\s+updated|incomplete))\b", "KYC expiry / suspension claim"),
    (r"\b(electricity\s+(will\s+be\s+)?(disconnected|cut\s+off|cut|stopped))\b", "Utility disconnection threat"),
    (r"\b(sim\s+(card\s+)?(blocked|deactivated|suspended))\b", "SIM card deactivation threat"),
    (r"\b(police\s+complaint|arrest\s+warrant|legal\s+action|court\s+notice|cbi|customs|cyber\s+crime)\b", "Legal / Law enforcement intimidation"),
    (r"\b(penalty|fine|heavy\s+charges)\s+(will\s+be\s+)?(deducted|imposed|charged)\b", "Financial penalty threat")
]

IMPERSONATION_PATTERNS = [
    (r"\b(calling\s+from|calling\s+on\s+behalf\s+of|from\s+your\s+bank|bank\s+manager|bank\s+officer|bank\s+support)\b", "Bank official impersonation"),
    (r"\b(calling\s+from|speaking\s+from|received\s+call\s+from|representative\s+from|executive\s+from)\s+(the\s+)?(sbi|hdfc|icici|axis|punjab\s+national|pnb|canara|bank\s+of\s+baroda|rbi|reserve\s+bank)\b", "Caller claiming to represent financial institution"),
    (r"\b(sbi|hdfc|icici|axis|pnb|canara|rbi)\s+(customer\s+care|support\s+desk|helpdesk|officer|manager|representative|team)\b", "Claiming to be bank customer care"),
    (r"\b(customer\s+care|support\s+executive|helpdesk|telecom\s+department|trai|income\s+tax\s+officer)\b", "Customer care / authority claim"),
    (r"\b(courier\s+delivery|fedex|dhl|india\s+post|parcel\s+stuck)\b", "Courier / customs impersonation")
]

REWARD_PRIZE_PATTERNS = [
    (r"\b(won|winner|selected\s+for|awarded|lucky\s+draw|lottery|jackpot|cash\s+prize)\b", "Prize / Lottery winning claim"),
    (r"\b(pay\s+(₹|rs\.?|inr)?\s*\d+\s*(first|fee|tax|registration|deposit|charges)?\s*to\s*(claim|receive|get|unlock))\b", "Advance fee to receive reward"),
    (r"\b(gift\s+card|free\s+iphone|claim\s+your\s+prize|spin\s+and\s+win)\b", "Unsolicited reward offer"),
    (r"\b(cashback\s+of\s+(₹|rs\.?|inr)?\s*\d+\s*(waiting|approved|credited))\b", "Fake cashback offer")
]

REFUND_OVERPAYMENT_PATTERNS = [
    (r"\b(sent\s+(you\s+)?(money|extra\s+money|excess|extra|by\s+mistake)|wrongly\s+transferred)\b", "Fake wrong transfer / excess payment"),
    (r"\b(refund\s+(is\s+)?(pending|ready|approved)|claim\s+refund|return\s+(the\s+)?money)\b", "Unsolicited refund prompt"),
    (r"\b(sent\s+(₹|rs\.?|inr)?\s*\d+\s*instead\s+of\s+(₹|rs\.?|inr)?\s*\d+)\b", "Overpayment manipulation"),
    (r"\b(accept\s+the\s+request\s+to\s+receive\s+refund)\b", "Collect request refund trap")
]

REMOTE_ACCESS_APP_PATTERNS = [
    (r"\b(anydesk|teamviewer|quicksupport|rustdesk|screen\s+share|remote\s+desktop|zoho\s+assist)\b", "Remote screen sharing application"),
    (r"\b(download|install)\s+(this\s+)?(app|apk|software|file)\s+to\s+(verify|update|unblock)\b", "App download instruction to fix issue")
]

QR_RECEIVE_PATTERNS = [
    (r"\b(scan\s+(this\s+)?qr(\s+code)?\s+to\s+(receive|get|credit|claim))\b", "Scan QR to receive money trick"),
    (r"\b(enter\s+(your\s+)?(upi\s+)?pin\s+to\s+(receive|get|credit))\b", "Enter PIN to receive money trap"),
    (r"\b(collect\s+request|request\s+money\s+from\s+you)\b", "UPI Collect request trap")
]

UNTRUSTED_LINK_PATTERNS = [
    (r"\b(\.apk|install\s+apk|download\s+apk)\b", "Suspicious Android APK file"),
    (r"\b(bit\.ly|tinyurl\.com|is\.gd|cutt\.ly|ngrok|goo\.gl|t\.co)\b", "Shortened / obfuscated link"),
    (r"\b(http://|https://[^\s]*[0-9]{2,}\.[0-9]{2,})\b", "Suspicious IP / numerical URL"),
    (r"\b(click\s+(here|this\s+link|below\s+link)\s+to\s+(unblock|verify|update|claim))\b", "Click link to resolve urgency")
]

LEGITIMATE_TRANSACTION_PATTERNS = [
    (r"\b(debited\s+(by|for|of)?\s*(₹|rs\.?|inr)?\s*\d+|credited\s+(by|for|of)?\s*(₹|rs\.?|inr)?\s*\d+|spent\s*(₹|rs\.?|inr)?\s*\d+)\b", "Standard bank debit/credit alert"),
    (r"\b(available\s+balance|avl\s+bal|a/c\s+no\s+[x*]+\d+)\b", "Standard bank balance notification"),
    (r"\b(paid\s+((₹|rs\.?|inr)?\s*\d+\s+)?(at|to|for|via)\s+[a-zA-Z\s]+(stall|shop|store|restaurant|cafe|mall|mart|market|hotel))\b", "Everyday merchant/store payment"),
    (r"\b(paid\s+((₹|rs\.?|inr)?\s*\d+\s+)?(via|using|on)\s+(google\s+pay|gpay|phonepe|paytm|bhim|cred|upi))\b", "Standard UPI app transaction"),
    (r"\b(paid\s+(electricity|water|wifi|broadband|gas|recharge|mobile)\s+bill)\b", "Standard utility bill payment")
]

def preprocess_text(text: str) -> str:
    """Cleans and normalizes user input text."""
    if not text:
        return ""
    text_clean = text.strip().lower()
    # Replace common symbol variants
    text_clean = text_clean.replace("₹", " ₹ ").replace("rs.", " rs ").replace("inr", " inr ")
    # Replace multiple spaces with a single space
    text_clean = re.sub(r"\s+", " ", text_clean)
    return text_clean

def detect_indicators_in_text(text: str) -> Dict[str, Any]:
    """
    Scans the text for pattern indicators.
    Returns matched indicators, categories, and evidence.
    """
    clean_text = preprocess_text(text)
    detected_indicators = []
    detected_categories = set()

    # 1. Sensitive Credentials (Highest severity)
    cred_clues = []
    for pattern, name in SENSITIVE_CREDENTIAL_PATTERNS:
        match = re.search(pattern, clean_text, re.IGNORECASE)
        if match:
            cred_clues.append(name)
    if cred_clues:
        detected_indicators.append({
            "id": "sensitive_credential_request",
            "name": "Request for Sensitive Credentials",
            "description": "Caller or message asks for secret security credentials like OTP, UPI PIN, CVV, or passwords.",
            "severity": "high",
            "matched_clues": list(set(cred_clues))
        })
        detected_categories.add("Credential Theft (OTP/PIN/CVV)")

    # 2. QR Code / Receive PIN Trick
    qr_clues = []
    for pattern, name in QR_RECEIVE_PATTERNS:
        match = re.search(pattern, clean_text, re.IGNORECASE)
        if match:
            qr_clues.append(name)
    if qr_clues:
        detected_indicators.append({
            "id": "qr_receive_trap",
            "name": "QR Code / Receive PIN Trap",
            "description": "Claims you need to scan a QR code or enter your UPI PIN to receive money or a prize.",
            "severity": "high",
            "matched_clues": list(set(qr_clues))
        })
        detected_categories.add("UPI QR / Collect Scam")

    # 3. Remote Access Apps
    remote_clues = []
    for pattern, name in REMOTE_ACCESS_APP_PATTERNS:
        match = re.search(pattern, clean_text, re.IGNORECASE)
        if match:
            remote_clues.append(name)
    if remote_clues:
        detected_indicators.append({
            "id": "remote_access_app",
            "name": "Screen Sharing / Remote App Coercion",
            "description": "Instruction to download remote control tools (AnyDesk, TeamViewer, QuickSupport) that allow scammers to see your screen and steal codes.",
            "severity": "high",
            "matched_clues": list(set(remote_clues))
        })
        detected_categories.add("Remote Access Takeover")

    # 4. Fear & Threat (Account Block / Legal)
    fear_clues = []
    for pattern, name in FEAR_THREAT_PATTERNS:
        match = re.search(pattern, clean_text, re.IGNORECASE)
        if match:
            fear_clues.append(name)
    if fear_clues:
        detected_indicators.append({
            "id": "fear_threat_manipulation",
            "name": "Fear and Threat Coercion",
            "description": "Uses threats such as account blocking, KYC suspension, utility cut-off, or police legal notices to panic you into acting.",
            "severity": "high",
            "matched_clues": list(set(fear_clues))
        })
        detected_categories.add("Fake KYC / Account Suspension")

    # 5. Reward / Lottery / Advance Fee
    reward_clues = []
    for pattern, name in REWARD_PRIZE_PATTERNS:
        match = re.search(pattern, clean_text, re.IGNORECASE)
        if match:
            reward_clues.append(name)
    if reward_clues:
        detected_indicators.append({
            "id": "reward_advance_fee",
            "name": "Prize / Advance Fee Manipulation",
            "description": "Claims you won a lottery, prize, or high cashback, but requires you to transfer money or pay a 'processing fee' first.",
            "severity": "high",
            "matched_clues": list(set(reward_clues))
        })
        detected_categories.add("Prize / Reward Scam")

    # 6. Refund / Wrong Transfer Overpayment
    refund_clues = []
    for pattern, name in REFUND_OVERPAYMENT_PATTERNS:
        match = re.search(pattern, clean_text, re.IGNORECASE)
        if match:
            refund_clues.append(name)
    if refund_clues:
        detected_indicators.append({
            "id": "refund_overpayment_trap",
            "name": "Refund / Overpayment Deception",
            "description": "Scammer claims they sent extra money by mistake or that an unsolicited refund is waiting for you.",
            "severity": "high",
            "matched_clues": list(set(refund_clues))
        })
        detected_categories.add("Fake Refund Scam")

    # 7. Impersonation of Authority / Bank
    impersonate_clues = []
    for pattern, name in IMPERSONATION_PATTERNS:
        match = re.search(pattern, clean_text, re.IGNORECASE)
        if match:
            impersonate_clues.append(name)
    if impersonate_clues:
        detected_indicators.append({
            "id": "authority_impersonation",
            "name": "Bank / Authority Impersonation",
            "description": "Claims to be a bank manager, customer support representative, or official agency.",
            "severity": "medium",
            "matched_clues": list(set(impersonate_clues))
        })
        detected_categories.add("Fake Bank / Customer Support")

    # 8. Urgency / Time Pressure
    urgency_clues = []
    for pattern, name in URGENCY_PATTERNS:
        match = re.search(pattern, clean_text, re.IGNORECASE)
        if match:
            urgency_clues.append(name)
    if urgency_clues:
        detected_indicators.append({
            "id": "urgency_coercion",
            "name": "Artificial Time Pressure",
            "description": "Pushes you to act immediately, hurry, or respond within an artificial deadline to prevent calm verification.",
            "severity": "medium",
            "matched_clues": list(set(urgency_clues))
        })

    # 9. Untrusted Link / APK
    link_clues = []
    for pattern, name in UNTRUSTED_LINK_PATTERNS:
        match = re.search(pattern, clean_text, re.IGNORECASE)
        if match:
            link_clues.append(name)
    if link_clues:
        detected_indicators.append({
            "id": "untrusted_link_file",
            "name": "Suspicious Link or APK Download",
            "description": "Directs you to download third-party files (.apk) or click shortened/untrusted web links.",
            "severity": "high",
            "matched_clues": list(set(link_clues))
        })
        detected_categories.add("Malicious Link / Phishing")

    # 10. Legitimate Transaction Signal
    legit_clues = []
    for pattern, name in LEGITIMATE_TRANSACTION_PATTERNS:
        match = re.search(pattern, clean_text, re.IGNORECASE)
        if match:
            legit_clues.append(name)

    is_standard_notification = (len(legit_clues) > 0 and len(detected_indicators) == 0)

    return {
        "indicators": detected_indicators,
        "categories": list(detected_categories),
        "legitimate_clues": legit_clues,
        "is_standard_notification": is_standard_notification
    }
