import sys
import os
import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from schemas.safety import (
    TextCheckRequest, 
    GuidedCheckRequest,
    URLCheckRequest,
    QRCheckRequest
)
from safety.engine import SafetyEngine

client = TestClient(app)
engine = SafetyEngine()

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_demonstration_scenarios_endpoint():
    response = client.get("/api/scenarios")
    assert response.status_code == 200
    scenarios = response.json()
    assert len(scenarios) >= 7
    types = {s["type"] for s in scenarios}
    assert "scam" in types
    assert "legitimate" in types

# Scenario 1: Fake Bank Support requesting OTP
def test_fake_bank_support():
    text = "Someone called me saying they are from SBI customer care and asked me to share my OTP immediately."
    res = engine.analyze_text(TextCheckRequest(text=text))
    assert res.risk_level == "HIGH"
    assert res.risk_score >= 80
    assert any(ind.id == "sensitive_credential_request" for ind in res.indicators)
    assert any("OTP" in action for action in res.recommended_actions)

# Scenario 2: Fake KYC account blocking threat
def test_fake_kyc_account_blocking():
    text = "Your bank account will be blocked today unless you update KYC within 2 hours. Click here to verify."
    res = engine.analyze_text(TextCheckRequest(text=text))
    assert res.risk_level == "HIGH"
    assert any(ind.id in ["fear_threat_manipulation", "urgency_coercion"] for ind in res.indicators)

# Scenario 3: Accidental overpayment refund trick
def test_fake_refund_overpayment():
    text = "I sent you ₹5000 by mistake instead of ₹500. Please scan this QR code or accept the collect request to refund."
    res = engine.analyze_text(TextCheckRequest(text=text))
    assert res.risk_level == "HIGH"
    assert any(ind.id in ["refund_overpayment_trap", "qr_receive_trap"] for ind in res.indicators)

# Scenario 4: Prize / lottery advance fee scam
def test_prize_lottery_advance_fee():
    text = "Congratulations you won lucky draw cash prize of ₹50,000! Pay ₹500 registration fee first to claim."
    res = engine.analyze_text(TextCheckRequest(text=text))
    assert res.risk_level == "HIGH"
    assert any(ind.id == "reward_advance_fee" for ind in res.indicators)

# Scenario 5: Remote access AnyDesk coercion
def test_remote_access_anydesk():
    text = "Caller asked me to install AnyDesk app so they can help fix my failed payment."
    res = engine.analyze_text(TextCheckRequest(text=text))
    assert res.risk_level == "HIGH"
    assert res.risk_score >= 90
    assert any(ind.id == "remote_access_app" for ind in res.indicators)

# Scenario 6: UPI PIN to receive money trap
def test_upi_pin_to_receive():
    text = "Buyer told me to scan QR code and enter my UPI PIN to receive money in my bank account."
    res = engine.analyze_text(TextCheckRequest(text=text))
    assert res.risk_level == "HIGH"
    assert any(ind.id in ["qr_receive_trap", "sensitive_credential_request"] for ind in res.indicators)

# Scenario 7: Legitimate transaction comparison
def test_legitimate_tea_stall_payment():
    text = "Paid ₹40 at Sharma Tea Stall via Google Pay. Debited INR 40 from HDFC Bank account."
    res = engine.analyze_text(TextCheckRequest(text=text))
    assert res.risk_level == "LOW"
    assert res.risk_score <= 30
    assert res.is_safe_practice is True

# Scenario 8: Legitimate bill payment comparison
def test_legitimate_bill_payment():
    text = "Paid electricity bill on official app. Spent INR 700 with standard receipt."
    res = engine.analyze_text(TextCheckRequest(text=text))
    assert res.risk_level == "LOW"
    assert res.risk_score <= 30

# Scenario 9: Guided mode - High risk scenario
def test_guided_mode_high_risk():
    guided_req = GuidedCheckRequest(
        contact_source="unknown_call",
        sender_claim="bank_alert",
        requested_action="share_otp_pin",
        has_urgency_pressure=True,
        demands_money=True,
        asks_sensitive_data=True,
        additional_notes="He was shouting that my card will be blocked."
    )
    res = engine.analyze_guided(guided_req)
    assert res.risk_level == "HIGH"
    assert res.risk_score >= 85
    assert len(res.indicators) >= 2

# Scenario 10: Guided mode - Normal merchant payment
def test_guided_mode_legitimate():
    guided_req = GuidedCheckRequest(
        contact_source="in_person",
        sender_claim="normal_purchase",
        requested_action="normal_merchant_pay",
        has_urgency_pressure=False,
        demands_money=False,
        asks_sensitive_data=False
    )
    res = engine.analyze_guided(guided_req)
    assert res.risk_level == "LOW"
    assert res.risk_score <= 30

# Scenario 11: Empty input validation
def test_empty_input_validation():
    response = client.post("/api/check/text", json={"text": "  "})
    assert response.status_code == 422 or response.status_code == 400

# Scenario 12: URL Checking - Phishing typosquatting link
def test_url_check_phishing_link():
    url_req = URLCheckRequest(url="http://sbi-kyc-update-portal.top/login.apk", context="SMS notification")
    res = engine.analyze_url(url_req)
    assert res.risk_level == "HIGH"
    assert res.risk_score >= 85
    assert res.is_suspicious_tld is True
    assert res.impersonated_brand is not None

# Scenario 13: URL Checking - Official authorized bank domain
def test_url_check_official_domain():
    url_req = URLCheckRequest(url="https://onlinesbi.sbi/personal/index.html")
    res = engine.analyze_url(url_req)
    assert res.risk_level == "LOW"
    assert res.risk_score <= 25

# Scenario 14: QR Checking - UPI intent receive scam
def test_qr_check_upi_receive_trap():
    payload = "upi://pay?pa=scammer@oksbi&pn=LotteryClaim&am=2500&tn=Diwali%20Prize%20Claim"
    qr_req = QRCheckRequest(payload=payload, context="Buyer told me to scan this to receive my money")
    res = engine.analyze_qr(qr_req)
    assert res.risk_level == "HIGH"
    assert res.payload_type == "upi_intent"
    assert any(ind.id == "qr_receive_trap" for ind in res.indicators)

# Scenario 15: QR Checking - Standard merchant payment
def test_qr_check_standard_merchant():
    payload = "upi://pay?pa=grocerystore@icici&pn=DailyGrocery&am=150&cu=INR"
    qr_req = QRCheckRequest(payload=payload)
    res = engine.analyze_qr(qr_req)
    assert res.risk_level == "LOW"
    assert res.payload_type == "upi_intent"

# Scenario 16: Benchmark Evaluation Endpoint
def test_benchmark_evaluation_endpoint():
    response = client.get("/api/evaluation/benchmark")
    assert response.status_code == 200
    metrics = response.json()
    assert metrics["total_samples"] >= 15
    assert metrics["accuracy_percentage"] >= 90.0
    assert metrics["precision_percentage"] >= 90.0
    assert metrics["recall_percentage"] >= 90.0
