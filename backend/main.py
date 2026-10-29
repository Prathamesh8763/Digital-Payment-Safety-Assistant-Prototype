import os
import re
import time
import logging
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel, Field

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
    EvaluationMetrics,
    CheckLinkRequest,
    CheckLinkResponse
)
from safety.engine import SafetyEngine
from tests.evaluate_model import run_benchmark_evaluation

# Configure Privacy-Safe Logger (Never logs raw message content or credentials - FR-07/FR-10)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("safety.api")

app = FastAPI(
    title="Digital Payment Safety Assistant API",
    description="V10 Link & QR Safety, Scam Prevention, and Uncertainty-Aware Engine",
    version="10.0.0"
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
        "version": "10.0.0",
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
        "version": "10.0.0",
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
@app.post("/api/guided-help", response_model=SafetyAssessmentResponse)
@app.post("/guided-help", response_model=SafetyAssessmentResponse)
def check_guided(payload: GuidedCheckRequest):
    return engine.analyze_guided(payload)

@app.post("/api/check-link", response_model=CheckLinkResponse)
@app.post("/check-link", response_model=CheckLinkResponse)
def check_link_endpoint(payload: CheckLinkRequest):
    return engine.check_link(payload)

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

class SubscriptionCheckRequest(BaseModel):
    text: str = Field(..., min_length=3, max_length=5000)
    service_name: Optional[str] = None
    billing_frequency: Optional[str] = "monthly"
    amount: Optional[float] = None
    language: str = "en"

@app.get("/api/directory")
def get_verified_directory():
    """Returns directory of verified payment gateways, subscription services, and banking institutions."""
    from safety.url_checker import VERIFIED_PAYMENT_GATEWAYS, VERIFIED_SUBSCRIPTION_PLATFORMS, VERIFIED_BANKING_DOMAINS
    gw_list = [{"domain": k, "name": v, "category": "payment_gateway"} for k, v in VERIFIED_PAYMENT_GATEWAYS.items()]
    sub_list = [{"domain": k, "name": v, "category": "subscription_platform"} for k, v in VERIFIED_SUBSCRIPTION_PLATFORMS.items()]
    bank_list = [{"domain": k, "name": v, "category": "bank"} for k, v in VERIFIED_BANKING_DOMAINS.items()]

    return {
        "status": "success",
        "gateways": gw_list,
        "subscriptions": sub_list,
        "banks": bank_list,
        "payment_gateways": gw_list,
        "subscription_platforms": sub_list,
        "banking_institutions": bank_list
    }

@app.post("/api/subscriptions/analyze")
def analyze_subscription_endpoint(payload: SubscriptionCheckRequest):
    """
    Analyzes subscription renewal emails, messages, and invoices for fake renewal traps and auto-debit risks.
    """
    text_lower = payload.text.lower()
    indicators = []
    why_suspicious = []

    fake_invoice_brands = ["geek squad", "norton", "mcafee", "paypal invoice", "best buy", "windows defender", "apple bill"]
    matched_brand = next((b for b in fake_invoice_brands if b in text_lower), None)

    has_call_to_cancel = bool(re.search(r"\b(call\s+(us|now|helpdesk|toll[- ]?free|support)|reach\s+us\s+at|\+?1?[- ]?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4})\b", text_lower))
    has_refund_claim = bool(re.search(r"\b(refund|dispute|cancel\s+(within|immediately|order)|auto[- ]?renewed|charged\s*[$₹]\s*\d+)\b", text_lower))
    has_remote_access = bool(re.search(r"\b(anydesk|teamviewer|quicksupport|ultraviewer|screen\s+share)\b", text_lower))

    is_scam_invoice = False
    if matched_brand and (has_call_to_cancel or has_refund_claim):
        is_scam_invoice = True
        indicators.append({
            "id": "fake_subscription_invoice",
            "title": "Fake Subscription Renewal / Refund Trap",
            "severity": "high",
            "description": f"The message mimics an automated subscription renewal from {matched_brand.title()} asking you to call a number for a refund or cancellation."
        })
        why_suspicious.append(f"Scammers send fake {matched_brand.title()} invoices claiming large sums (e.g. $299 to $499) were charged, baiting victims into calling fake support lines.")

    if has_remote_access:
        is_scam_invoice = True
        indicators.append({
            "id": "remote_access_subscription_scam",
            "title": "Remote Access Takeover Request",
            "severity": "high",
            "description": "The communication requests you to install remote control software (AnyDesk, TeamViewer) to process your refund."
        })
        why_suspicious.append("Legitimate subscription providers (Netflix, Spotify, Apple, Google) NEVER request remote access to your computer or phone to cancel charges.")

    risk_level = "HIGH" if is_scam_invoice else "LOW"

    cancellation_guides = {
        "upi_autopay": [
            "Open your UPI App (Google Pay / PhonePe / Paytm / BHIM).",
            "Go to Profile → 'AutoPay' or 'Recurring Payments'.",
            "Find the active mandate and tap 'Pause' or 'Cancel AutoPay'.",
            "Enter your UPI PIN to authenticate mandate cancellation."
        ],
        "card_emandate": [
            "Log in to your bank's official netbanking or mobile app.",
            "Navigate to 'Cards' → 'Manage Standing Instructions / e-Mandates'.",
            "View all registered merchant subscriptions.",
            "Select the unwanted subscription and click 'Cancel / Modify Mandate'."
        ],
        "google_play": [
            "Open the Google Play Store app on your Android device.",
            "Tap your profile icon in top right → 'Payments & subscriptions' → 'Subscriptions'.",
            "Select the subscription you want to cancel.",
            "Tap 'Cancel subscription' and follow the on-screen instructions."
        ],
        "apple_app_store": [
            "Open the Settings app on your iPhone or iPad.",
            "Tap your name at the top → 'Subscriptions'.",
            "Tap the subscription you want to manage.",
            "Tap 'Cancel Subscription'."
        ],
        "paypal": [
            "Log in to your PayPal account at paypal.com.",
            "Go to Settings (gear icon) → 'Payments'.",
            "Click 'Manage Automatic Payments'.",
            "Select the merchant and click 'Cancel' to stop future debits."
        ]
    }

    threat_level = "scam_impersonation" if is_scam_invoice else ("suspicious_renewal" if (has_call_to_cancel or has_refund_claim) else "safe")
    platform_identified = matched_brand.title() if matched_brand else None
    confidence = "HIGH" if (matched_brand and (has_call_to_cancel or has_refund_claim)) else ("MEDIUM" if is_scam_invoice else "LOW")
    actionable_steps = [
        "Never call phone numbers printed on unrequested invoice emails.",
        "Do NOT install AnyDesk, TeamViewer, or screen-sharing software.",
        "Verify your bank account or card statement directly via your official bank app.",
        "To cancel a genuine subscription, visit the official website or app settings directly."
    ]

    return {
        "is_scam_invoice": is_scam_invoice,
        "threat_level": threat_level,
        "platform_identified": platform_identified,
        "confidence": confidence,
        "risk_level": risk_level,
        "risk_score": 85 if is_scam_invoice else 15,
        "summary": (
            "⚠️ High-Risk Subscription Scam Detected: This message displays classic signs of a fake renewal invoice designed to trick you into calling a fraudulent refund helpline."
            if is_scam_invoice else
            "✅ No obvious subscription scam indicators detected in this notification. Follow official cancellation steps if you wish to stop recurring charges."
        ),
        "indicators": indicators,
        "warning_signals": why_suspicious,
        "why_suspicious": why_suspicious,
        "cancellation_guides": cancellation_guides,
        "recommended_actions": actionable_steps,
        "actionable_steps": actionable_steps
    }

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


def free_port_if_in_use(port: int = 8000, host: str = "127.0.0.1") -> bool:
    """Detects and frees any stale process holding the server port to prevent socket binding errors."""
    import socket
    import subprocess
    import sys

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        if s.connect_ex((host, port)) != 0:
            return True  # Port is free

    logger.warning(f"Port {port} is occupied. Attempting to free port for clean startup...")
    try:
        if sys.platform == "win32":
            output = subprocess.check_output(f"netstat -ano | findstr :{port}", shell=True, text=True)
            for line in output.strip().splitlines():
                parts = line.split()
                if len(parts) >= 5 and parts[1].endswith(f":{port}"):
                    pid = parts[-1]
                    if pid != str(os.getpid()) and pid != "0":
                        logger.info(f"Terminating stale process holding port {port} (PID: {pid})")
                        subprocess.run(f"taskkill /F /PID {pid}", shell=True, capture_output=True)
                        time.sleep(0.5)
        else:
            subprocess.run(f"fuser -k {port}/tcp", shell=True, capture_output=True)
    except Exception as exc:
        logger.warning(f"Could not automatically free port {port}: {exc}")
    return True


if __name__ == "__main__":
    import uvicorn
    free_port_if_in_use(8000)
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

