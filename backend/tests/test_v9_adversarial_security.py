"""
V9 Adversarial Security and Robustness Test Suite
Validates Section 9 (SEC-001 through SEC-030) requirements.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.safety.engine import SafetyEngine
from backend.schemas.safety import TextCheckRequest, URLCheckRequest, GuidedCheckRequest

client = TestClient(app)

def test_sec_001_xss_script_injection_message():
    """SEC-001: Script-looking string submitted as message."""
    xss_payload = "<script>alert('xss')</script><img src=x onerror=alert(1)>"
    response = client.post("/api/check/text", json={"text": xss_payload, "language": "en"})
    assert response.status_code == 200
    data = response.json()
    # The payload is stored/returned as raw reviewed_input text without execution
    assert data["reviewed_input"] == xss_payload
    # Ensure it doesn't crash or return an internal error
    assert "risk_level" in data

def test_sec_002_unsupported_url_schemes():
    """SEC-002: Paste URL with unsupported scheme (javascript:, data:, file:)."""
    for bad_scheme in ["javascript:alert(1)", "data:text/html,<html>hello</html>", "file:///etc/passwd"]:
        response = client.post("/api/check/url", json={"url": bad_scheme, "language": "en"})
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["invalid_input", "unverified"]
        assert data["risk_level"] in ["HIGH", "UNABLE_TO_ASSESS"]

def test_sec_003_url_with_credentials_in_userinfo():
    """SEC-003: URL with username/password fields before host."""
    url_with_creds = "https://admin:superSecretPassword99@evil-bank.invalid/login"
    response = client.post("/api/check/url", json={"url": url_with_creds, "language": "en"})
    assert response.status_code == 200
    data = response.json()
    # Ensure raw password does not leak in clean display
    assert "superSecretPassword99" not in data["domain"]
    assert data["status"] in ["suspicious", "flagged", "unverified"]

def test_sec_004_incomplete_or_cut_off_url():
    """SEC-004: Incomplete host or cut-off URL never receives a safe/pass verdict."""
    cut_urls = ["https://", "https://.", "https://...", "http://localhost:", "https://com"]
    for url in cut_urls:
        response = client.post("/api/check/url", json={"url": url, "language": "en"})
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["invalid_input", "unverified"]
        assert data["risk_level"] != "LOW"

def test_sec_005_reserved_test_domains():
    """SEC-005: Reserved fake domains (.invalid, .example, .test, .localhost) stay unverified."""
    for dom in ["https://fake-bank-pay.invalid", "https://secure-login.test", "https://checkout.example"]:
        response = client.post("/api/check/url", json={"url": dom, "language": "en"})
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "unverified"
        assert data["risk_level"] == "UNABLE_TO_ASSESS"

def test_sec_006_unknown_valid_domain_never_passes():
    """SEC-006: Validly formed unknown domain must remain unverified, not safe."""
    response = client.post("/api/check/url", json={"url": "https://random-unknown-pay-site-8899.com", "language": "en"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "unverified"
    assert data["risk_level"] == "UNABLE_TO_ASSESS"

def test_sec_007_multiple_urls_in_message_with_punctuation():
    """SEC-007: Multiple URLs with trailing punctuation are extracted and evaluated independently."""
    msg = "Check https://secure-upi-help.example, and also https://onlinesbi.sbi! Do not visit http://bad.invalid/."
    response = client.post("/api/check/text", json={"text": msg, "language": "en"})
    assert response.status_code == 200
    data = response.json()
    assert len(data["detected_urls"]) >= 2
    # Ensure trailing punctuation was trimmed from extracted URLs
    for u in data["detected_urls"]:
        assert not u.endswith(",")
        assert not u.endswith("!")

def test_sec_008_deceptive_subdomain_brand_spoofing():
    """SEC-008: Hostname with trusted brand in subdomain does not fool the registered domain checker."""
    deceptive = "https://onlinesbi.sbi.fake-portal-attacker.invalid/login"
    response = client.post("/api/check/url", json={"url": deceptive, "language": "en"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["suspicious", "unverified", "flagged"]
    assert data["risk_level"] != "LOW"

def test_sec_009_mixed_case_and_punycode():
    """SEC-009: Mixed case and encoded URLs normalize safely without crash."""
    for u in ["hTTps://OnLineSbi.sBi/PoRtal", "https://xn--e1afmkfd.xn--p1ai"]:
        response = client.post("/api/check/url", json={"url": u, "language": "en"})
        assert response.status_code == 200
        assert "risk_level" in response.json()

def test_sec_010_private_and_localhost_ips():
    """SEC-010: Private IPs and localhost return unverified/invalid and are never fetched."""
    for ip_url in ["http://127.0.0.1:8000", "http://169.254.169.254/latest/meta-data", "http://192.168.1.1"]:
        response = client.post("/api/check/url", json={"url": ip_url, "language": "en"})
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["unverified", "suspicious", "invalid_input"]
        assert data["risk_level"] != "LOW"

def test_sec_011_oversized_payload_rejected():
    """SEC-011: Oversized message sent directly to API is rejected with 422 or 400."""
    oversized = "A" * 3500
    response = client.post("/api/check/text", json={"text": oversized, "language": "en"})
    assert response.status_code == 422

def test_sec_012_invalid_json_and_missing_fields():
    """SEC-012: Invalid JSON and missing fields return clean 422/400 without traceback."""
    # Empty body
    res1 = client.post("/api/check/text", json={})
    assert res1.status_code == 422
    assert "Traceback" not in res1.text

    # Wrong type
    res2 = client.post("/api/check/text", json={"text": 12345})
    assert res2.status_code == 422

def test_sec_013_guided_help_api_direct_call():
    """SEC-020: Direct API call to guided endpoint validates properly."""
    res = client.post("/api/guided-help", json={
        "contact_source": "unknown_call",
        "sender_claim": "bank_alert",
        "requested_action": "share_otp_pin",
        "has_urgency_pressure": True,
        "demands_money": False,
        "asks_sensitive_data": True
    })
    assert res.status_code == 200
    data = res.json()
    assert data["risk_level"] == "HIGH"
    assert "sensitive_credential_request" in [i["id"] for i in data["indicators"]]

def test_sec_028_ordinary_message_with_word_payment():
    """SEC-028: Ordinary legitimate payment notification does not flag HIGH risk."""
    legit_msg = "Your electricity bill payment of Rs. 450 has been paid successfully at BESCOM portal."
    response = client.post("/api/check/text", json={"text": legit_msg, "language": "en"})
    assert response.status_code == 200
    data = response.json()
    # Legitimate payment alert should be LOW risk
    assert data["risk_level"] == "LOW"

def test_sec_029_urgent_message_with_unverified_url():
    """SEC-029: Message with urgency and unverified URL reports both findings distinctly."""
    mixed_msg = "Immediate action required! Verify your account today: https://unknown-support-desk.example"
    response = client.post("/api/check/text", json={"text": mixed_msg, "language": "en"})
    assert response.status_code == 200
    data = response.json()
    indicator_ids = [i["id"] for i in data["indicators"]]
    # Has message urgency and unverified url indicator
    assert "urgency_coercion" in indicator_ids or "fear_threat_manipulation" in indicator_ids
    assert "unverified_url_destination" in indicator_ids
