import os
import time
import logging
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel

from schemas.safety import (
    TextCheckRequest,
    GuidedCheckRequest,
    SafetyAssessmentResponse,
    URLCheckRequest,
    URLCheckResponse,
    QRCheckRequest,
    QRCheckResponse,
    FeedbackRequest,
    FeedbackResponse,
    EvaluationMetrics
)
from safety.engine import SafetyEngine
from tests.evaluate_model import run_benchmark_evaluation

# Configure Privacy-Safe Logger (Never logs raw message content or credentials - FR-07/FR-10)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("safety.api")

app = FastAPI(
    title="Digital Payment Safety Assistant API",
    description="V8 Multi-Modal Payment Safety, Scam Prevention, and Uncertainty-Aware Engine",
    version="8.0.0"
)

# 1. Security Headers Middleware (FR-09/FR-11)
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# 2. Rate Limiting Middleware (Simple In-Memory Token Bucket - FR-09)
RATE_LIMIT_WINDOW = 60  # seconds
MAX_REQUESTS_PER_WINDOW = 120
client_request_history = {}

class RateLimitingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        
        # Clean expired timestamps
        history = client_request_history.get(client_ip, [])
        valid_timestamps = [ts for ts in history if now - ts < RATE_LIMIT_WINDOW]
        
        if len(valid_timestamps) >= MAX_REQUESTS_PER_WINDOW:
            logger.warning(f"Rate limit exceeded for client: {client_ip}")
            return Response(
                content='{"detail": "Rate limit exceeded. Please wait a moment before sending more requests."}',
                status_code=429,
                media_type="application/json"
            )
        
        valid_timestamps.append(now)
        client_request_history[client_ip] = valid_timestamps

        start_time = time.time()
        response: Response = await call_next(request)
        duration_ms = (time.time() - start_time) * 1000

        # Privacy-Safe Audit Log: No raw message body or passwords logged!
        if request.url.path.startswith("/api/"):
            logger.info(f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms:.1f}ms)")

        return response

app.add_middleware(RateLimitingMiddleware)

# 3. CORS setup
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
        "version": "8.0.0",
        "documentation": "/docs"
    }

@app.get("/api/health")
def health_check():
    """
    FR-10: Operational health status without leaking configuration or secrets.
    """
    return {
        "status": "healthy",
        "service": "Digital Payment Safety Assistant API",
        "version": "8.0.0",
        "uptime_state": "operational",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "feedback_entries_count": engine.feedback_service.get_feedback_count()
    }

class LegacyAnalyzeRequest(BaseModel):
    message: Optional[str] = None
    text: Optional[str] = None
    use_ai: bool = False
    language: str = "en"

@app.post("/api/analyze", response_model=SafetyAssessmentResponse)
@app.post("/analyze", response_model=SafetyAssessmentResponse)
async def analyze_message_endpoint(payload: LegacyAnalyzeRequest):
    raw_text = payload.text or payload.message
    if not raw_text or len(raw_text.strip()) < 3:
        raise HTTPException(status_code=400, detail="Please provide a message or description of at least 3 characters.")
    check_req = TextCheckRequest(
        text=raw_text.strip(),
        use_ai=payload.use_ai,
        language=payload.language
    )
    return await engine.analyze_text_with_ai_option(check_req)

@app.post("/api/check/text", response_model=SafetyAssessmentResponse)
async def check_text(payload: TextCheckRequest):
    if not payload.text or len(payload.text.strip()) < 3:
        raise HTTPException(status_code=400, detail="Please provide a message or description of at least 3 characters.")
    return await engine.analyze_text_with_ai_option(payload)

@app.post("/api/check/guided", response_model=SafetyAssessmentResponse)
def check_guided(payload: GuidedCheckRequest):
    return engine.analyze_guided(payload)

@app.post("/api/check/url", response_model=URLCheckResponse)
@app.post("/api/analyze-url", response_model=URLCheckResponse)
@app.post("/analyze-url", response_model=URLCheckResponse)
def check_url(payload: URLCheckRequest):
    return engine.analyze_url(payload)

@app.post("/api/check/qr", response_model=QRCheckResponse)
def check_qr(payload: QRCheckRequest):
    if not payload.payload or len(payload.payload.strip()) < 1:
        raise HTTPException(status_code=400, detail="QR payload cannot be empty.")
    return engine.analyze_qr(payload)

@app.post("/api/feedback", response_model=FeedbackResponse)
def submit_feedback(payload: FeedbackRequest, request: Request):
    """
    FR-04: User feedback and correction workflow.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    return engine.feedback_service.record_feedback(payload, client_ip=client_ip)

@app.get("/api/evaluation/benchmark", response_model=EvaluationMetrics)
def get_evaluation_benchmark():
    """
    FR-02: Repeatable evaluation against labeled dataset.
    """
    return run_benchmark_evaluation()

@app.get("/api/scenarios")
def get_demonstration_scenarios():
    """
    V3 Multilingual and adversarial demonstration scenarios.
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
            "id": "hinglish_kyc_threat",
            "title": "Hinglish Electricity Disconnection Threat",
            "category": "Fake KYC / Account Suspension",
            "type": "scam",
            "text": "Aapka electricity connection aaj raat 9 baje cut off kar diya jayega bill unpaid hone ki wajah se. Turant 9876543210 par call karke settle karein."
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
