from typing import List, Dict, Any

def generate_recommendations(
    risk_level: str,
    risk_score: int,
    indicators: List[Dict[str, Any]],
    categories: List[str],
    is_standard_notification: bool = False
) -> Dict[str, Any]:
    """
    Generates plain-language reasons, recommended actions, and digital-payment educational concepts.
    """
    why_suspicious = []
    recommended_actions = []
    indicator_ids = {ind["id"] for ind in indicators}

    # Educational concepts catalog
    educational_concepts = {
        "upi_pin_rule": {
            "title": "UPI PIN is ONLY for Sending Money",
            "concept": (
                "You NEVER need to enter your UPI PIN, ATM PIN, or OTP to receive money or get a refund. "
                "Entering your PIN always authorizes money to LEAVE your bank account."
            ),
            "golden_rule": "Entering PIN = Money Deducted. Receiving Money = No PIN Required."
        },
        "bank_impersonation": {
            "title": "Banks Never Ask for Secret Passwords or Threaten Over Calls",
            "concept": (
                "Official bank employees never call asking for your OTP, CVV, or passwords. "
                "Banks also do not give 10-minute ultimatums to block accounts via informal calls."
            ),
            "golden_rule": "Hang up and call the number printed on the back of your debit card."
        },
        "advance_fee_rule": {
            "title": "Prize & Advance Fee Fallacy",
            "concept": (
                "Legitimate lotteries and contests never ask winners to pay an 'activation fee', 'tax', or 'deposit' upfront. "
                "Any request to pay money to receive money is almost always a scam."
            ),
            "golden_rule": "If you have to pay money to receive a prize, it is NOT a prize."
        },
        "remote_access_rule": {
            "title": "Screen Sharing Apps Expose Everything",
            "concept": (
                "Apps like AnyDesk, TeamViewer, and QuickSupport share your entire phone screen with the other person. "
                "Scammers use them to watch your SMS OTPs and banking passwords as you type them."
            ),
            "golden_rule": "Never install remote access or screen-sharing apps at the request of an unknown caller."
        },
        "legitimate_notice": {
            "title": "Safe Verification Habits",
            "concept": (
                "Always check transaction details directly in your official banking or UPI app rather than relying only on SMS messages or caller statements."
            ),
            "golden_rule": "Verify in your official bank app, not from unverified links or phone calls."
        }
    }

    # Populate reasons based on matched indicators
    if "sensitive_credential_request" in indicator_ids:
        why_suspicious.append("The contact is asking for secret security credentials (OTP, UPI PIN, CVV, or password). Legitimate organizations never request these.")
        recommended_actions.append("NEVER share your OTP, UPI PIN, CVV, or banking password with anyone, not even someone claiming to be bank staff.")
        educational = educational_concepts["upi_pin_rule"]

    if "remote_access_app" in indicator_ids:
        why_suspicious.append("You were instructed to install screen-sharing software (like AnyDesk or TeamViewer). Scammers use these apps to view your passwords and OTPs live.")
        recommended_actions.append("Do NOT install any screen-sharing or remote desktop app. If you already installed it, uninstall it immediately and turn off Wi-Fi/Mobile Data.")
        educational = educational_concepts["remote_access_rule"]

    if "qr_receive_trap" in indicator_ids:
        why_suspicious.append("You were asked to scan a QR code or accept a collect request to 'receive' money. Scanning a QR code or entering a PIN only deducts money from your account.")
        recommended_actions.append("Do NOT scan the QR code and REJECT any collect request in your UPI app. You never need to scan a QR code to receive money.")
        educational = educational_concepts["upi_pin_rule"]

    if "fear_threat_manipulation" in indicator_ids:
        why_suspicious.append("The message or caller uses fear tactics (threatening account blockage, utility disconnection, or legal police action) to force a rushed reaction.")
        recommended_actions.append("Do NOT panic or pay under pressure. Banks and utility providers follow formal written notices and do not threaten immediate disconnection over random calls.")

    if "reward_advance_fee" in indicator_ids:
        why_suspicious.append("You are being promised a reward or lottery money, but asked to pay a fee or advance charges first. This is a classic advance-fee trap.")
        recommended_actions.append("Do NOT pay any fee, tax, or registration amount to claim a prize or cashback. Legitimate awards never require upfront payment.")
        educational = educational_concepts["advance_fee_rule"]

    if "refund_overpayment_trap" in indicator_ids:
        why_suspicious.append("The sender claims to have sent excess money by mistake or promises an unverified refund. Scammers use fake screenshots or collect requests to trick victims.")
        recommended_actions.append("Check your actual bank balance in your official banking app. Do NOT return money based on an SMS screenshot or phone request alone.")

    if "authority_impersonation" in indicator_ids:
        why_suspicious.append("The caller or sender is posing as a bank manager, government agency, or customer care executive.")
        recommended_actions.append("Disconnect the call and contact the organization using the official customer care number found on their official website or on the back of your debit card.")

    if "urgency_coercion" in indicator_ids:
        why_suspicious.append("Artificial urgency is being created (demanding action within hours or minutes) to prevent you from taking time to verify.")
        recommended_actions.append("Take a deep breath and pause. Scammers rely on panic. Legitimate financial issues can always be verified through your official branch.")

    if "untrusted_link_file" in indicator_ids:
        why_suspicious.append("You received an unknown link or were asked to install an APK file from outside the official Google Play Store or Apple App Store.")
        recommended_actions.append("Do NOT click the link or download any file. Delete the message and block the sender.")

    # Fallbacks and Low Risk logic
    if risk_level == "LOW":
        if is_standard_notification:
            summary = "This looks like a standard transaction or everyday payment update with no typical scam indicators."
            why_suspicious = ["No requests for secret credentials, remote apps, or advance fee demands were detected."]
            recommended_actions = [
                "Verify the transaction directly in your official banking or UPI app statement if you are unsure.",
                "Ensure your UPI app notifications and SMS alerts are from the verified bank header (e.g., AD-HDFCBK, AX-SBIBNK)."
            ]
            educational = educational_concepts["legitimate_notice"]
        else:
            summary = "Low immediate risk detected. However, always exercise normal digital payment caution."
            why_suspicious = ["The provided description does not exhibit obvious high-risk scam triggers, but remain alert."]
            recommended_actions = [
                "Proceed with normal caution: never share your UPI PIN or OTP.",
                "If someone contacts you asking for money, independently call them to confirm their identity."
            ]
            educational = educational_concepts["legitimate_notice"]
    elif risk_level == "MEDIUM":
        summary = "Potential warning signs detected. Proceed with caution and do not make payments or share details yet."
        if not why_suspicious:
            why_suspicious.append("The communication displays unusual requests or urgency that match common social-engineering tactics.")
        if not recommended_actions:
            recommended_actions.append("Stop and independently verify before sending any money or clicking any link.")
        educational = educational_concepts.get("bank_impersonation", educational_concepts["legitimate_notice"])
    else: # HIGH
        summary = "HIGH RISK: Strong indicators of a digital payment scam detected. Do not proceed with the requested action."
        if not recommended_actions:
            recommended_actions.append("Stop immediately. Do NOT send money, do NOT share any codes, and do NOT install requested apps.")
        educational = locals().get("educational", educational_concepts["upi_pin_rule"])

    # Ensure unique recommended actions
    unique_actions = []
    seen = set()
    for act in recommended_actions:
        if act not in seen:
            unique_actions.append(act)
            seen.add(act)

    return {
        "summary": summary,
        "why_suspicious": why_suspicious,
        "recommended_actions": unique_actions,
        "educational_concept": educational
    }
