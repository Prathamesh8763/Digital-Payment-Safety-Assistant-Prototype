import time
from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

RiskLevel = Literal["LOW", "MEDIUM", "HIGH", "UNABLE_TO_ASSESS"]

class TextCheckRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=3,
        max_length=2500,
        description="The suspicious message, phone call summary, or payment situation described by the user."
    )
    use_ai: bool = Field(
        default=False,
        description="Optional flag to request AI-assisted explanation enhancement (with fallback)."
    )
    language: str = Field(
        default="en",
        description="Target output language for explanations ('en', 'hi' for Hindi, 'hinglish' for Hinglish)."
    )

class GuidedCheckRequest(BaseModel):
    contact_source: str = Field(
        ...,
        description="Who contacted the user (e.g., unknown_call, bank_caller, sms, messaging_app, web_ad, in_person)."
    )
    sender_claim: str = Field(
        ...,
        description="What the person or message claimed (e.g., bank_alert, kyc_update, prize_won, refund_pending, urgent_family, normal_purchase)."
    )
    requested_action: str = Field(
        ...,
        description="What they asked the user to do (e.g., share_otp_pin, pay_small_fee_first, click_link, install_anydesk_app, scan_qr_to_receive, normal_merchant_pay)."
    )
    has_urgency_pressure: bool = Field(
        default=False,
        description="Whether the user felt pressured to act immediately or threatened with blocking/loss."
    )
    demands_money: bool = Field(
        default=False,
        description="Whether the caller or message asks the user to transfer or send money."
    )
    asks_sensitive_data: bool = Field(
        default=False,
        description="Whether OTP, UPI PIN, CVV, password, or debit card number was requested."
    )
    additional_notes: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="Optional additional context provided by the user."
    )
    use_ai: bool = Field(
        default=False,
        description="Optional flag to request AI-assisted explanation enhancement."
    )
    language: str = Field(
        default="en",
        description="Target output language for explanations ('en', 'hi', 'hinglish')."
    )

class DetectedIndicator(BaseModel):
    id: str
    name: str
    description: str
    severity: Literal["low", "medium", "high"]
    matched_clues: List[str] = []
    code: Optional[str] = None
    title: Optional[str] = None
    evidence_excerpt: Optional[str] = None
    source_type: Optional[str] = "message_rule"

    def model_post_init(self, __context: Any) -> None:
        if self.code is None:
            self.code = self.id.upper()
        if self.title is None:
            self.title = self.name
        if self.evidence_excerpt is None and self.matched_clues:
            self.evidence_excerpt = self.matched_clues[0]

class EducationalConcept(BaseModel):
    title: str
    concept: str
    golden_rule: str

URLVerificationStatus = Literal[
    "flagged", "suspicious", "no_known_threat_found", "unverified", "invalid_input",
    "provider_unavailable", "known_threat", "suspicious_indicators", "partial_result",
    "check_unavailable", "qr_decode_failed"
]

class SafetyAssessmentResponse(BaseModel):
    risk_level: RiskLevel
    risk_score: int = Field(..., ge=0, le=100, description="Risk score from 0 (very safe) to 100 (critical risk)")
    summary: str
    status: Optional[str] = "analyzed"
    verification_status: Optional[str] = None
    input_type: str = "message"
    reviewed_input: Optional[str] = None
    detected_categories: List[str]
    indicators: List[DetectedIndicator]
    why_suspicious: List[str]
    reasons: Optional[List[str]] = None
    recommended_actions: List[str]
    recommendation: Optional[str] = None
    educational_concept: EducationalConcept
    detected_urls: List[str] = []
    url_assessments: List[Dict[str, Any]] = []
    urls: Optional[List[Dict[str, Any]]] = None
    checks_performed: List[str] = []
    checks_unavailable: List[str] = []
    checked_at: Optional[str] = None
    is_safe_practice: bool = False
    ai_enhanced: bool = False
    ai_analysis_summary: Optional[str] = None
    confidence_rating: Optional[str] = "Deterministic Rule Baseline"
    reference_id: str = Field(default="REF-SAFETY-0000", description="Privacy-safe reference ID for this assessment")
    analysis_id: Optional[str] = None
    uncertainty_note: str = Field(
        default="This assessment reflects detectable patterns. A low-risk result is not proof of safety.",
        description="Explicit communication of evidence bounds and uncertainty (FR-01/FR-03)"
    )
    language: str = Field(default="en", description="Output language code")
    disclaimer: str = (
        "This safety assessment is an advisory tool designed to help you pause and verify. "
        "A low-risk score is not a guarantee of safety. Never share your UPI PIN or OTP with anyone."
    )

    def model_post_init(self, __context: Any) -> None:
        if self.reasons is None:
            self.reasons = list(self.why_suspicious)
        if self.recommendation is None and self.recommended_actions:
            self.recommendation = self.recommended_actions[0]
        if self.verification_status is None:
            self.verification_status = self.status
        if self.analysis_id is None:
            self.analysis_id = self.reference_id
        if self.urls is None and self.url_assessments:
            self.urls = self.url_assessments

