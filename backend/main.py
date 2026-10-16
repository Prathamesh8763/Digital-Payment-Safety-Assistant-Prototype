from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os

from schemas.safety import (
    TextCheckRequest,
    GuidedCheckRequest,
    SafetyAssessmentResponse,
    URLCheckRequest,
    URLCheckResponse,
    QRCheckRequest,
    QRCheckResponse,
    EvaluationMetrics
)
from safety.engine import SafetyEngine
from tests.evaluate_model import run_benchmark_evaluation

app = FastAPI(
    title="Digital Payment Safety Assistant API",
    description="V2 Multi-Modal Payment Safety, Scam Prevention, and URL/QR Analysis API",
    version="2.0.0"
)

# CORS setup
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = SafetyEngine()

@app.get("/")
def root():
    return {
        "service": "Digital Payment Safety Assistant API",
        "version": "2.0.0",
        "documentation": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Digital Payment Safety Assistant API",
        "version": "2.0.0"
    }

@app.post("/api/check/text", response_model=SafetyAssessmentResponse)
async def check_text(payload: TextCheckRequest):
    if not payload.text or len(payload.text.strip()) < 3:
        raise HTTPException(status_code=400, detail="Please provide a message or description of at least 3 characters.")
    return await engine.analyze_text_with_ai_option(payload)

@app.post("/api/check/guided", response_model=SafetyAssessmentResponse)
def check_guided(payload: GuidedCheckRequest):
    return engine.analyze_guided(payload)

@app.post("/api/check/url", response_model=URLCheckResponse)
def check_url(payload: URLCheckRequest):
    if not payload.url or len(payload.url.strip()) < 3:
        raise HTTPException(status_code=400, detail="Please provide a valid web link or URL.")
    return engine.analyze_url(payload)

@app.post("/api/check/qr", response_model=QRCheckResponse)
def check_qr(payload: QRCheckRequest):
    if not payload.payload or len(payload.payload.strip()) < 1:
        raise HTTPException(status_code=400, detail="QR payload cannot be empty.")
    return engine.analyze_qr(payload)

@app.get("/api/evaluation/benchmark", response_model=EvaluationMetrics)
def get_evaluation_benchmark():
    """
    Evaluates the safety engine against the labeled benchmark dataset
    and returns precision, recall, and false-positive metrics.
    """
    return run_benchmark_evaluation()

@app.get("/api/scenarios")
def get_demonstration_scenarios():
    """
    Returns the V2 expanded demonstration scenario set.
    """
    return [
        {
            "id": "fake_bank_support",
            "title": "Fake Bank Customer Care Call",
            "category": "Fake Bank / Support",
            "type": "scam",
            "text": "Someone called me saying they are from SBI Customer Care. They said my account had a fraudulent debit and asked me to share my OTP immediately to reverse it."
        },
        {
            "id": "fake_kyc_blocking",
            "title": "Threat of KYC Account Blocking",
            "category": "Fake KYC / Account Suspension",
            "type": "scam",
            "text": "Dear customer, your bank account will be blocked today within 2 hours because KYC is incomplete. Call 9876543210 or install this APK file to update immediately."
        },
        {
            "id": "fake_refund",
            "title": "Accidental Overpayment Refund Trap",
            "category": "Fake Refund Scam",
            "type": "scam",
            "text": "I received a message: 'I sent you ₹5,000 by mistake instead of ₹500. Please scan this QR code or accept the collect request to refund my money.'"
        },
        {
            "id": "prize_reward_advance_fee",
            "title": "Lottery Win Advance Fee",
            "category": "Prize / Reward Scam",
            "type": "scam",
            "text": "Congratulations! You have won ₹25,000 in the Diwali Lucky Draw. To claim your prize money, pay ₹499 registration fee first to UPI ID: winnerclaim@upi."
        },
        {
            "id": "remote_access_anydesk",
            "title": "Screen Sharing / AnyDesk Request",
            "category": "Remote Access Takeover",
            "type": "scam",
            "text": "Caller said my payment failed and told me to install AnyDesk or QuickSupport app from Play Store so they can guide me through the refund process."
        },
        {
            "id": "upi_pin_to_receive",
            "title": "Enter UPI PIN to Receive Money",
            "category": "UPI QR / Collect Scam",
            "type": "scam",
            "text": "A buyer on OLX sent me a QR code saying: 'Scan this QR code and enter your UPI PIN to receive ₹3,500 advance payment for your sofa.'"
        },
        {
            "id": "phishing_link_sms",
            "title": "Bank Phishing Link via SMS",
            "category": "Malicious Link / Phishing",
            "type": "scam",
            "text": "Click this link to update your PAN card and unfreeze your bank account: http://sbi-kyc-verify.top/login.apk"
        },
        {
            "id": "legitimate_tea_stall",
            "title": "Legitimate Local UPI Payment",
            "category": "Legitimate Transaction",
            "type": "legitimate",
            "text": "I scanned the merchant QR code at the Sharma Tea Stall and paid ₹40 using Google Pay. Received standard debit confirmation SMS from HDFC Bank."
        },
        {
            "id": "legitimate_bill_payment",
            "title": "Legitimate Electricity Bill Payment",
            "category": "Legitimate Transaction",
            "type": "legitimate",
            "text": "I opened the official PhonePe app and paid my electricity bill of ₹850. Debited from my bank account with normal transaction ID."
        }
    ]
