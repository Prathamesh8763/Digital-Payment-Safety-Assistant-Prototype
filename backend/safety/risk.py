from typing import List, Dict, Any, Tuple

def calculate_risk(indicators: List[Dict[str, Any]], is_standard_notification: bool = False) -> Tuple[str, int]:
    """
    Computes a risk score (0-100) and risk level (LOW, MEDIUM, HIGH)
    based on detected indicators and their severity.
    """
    if is_standard_notification:
        return "LOW", 5

    if not indicators:
        return "LOW", 10

    score = 0
    indicator_ids = {ind["id"] for ind in indicators}

    # Severity scoring
    for ind in indicators:
        severity = ind.get("severity", "low")
        if severity == "high":
            score += 35
        elif severity == "medium":
            score += 15
        else:
            score += 5

    # Critical override rules based on payment fraud principles
    if "sensitive_credential_request" in indicator_ids:
        score = max(score, 90)

    if "qr_receive_trap" in indicator_ids:
        score = max(score, 88)

    if "remote_access_app" in indicator_ids:
        score = max(score, 95)

    if "reward_advance_fee" in indicator_ids:
        score = max(score, 82)

    if "refund_overpayment_trap" in indicator_ids:
        score = max(score, 80)

    if "fear_threat_manipulation" in indicator_ids and ("urgency_coercion" in indicator_ids or "authority_impersonation" in indicator_ids):
        score = max(score, 78)

    if "untrusted_link_file" in indicator_ids:
        score = max(score, 75)

    if "job_task_manipulation" in indicator_ids:
        score = max(score, 45)

    # Clamp score to 100
    score = min(score, 100)

    # Map to Risk Level
    if score >= 66:
        risk_level = "HIGH"
    elif score >= 31:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    return risk_level, score