class URLCheckRequest(BaseModel):
    url: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="The web address or link found in a suspicious message or email."
    )
    context: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Optional context (e.g., 'received via SMS claiming to update KYC')."
    )
    language: str = Field(default="en")

class URLCheckResponse(BaseModel):
    risk_level: RiskLevel
    risk_score: int = Field(..., ge=0, le=100)
    status: URLVerificationStatus = "unverified"
    verification_status: Optional[str] = None
    input_type: str = "url"
    reviewed_input: Optional[str] = None
    url_submitted: str
    normalized_url: str
    display_url: Optional[str] = None
    domain: str
    protocol: str
    is_https: bool
    is_shortened: bool
    is_ip_address: bool
    is_suspicious_tld: bool
    impersonated_brand: Optional[str] = None
    indicators: List[DetectedIndicator]
    why_suspicious: List[str]
    reasons: Optional[List[str]] = None
    recommended_actions: List[str]
    recommendation: Optional[str] = None
    checks: Optional[List[Dict[str, Any]]] = None
    checks_performed: List[str] = []
    checks_unavailable: List[str] = []
    checked_at: Optional[str] = None
    educational_concept: EducationalConcept
    reference_id: str = "REF-URL-0000"
    analysis_id: Optional[str] = None
    platform_category: Optional[str] = None
    platform_name: Optional[str] = None
    is_checkout_detected: bool = False
    multi_parameter_scorecard: Optional[Dict[str, Any]] = None
    safety_guidance: Optional[List[str]] = None
    uncertainty_note: str = "Inspected without navigating to the destination. Unflagged domains may still host unknown threats."
    language: str = "en"
    disclaimer: str = (
        "Inspected safely without visiting the link. A low-risk result does not guarantee that the destination is safe. "
        "Always verify official bank and payment websites directly from known sources."
    )

    def model_post_init(self, __context: Any) -> None:
        if self.reasons is None:
            self.reasons = list(self.why_suspicious)
        if self.recommendation is None and self.recommended_actions:
            self.recommendation = self.recommended_actions[0]
        if self.verification_status is None:
            self.verification_status = self.status
        if self.analysis_id is None:
            self.analysis_id = self.reference_id
        if self.display_url is None:
            self.display_url = self.domain
        if self.checks is None:
            self.checks = (
                [{"name": c, "status": "completed"} for c in self.checks_performed] +
                [{"name": c, "status": "not_configured"} for c in self.checks_unavailable]
            )

class CheckLinkRequest(BaseModel):
    url: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="The web address or link found in a suspicious message or email."
    )
    include_reputation: bool = Field(
        default=True,
        description="Whether to query configured external reputation providers."
    )
    language: str = Field(default="en")

class CheckLinkFinding(BaseModel):
    title: str
    description: str
    evidence: Optional[str] = None
    severity: str = "medium"

