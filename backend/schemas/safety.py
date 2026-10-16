from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

RiskLevel = Literal["LOW", "MEDIUM", "HIGH"]

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

class DetectedIndicator(BaseModel):
    id: str
    name: str
    description: str
    severity: Literal["low", "medium", "high"]
    matched_clues: List[str] = []

class EducationalConcept(BaseModel):
    title: str
    concept: str
    golden_rule: str

class SafetyAssessmentResponse(BaseModel):
    risk_level: RiskLevel
    risk_score: int = Field(..., ge=0, le=100, description="Risk score from 0 (very safe) to 100 (critical risk)")
    summary: str
    detected_categories: List[str]
    indicators: List[DetectedIndicator]
    why_suspicious: List[str]
    recommended_actions: List[str]
    educational_concept: EducationalConcept
    is_safe_practice: bool = False
    ai_enhanced: bool = False
    ai_analysis_summary: Optional[str] = None
    confidence_rating: Optional[str] = "Deterministic Rule Baseline"
    disclaimer: str = (
        "This safety assessment is an advisory tool designed to help you pause and verify. "
        "A low-risk score is not a guarantee of safety. Never share your UPI PIN or OTP with anyone."
    )

class URLCheckRequest(BaseModel):
    url: str = Field(
        ...,
        min_length=3,
        max_length=2000,
        description="The web address or link found in a suspicious message or email."
    )
    context: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Optional context (e.g., 'received via SMS claiming to update KYC')."
    )

class URLCheckResponse(BaseModel):
    risk_level: RiskLevel
    risk_score: int = Field(..., ge=0, le=100)
    url_submitted: str
    normalized_url: str
    domain: str
    protocol: str
    is_https: bool
    is_shortened: bool
    is_ip_address: bool
    is_suspicious_tld: bool
    impersonated_brand: Optional[str] = None
    indicators: List[DetectedIndicator]
    why_suspicious: List[str]
    recommended_actions: List[str]
    educational_concept: EducationalConcept
    disclaimer: str = (
        "Inspected safely without visiting the link. A low-risk result does not guarantee that the destination is safe. "
        "Always verify official bank and payment websites directly from known sources."
    )

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

class QRCheckResponse(BaseModel):
    risk_level: RiskLevel
    risk_score: int = Field(..., ge=0, le=100)
    payload_type: Literal["upi_intent", "url", "text", "unknown"]
    raw_payload_preview: str
    parsed_details: Dict[str, Any] = {}
    indicators: List[DetectedIndicator]
    why_suspicious: List[str]
    recommended_actions: List[str]
    educational_concept: EducationalConcept
    disclaimer: str = (
        "QR code inspected safely. You NEVER need to scan a QR code or enter your UPI PIN to receive money. "
        "Scanning a QR code only initiates an outgoing payment from your account."
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
