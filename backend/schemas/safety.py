from typing import List, Optional, Literal
from pydantic import BaseModel, Field

RiskLevel = Literal["LOW", "MEDIUM", "HIGH"]

class TextCheckRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=3,
        max_length=2500,
        description="The suspicious message, phone call summary, or payment situation described by the user."
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
    disclaimer: str = (
        "This safety assessment is an advisory tool designed to help you pause and verify. "
        "A low-risk score is not a guarantee of safety. Never share your UPI PIN or OTP with anyone."
    )