class CheckLinkResponse(BaseModel):
    status: URLVerificationStatus = "unverified"
    summary: str
    normalized_url: str
    display_url: Optional[str] = None
    checks: Dict[str, str] = Field(
        default_factory=lambda: {
            "syntax": "passed",
            "host_analysis": "completed",
            "reputation": "unavailable"
        }
    )
    findings: List[CheckLinkFinding] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    checked_at: str = Field(default_factory=lambda: time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))
    risk_level: RiskLevel = "UNABLE_TO_ASSESS"
    risk_score: int = 40
    domain: str = ""
    protocol: str = "https"
    is_https: bool = True
    is_shortened: bool = False
    is_ip_address: bool = False
    is_suspicious_tld: bool = False
    impersonated_brand: Optional[str] = None
    indicators: List[DetectedIndicator] = Field(default_factory=list)
    why_suspicious: List[str] = Field(default_factory=list)
    reasons: Optional[List[str]] = None
    checks_performed: List[str] = Field(default_factory=list)
    checks_unavailable: List[str] = Field(default_factory=list)
    reference_id: str = "REF-URL-0000"
    analysis_id: Optional[str] = None
    platform_category: Optional[str] = None
    platform_name: Optional[str] = None
    is_checkout_detected: bool = False
    multi_parameter_scorecard: Optional[Dict[str, Any]] = None
    safety_guidance: Optional[List[str]] = None
    educational_concept: Optional[EducationalConcept] = None
    uncertainty_note: str = "Inspected safely without visiting the destination. Absence of a threat match does NOT prove safety."
    disclaimer: str = (
        "Inspected safely without visiting the link. A low-risk result does not guarantee that the destination is safe. "
        "Always verify official bank and payment websites directly from known sources."
    )

    def model_post_init(self, __context: Any) -> None:
        if self.reasons is None:
            self.reasons = list(self.why_suspicious)
        if self.analysis_id is None:
            self.analysis_id = self.reference_id
        if self.display_url is None:
            self.display_url = self.domain

class QRCheckRequest(BaseModel):
    payload: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="The decoded payload string from a QR code (e.g. upi://pay?... or web URL)."
    )
    context: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Context in which QR was provided (e.g., 'buyer told me to scan to receive money')."
    )
    language: str = Field(default="en")

class QRCheckResponse(BaseModel):
    risk_level: RiskLevel
    risk_score: int = Field(..., ge=0, le=100)
    payload_type: Literal["upi_intent", "url", "text", "unknown"]
    reviewed_input: Optional[str] = None
    verification_status: Optional[str] = None
    raw_payload_preview: str
    parsed_details: Dict[str, Any] = {}
    indicators: List[DetectedIndicator]
    why_suspicious: List[str]
    recommended_actions: List[str]
    educational_concept: EducationalConcept
    reference_id: str = "REF-QR-0000"
    analysis_id: Optional[str] = None
    uncertainty_note: str = "QR code inspected safely. A QR code can only request outgoing payments."
    language: str = "en"
    disclaimer: str = (
        "QR code inspected safely. You NEVER need to scan a QR code or enter your UPI PIN to receive money. "
        "Scanning a QR code only initiates an outgoing payment from your account."
    )

    def model_post_init(self, __context: Any) -> None:
        if self.analysis_id is None:
            self.analysis_id = self.reference_id
        if self.verification_status is None:
            self.verification_status = "flagged" if self.risk_level == "HIGH" else "unverified"

class FeedbackRequest(BaseModel):
    reference_id: Optional[str] = Field(default=None, max_length=64, description="Optional assessment reference ID")
    assessment_type: Literal["text", "guided", "url", "qr"]
    feedback_rating: Literal["helpful", "unclear", "appears_incorrect"]
    feedback_category: Optional[Literal["false_alarm", "missed_scam", "unclear_explanation", "general"]] = None
    comments: Optional[str] = Field(default=None, max_length=500, description="Optional brief remarks (do NOT include PINs or passwords)")

class FeedbackResponse(BaseModel):
    status: str = "success"
    feedback_id: str
    message: str = (
        "Thank you for your feedback! Your feedback helps us continuously improve detection rules "
        "without collecting personal credentials."
    )

class EvaluationMetrics(BaseModel):
    total_samples: int
    accuracy_percentage: float
    precision_percentage: float
    recall_percentage: float
    false_positive_rate: float
    false_negative_rate: float
    scam_detection_rate: float
    legitimate_preservation_rate: float
    details_by_category: Dict[str, Any]
    details_by_language: Optional[Dict[str, Any]] = None
    evaluation_version: str = "V3.0"
