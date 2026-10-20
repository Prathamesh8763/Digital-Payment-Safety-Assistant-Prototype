import uuid
from typing import Dict, Any, List
from schemas.safety import (
    TextCheckRequest,
    GuidedCheckRequest,
    SafetyAssessmentResponse,
    DetectedIndicator,
    EducationalConcept,
    URLCheckRequest,
    URLCheckResponse,
    QRCheckRequest,
    QRCheckResponse,
    CheckLinkRequest,
    CheckLinkResponse
)
from safety.detector import detect_indicators_in_text
from safety.risk import calculate_risk
from safety.recommendations import generate_recommendations
from safety.url_checker import URLChecker
from safety.qr_service import QRService
from safety.ai_analysis import AIAnalysisService
from safety.languages import localize_assessment
from safety.feedback_service import FeedbackService

class SafetyEngine:
    """
    V3 Multi-modal Safety Engine coordinating text analysis, guided questionnaires,
    URLs, QR payloads, localization (Hindi/Hinglish), and feedback recording.
    """

    def __init__(self):
        self.url_checker = URLChecker()
        self.qr_service = QRService()
        self.ai_service = AIAnalysisService()
        self.feedback_service = FeedbackService()

    def _generate_ref_id(self, prefix: str) -> str:
        return f"REF-{prefix}-{uuid.uuid4().hex[:8].upper()}"

    def _build_uncertainty_note(self, risk_level: str, num_indicators: int) -> str:
        if risk_level == "HIGH":
            return f"High risk indicators detected ({num_indicators} matched warning sign(s)). Exercise extreme caution and do not send funds."
        elif risk_level == "MEDIUM":
            return "Some warning signs detected, but available evidence is incomplete. Pause and independently verify before acting."
        elif risk_level == "LOW":
            return "No strong scam warning signs detected. NOTE: A low-risk assessment is NOT proof of safety. Always remain vigilant."
        return "Unable to determine risk due to insufficient contextual information."

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

        ref_id = self._generate_ref_id("TXT")
        uncertainty = self._build_uncertainty_note(risk_level, len(indicators))

        # Localize if requested (Hindi / Hinglish)
        golden_rule = rec_data["educational_concept"]["golden_rule"]
        actions = rec_data["recommended_actions"]
        if request.language in ["hi", "hinglish"]:
            localized = localize_assessment(
                language=request.language,
                risk_level=risk_level,
                recommended_actions=actions,
                golden_rule=golden_rule,
                uncertainty_note=uncertainty
            )
            actions = localized["localized_actions"]
            golden_rule = localized["localized_golden_rule"]
            uncertainty = localized["localized_uncertainty"]

        edu_concept = EducationalConcept(
            title=rec_data["educational_concept"]["title"],
            concept=rec_data["educational_concept"]["concept"],
            golden_rule=golden_rule
        )

        detected_urls = detection.get("detected_urls", [])
        url_assessments = []
        checks_performed = ["text_pattern_matching", "credential_check", "urgency_check"]
        if detected_urls:
            checks_performed.append("url_extraction")
            for idx, u in enumerate(detected_urls[:5]):
                u_check = self.url_checker.analyze_url(URLCheckRequest(url=u, language=request.language))
                checks_list = (
                    [{"name": c, "status": "completed"} for c in u_check.checks_performed] +
                    [{"name": c, "status": "not_configured"} for c in u_check.checks_unavailable]
                )
                url_assessments.append({
                    "url_id": f"url-{idx + 1}",
                    "url": u,
                    "display_url": u_check.domain,
                    "domain": u_check.domain,
                    "status": u_check.status,
                    "verification_status": u_check.status,
                    "risk_level": u_check.risk_level,
                    "risk_score": u_check.risk_score,
                    "why_suspicious": u_check.why_suspicious,
                    "reasons": u_check.why_suspicious,
                    "checks": checks_list
                })

                if u_check.status == "unverified" and not any(ind.id == "unverified_url_destination" for ind in formatted_indicators):
                    formatted_indicators.append(DetectedIndicator(
                        id="unverified_url_destination",
                        name="Unverified destination",
                        description="The link has no verified trust verdict in this example; unknown does not mean safe.",
                        severity="medium",
                        matched_clues=["UNVERIFIED URL"],
                        code="UNVERIFIED_DESTINATION",
                        title="Unverified destination",
                        evidence_excerpt=u,
                        source_type="url_check"
                    ))
                elif u_check.status == "flagged" and not any(ind.id == "flagged_url_destination" for ind in formatted_indicators):
                    formatted_indicators.append(DetectedIndicator(
                        id="flagged_url_destination",
                        name="Potential Threat Link",
                        description="The link matches known deceptive domains, suspicious TLDs, or dangerous file downloads.",
                        severity="high",
                        matched_clues=["FLAGGED URL"],
                        code="FLAGGED_DESTINATION",
                        title="Potential Threat Link",
                        evidence_excerpt=u,
                        source_type="url_check"
                    ))

        return SafetyAssessmentResponse(
            risk_level=risk_level,
            risk_score=risk_score,
            summary=rec_data["summary"],
            status="analyzed",
            verification_status="analyzed",
            reviewed_input=request.text,
            detected_categories=categories if categories else (["Normal / Legitimate Transaction"] if is_standard_notification else ["Unspecified"]),
            indicators=formatted_indicators,
            why_suspicious=rec_data["why_suspicious"],
            reasons=rec_data["why_suspicious"],
            recommended_actions=actions,
            educational_concept=edu_concept,
            detected_urls=detected_urls,
            url_assessments=url_assessments,
            urls=url_assessments,
            checks_performed=checks_performed,
            checks_unavailable=[],
            is_safe_practice=is_standard_notification,
            ai_enhanced=False,
            confidence_rating="Deterministic Rule Baseline",
            reference_id=ref_id,
            analysis_id=ref_id,
            uncertainty_note=uncertainty,
            language=request.language
        )

    async def analyze_text_with_ai_option(self, request: TextCheckRequest) -> SafetyAssessmentResponse:
        baseline = self.analyze_text(request)
        if request.use_ai:
            return await self.ai_service.enhance_assessment(request.text, baseline)
        return baseline

    def analyze_guided(self, request: GuidedCheckRequest) -> SafetyAssessmentResponse:
        guided_indicators: List[Dict[str, Any]] = []
        categories = set()

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

        ref_id = self._generate_ref_id("GUIDED")
        uncertainty = self._build_uncertainty_note(risk_level, len(guided_indicators))

        golden_rule = rec_data["educational_concept"]["golden_rule"]
        actions = rec_data["recommended_actions"]
        if request.language in ["hi", "hinglish"]:
            localized = localize_assessment(
                language=request.language,
                risk_level=risk_level,
                recommended_actions=actions,
                golden_rule=golden_rule,
                uncertainty_note=uncertainty
            )
            actions = localized["localized_actions"]
            golden_rule = localized["localized_golden_rule"]
            uncertainty = localized["localized_uncertainty"]

        edu_concept = EducationalConcept(
            title=rec_data["educational_concept"]["title"],
            concept=rec_data["educational_concept"]["concept"],
            golden_rule=golden_rule
        )

        return SafetyAssessmentResponse(
            risk_level=risk_level,
            risk_score=risk_score,
            summary=rec_data["summary"],
            status="analyzed",
            verification_status="analyzed",
            reviewed_input=f"Sender: {request.contact_source}, Claim: {request.sender_claim}, Action: {request.requested_action}",
            detected_categories=list(categories) if categories else (["Normal Merchant Payment"] if is_normal_merchant else ["Unspecified"]),
            indicators=formatted_indicators,
            why_suspicious=rec_data["why_suspicious"],
            reasons=rec_data["why_suspicious"],
            recommended_actions=actions,
            educational_concept=edu_concept,
            is_safe_practice=is_normal_merchant,
            ai_enhanced=False,
            confidence_rating="Deterministic Rule Baseline",
            reference_id=ref_id,
            analysis_id=ref_id,
            uncertainty_note=uncertainty,
            language=request.language
        )

    def analyze_url(self, request: URLCheckRequest) -> URLCheckResponse:
        res = self.url_checker.analyze_url(request)
        res.reference_id = self._generate_ref_id("URL")
        res.analysis_id = res.reference_id
        res.reviewed_input = request.url
        res.display_url = res.domain
        res.verification_status = res.status
        res.language = request.language
        if not res.uncertainty_note:
            res.uncertainty_note = self._build_uncertainty_note(res.risk_level, len(res.indicators))
        return res

    def analyze_qr(self, request: QRCheckRequest) -> QRCheckResponse:
        res = self.qr_service.analyze_payload(request)
        res.reference_id = self._generate_ref_id("QR")
        res.analysis_id = res.reference_id
        res.reviewed_input = request.payload
        res.verification_status = "flagged" if res.risk_level == "HIGH" else "unverified"
        res.language = request.language
        res.uncertainty_note = self._build_uncertainty_note(res.risk_level, len(res.indicators))
        return res

    def check_link(self, request: CheckLinkRequest) -> CheckLinkResponse:
        res = self.url_checker.check_link(request)
        res.reference_id = self._generate_ref_id("URL")
        res.analysis_id = res.reference_id
        return res
