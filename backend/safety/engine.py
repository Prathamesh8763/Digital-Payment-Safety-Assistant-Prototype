from typing import Dict, Any, List
from schemas.safety import (
    TextCheckRequest,
    GuidedCheckRequest,
    SafetyAssessmentResponse,
    DetectedIndicator,
    EducationalConcept
)
from safety.detector import detect_indicators_in_text
from safety.risk import calculate_risk
from safety.recommendations import generate_recommendations

class SafetyEngine:
    """
    Core rule-based engine that processes either freeform text or guided answers
    and generates an actionable risk assessment.
    """

    def analyze_text(self, request: TextCheckRequest) -> SafetyAssessmentResponse:
        detection = detect_indicators_in_text(request.text)
        indicators = detection["indicators"]
        categories = detection["categories"]
        is_standard_notification = detection["is_standard_notification"]

        risk_level, risk_score = calculate_risk(indicators, is_standard_notification=is_standard_notification)
        rec_data = generate_recommendations(
            risk_level=risk_level,
            risk_score=risk_score,
            indicators=indicators,
            categories=categories,
            is_standard_notification=is_standard_notification
        )

        formatted_indicators = [
            DetectedIndicator(
                id=ind["id"],
                name=ind["name"],
                description=ind["description"],
                severity=ind["severity"],
                matched_clues=ind.get("matched_clues", [])
            )
            for ind in indicators
        ]

        return SafetyAssessmentResponse(
            risk_level=risk_level,
            risk_score=risk_score,
            summary=rec_data["summary"],
            detected_categories=categories if categories else (["Normal / Legitimate Transaction"] if is_standard_notification else ["Unspecified"]),
            indicators=formatted_indicators,
            why_suspicious=rec_data["why_suspicious"],
            recommended_actions=rec_data["recommended_actions"],
            educational_concept=EducationalConcept(**rec_data["educational_concept"]),
            is_safe_practice=is_standard_notification
        )

    def analyze_guided(self, request: GuidedCheckRequest) -> SafetyAssessmentResponse:
        guided_indicators: List[Dict[str, Any]] = []
        categories = set()

        # Map guided answers to deterministic safety indicators
        if request.asks_sensitive_data or request.requested_action == "share_otp_pin":
            guided_indicators.append({
                "id": "sensitive_credential_request",
                "name": "Request for Sensitive Credentials",
                "description": "User confirmed that OTP, UPI PIN, CVV, or passwords were asked.",
                "severity": "high",
                "matched_clues": ["OTP/PIN requested in guided survey"]
            })
            categories.add("Credential Theft (OTP/PIN/CVV)")

        if request.requested_action == "install_anydesk_app":
            guided_indicators.append({
                "id": "remote_access_app",
                "name": "Screen Sharing / Remote App Coercion",
                "description": "User confirmed an instruction to install AnyDesk, TeamViewer, or screen-sharing tools.",
                "severity": "high",
                "matched_clues": ["Remote access application installation requested"]
            })
            categories.add("Remote Access Takeover")

        if request.requested_action == "scan_qr_to_receive":
            guided_indicators.append({
                "id": "qr_receive_trap",
                "name": "QR Code / Receive PIN Trap",
                "description": "User was asked to scan a QR code or enter PIN to receive money.",
                "severity": "high",
                "matched_clues": ["Scan QR to receive money claimed"]
            })
            categories.add("UPI QR / Collect Scam")

        if request.sender_claim == "prize_won" or request.requested_action == "pay_small_fee_first":
            guided_indicators.append({
                "id": "reward_advance_fee",
                "name": "Prize / Advance Fee Manipulation",
                "description": "User was told they won a prize or must pay an upfront fee to claim funds.",
                "severity": "high",
                "matched_clues": ["Prize claimed or advance fee demanded"]
            })
            categories.add("Prize / Reward Scam")

        if request.sender_claim == "refund_pending":
            guided_indicators.append({
                "id": "refund_overpayment_trap",
                "name": "Refund / Overpayment Deception",
                "description": "User was offered an unsolicited refund or excess money claim.",
                "severity": "high",
                "matched_clues": ["Unsolicited refund situation"]
            })
            categories.add("Fake Refund Scam")

        if request.sender_claim in ["bank_alert", "kyc_update"]:
            guided_indicators.append({
                "id": "fear_threat_manipulation",
                "name": "Fear and Threat Coercion",
                "description": "Caller or message alleged account blockage or KYC deadline.",
                "severity": "high",
                "matched_clues": ["Bank alert / KYC suspension threat"]
            })
            categories.add("Fake KYC / Account Suspension")

        if request.contact_source in ["unknown_call", "bank_caller"] and request.sender_claim in ["bank_alert", "kyc_update"]:
            guided_indicators.append({
                "id": "authority_impersonation",
                "name": "Bank / Authority Impersonation",
                "description": "Contact claimed to represent a bank or authority over an unverified channel.",
                "severity": "medium",
                "matched_clues": ["Caller posing as bank representative"]
            })
            categories.add("Fake Bank / Customer Support")

        if request.has_urgency_pressure:
            guided_indicators.append({
                "id": "urgency_coercion",
                "name": "Artificial Time Pressure",
                "description": "User felt pressured with threats or urgent demands to act fast.",
                "severity": "medium",
                "matched_clues": ["Pressure to act immediately reported"]
            })

        if request.requested_action == "click_link":
            guided_indicators.append({
                "id": "untrusted_link_file",
                "name": "Suspicious Link",
                "description": "User was directed to click an external link sent via message.",
                "severity": "medium",
                "matched_clues": ["Instruction to click web link"]
            })
            categories.add("Malicious Link / Phishing")

        # Scan additional notes if provided
        if request.additional_notes and len(request.additional_notes.strip()) > 3:
            text_detection = detect_indicators_in_text(request.additional_notes)
            existing_ids = {ind["id"] for ind in guided_indicators}
            for ind in text_detection["indicators"]:
                if ind["id"] not in existing_ids:
                    guided_indicators.append(ind)
            categories.update(text_detection["categories"])

        is_normal_merchant = (
            request.requested_action == "normal_merchant_pay" and
            not request.asks_sensitive_data and
            not request.has_urgency_pressure and
            not request.demands_money and
            len(guided_indicators) == 0
        )

        risk_level, risk_score = calculate_risk(guided_indicators, is_standard_notification=is_normal_merchant)
        rec_data = generate_recommendations(
            risk_level=risk_level,
            risk_score=risk_score,
            indicators=guided_indicators,
            categories=list(categories),
            is_standard_notification=is_normal_merchant
        )

        formatted_indicators = [
            DetectedIndicator(
                id=ind["id"],
                name=ind["name"],
                description=ind["description"],
                severity=ind["severity"],
                matched_clues=ind.get("matched_clues", [])
            )
            for ind in guided_indicators
        ]

        return SafetyAssessmentResponse(
            risk_level=risk_level,
            risk_score=risk_score,
            summary=rec_data["summary"],
            detected_categories=list(categories) if categories else (["Normal Merchant Payment"] if is_normal_merchant else ["Unspecified"]),
            indicators=formatted_indicators,
            why_suspicious=rec_data["why_suspicious"],
            recommended_actions=rec_data["recommended_actions"],
            educational_concept=EducationalConcept(**rec_data["educational_concept"]),
            is_safe_practice=is_normal_merchant
        )
