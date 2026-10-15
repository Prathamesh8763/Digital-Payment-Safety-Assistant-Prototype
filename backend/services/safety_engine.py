from backend.models.analysis_result import AnalysisResult


def analyze_message(message: str) -> AnalysisResult:
    message_lower = message.lower()

    reasons = []
    risk_score = 0

    if "otp" in message_lower:
        reasons.append("The message asks for an OTP.")
        risk_score += 3

    if "upi pin" in message_lower or "pin" in message_lower:
        reasons.append("The message asks for a payment PIN.")
        risk_score += 3

    if "urgent" in message_lower or "immediately" in message_lower:
        reasons.append("The message creates urgency or pressure.")
        risk_score += 2

    if "blocked" in message_lower or "account will be closed" in message_lower:
        reasons.append("The message uses account-blocking or threatening language.")
        risk_score += 2

    if "reward" in message_lower or "prize" in message_lower:
        reasons.append("The message uses a reward or prize to influence the user.")
        risk_score += 2

    if "refund" in message_lower:
        reasons.append("The message involves a refund request or claim.")
        risk_score += 1

    if any(
        phrase in message_lower
        for phrase in [
            "send ₹",
            "send rs",
            "pay ₹",
            "pay rs",
            "transfer ₹",
            "transfer rs",
            "transfer money",
            "make a payment",
        ]
    ):
        reasons.append("The message asks the user to make a payment.")
        risk_score += 2

    if risk_score >= 5:
        risk_level = "High"
        recommendation = (
            "Do not make a payment or share sensitive information. "
            "Verify the request through an official channel."
        )
    elif risk_score >= 2:
        risk_level = "Medium"
        recommendation = (
            "Pause before taking action and verify the request "
            "through an official source."
        )
    else:
        risk_level = "Low"
        recommendation = (
            "No strong warning signs were detected. "
            "Still verify unexpected payment requests before acting."
        )

    return AnalysisResult(
        risk_level=risk_level,
        reasons=reasons,
        recommendation=recommendation,
    )