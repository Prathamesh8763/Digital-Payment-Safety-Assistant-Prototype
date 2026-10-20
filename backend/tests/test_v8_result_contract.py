import pytest
from fastapi.testclient import TestClient
from main import app
from schemas.safety import (
    TextCheckRequest,
    URLCheckRequest,
    QRCheckRequest,
    DetectedIndicator
)
from safety.engine import SafetyEngine

client = TestClient(app)
engine = SafetyEngine()

def test_v8_health_version():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["version"] in ["8.0.0", "9.0.0", "10.0.0"]

def test_v8_detected_indicator_additive_fields():
    ind = DetectedIndicator(
        id="pressure_account_threat",
        name="Pressure and account threats",
        description="Threatening to block an account creates pressure to act without checking.",
        severity="high",
        matched_clues=["blocked today"]
    )
    assert ind.code == "PRESSURE_ACCOUNT_THREAT"
    assert ind.title == "Pressure and account threats"
    assert ind.evidence_excerpt == "blocked today"
    assert ind.source_type == "message_rule"

def test_v8_safety_assessment_additive_fields():
    msg = "Your UPI account will be blocked today. Verify now to keep your account active. Link: https://secure-upi-help.example"
    res = engine.analyze_text(TextCheckRequest(text=msg))

    # Contract validation:
    assert res.reviewed_input == msg
    assert res.verification_status is not None
    assert res.analysis_id is not None
    assert res.analysis_id.startswith("REF-TXT-")
    assert res.urls is not None
    assert len(res.urls) == 1

    url_obj = res.urls[0]
    assert url_obj["display_url"] == "secure-upi-help.example"
    assert url_obj["verification_status"] == "unverified"
    assert "checks" in url_obj
    assert len(url_obj["checks"]) >= 1

    # Check unverified destination indicator was added
    has_unverified_ind = any(i.id == "unverified_url_destination" for i in res.indicators)
    assert has_unverified_ind is True

def test_v8_url_check_additive_fields():
    req = URLCheckRequest(url="https://onlinesbi.sbi/portal")
    res = engine.analyze_url(req)

    assert res.reviewed_input == "https://onlinesbi.sbi/portal"
    assert res.verification_status == "no_known_threat_found"
    assert res.analysis_id is not None
    assert res.display_url == "onlinesbi.sbi"
    assert res.checks is not None
    assert any(c["status"] == "completed" for c in res.checks)

def test_v8_qr_check_additive_fields():
    req = QRCheckRequest(payload="upi://pay?pa=merchant@upi&am=100")
    res = engine.analyze_qr(req)

    assert res.reviewed_input == "upi://pay?pa=merchant@upi&am=100"
    assert res.analysis_id is not None
    assert res.verification_status in ["flagged", "unverified"]
