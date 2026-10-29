import pytest
from fastapi.testclient import TestClient
from main import app
from schemas.safety import CheckLinkRequest, CheckLinkResponse
from safety.engine import SafetyEngine

client = TestClient(app)
engine = SafetyEngine()

# V10 Link & QR Checker Test Suite (PRD Section 15.1, 15.3, Appendix A)

def test_v10_api_check_link_valid_https():
    """URL-001: Valid HTTPS URL on known bank domain."""
    res = client.post("/api/check-link", json={"url": "https://www.onlinesbi.sbi/portal", "include_reputation": True})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "no_known_threat_found"
    assert "No known threat was found in the sources checked" in data["summary"]
    assert "not proof that the link is safe" in data["summary"]
    assert data["checks"]["syntax"] == "passed"
    assert data["checks"]["host_analysis"] == "completed"

def test_v10_api_check_link_unknown_domain():
    """URL-019: An unknown domain returns unverified, NEVER safe."""
    res = client.post("/api/check-link", json={"url": "https://random-store-unknown-example99.com/checkout"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "unverified"
    assert "We couldn't verify this link" in data["summary"]
    assert "That doesn't mean it is safe" in data["summary"]
    # Verify no false-pass
    assert data["status"] != "safe"
    assert data["status"] != "passed"

def test_v10_api_check_link_empty_and_whitespace():
    """URL-004: Empty or whitespace input returns invalid_input."""
    res = client.post("/api/check-link", json={"url": "   "})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "invalid_input"
    assert "This address looks incomplete" in data["summary"]

def test_v10_api_check_link_dangerous_scheme():
    """URL-008: Dangerous schemes (javascript:, data:, file:) return invalid_input."""
    for scheme_url in [
        "javascript:alert(1)",
        "data:text/html,<script>evil()</script>",
        "file:///etc/passwd"
    ]:
        res = client.post("/api/check-link", json={"url": scheme_url})
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "invalid_input"
        assert "This address looks incomplete" in data["summary"]

def test_v10_api_check_link_missing_host():
    """URL-005: Missing host or truncated URL."""
    res = client.post("/api/check-link", json={"url": "https://"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "invalid_input"

def test_v10_api_check_link_impersonation_flagged():
    """URL-013 & URL-020: Brand typosquatting / phishing is flagged as known_threat."""
    res = client.post("/api/check-link", json={"url": "http://sbi-kyc-update.top/login.apk"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "known_threat"
    assert "A known threat was reported by a checked source" in data["summary"]
    assert len(data["findings"]) > 0

def test_v10_api_check_link_suspicious_shortener():
    """URL-014: URL shorteners are classified as suspicious_indicators."""
    res = client.post("/api/check-link", json={"url": "https://bit.ly/secure-account"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "suspicious_indicators"
    assert "This link has suspicious signs" in data["summary"]

def test_v10_api_check_link_reserved_domain():
    """URL-015: Reserved test domains (.invalid, .test, .example) return unverified."""
    res = client.post("/api/check-link", json={"url": "https://secure-login.test"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "unverified"

def test_v10_api_check_link_private_ip_ssrf():
    """URL-016: Private IP addresses (127.0.0.1, 10.0.0.1, 192.168.1.1, metadata)."""
    for ip_url in [
        "http://127.0.0.1:8080/admin",
        "http://169.254.169.254/latest/meta-data",
        "http://192.168.1.1/router"
    ]:
        res = client.post("/api/check-link", json={"url": ip_url})
        assert res.status_code == 200
        data = res.json()
        assert data["status"] in ["unverified", "suspicious_indicators"]
        assert data["status"] != "safe"

def test_v10_api_check_link_punycode():
    """URL-012: Punycode / IDN lookalikes."""
    res = client.post("/api/check-link", json={"url": "https://xn--sbi-8ka.com/login"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["suspicious_indicators", "unverified", "known_threat"]

def test_v10_check_link_response_contract_fields():
    """Verify all required V10 contract fields per PRD Section 12.1."""
    req = CheckLinkRequest(url="https://paytm.com/recharge")
    res = engine.check_link(req)
    assert isinstance(res, CheckLinkResponse)
    assert res.status in ["no_known_threat_found", "unverified", "suspicious_indicators", "known_threat"]
    assert res.normalized_url.startswith("https://")
    assert "syntax" in res.checks
    assert "host_analysis" in res.checks
    assert "reputation" in res.checks
    assert isinstance(res.findings, list)
    assert isinstance(res.recommendations, list)
    assert res.checked_at is not None

def test_v10_api_check_fake_link_generator_detected():
    """Verify that fake link generators, IP loggers, and prank tools are flagged as high risk."""
    fake_generator_urls = [
        "https://grabify.link/track123",
        "https://iplogger.org/2aB123",
        "https://fakelinkgenerator.com/prank",
        "https://2no.co/secret-offer"
    ]
    for url in fake_generator_urls:
        res = client.post("/api/check-link", json={"url": url})
        assert res.status_code == 200
        data = res.json()
        assert data["status"] in ["known_threat", "suspicious_indicators"]
        assert data["status"] != "no_known_threat_found"
        assert data["risk_level"] in ["HIGH", "CRITICAL"]
        # Check that indicator or findings reflect the fake generator
        indicator_ids = [ind.get("id") for ind in data.get("indicators", [])]
        assert "fake_link_generator_detected" in indicator_ids or any("fake" in f.lower() or "logger" in f.lower() for f in data.get("findings", []))

def test_v10_api_check_deceptive_lure_keywords():
    """Verify that addresses containing deceptive lures/phishing bait are caught."""
    lure_urls = [
        "https://win-cash-prize.net/claim-reward",
        "https://portal-verify.in/free-recharge",
        "https://account-service.biz/kyc-verify"
    ]
    for url in lure_urls:
        res = client.post("/api/check-link", json={"url": url})
        assert res.status_code == 200
        data = res.json()
        assert data["status"] in ["known_threat", "suspicious_indicators"]
        assert data["risk_level"] in ["HIGH", "MEDIUM"]
        indicator_ids = [ind.get("id") for ind in data.get("indicators", [])]
        assert "deceptive_lure_detected" in indicator_ids or any("lure" in f.lower() or "deceptive" in f.lower() for f in data.get("findings", []))

def test_v10_api_check_genuine_youtube_and_payment_platforms():
    """Verify genuine YouTube membership and authorized payment platforms resolve to verified directory match."""
    genuine_urls = [
        "https://www.youtube.com/paid_memberships",
        "https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw/join",
        "https://payments.google.com",
        "https://razorpay.com/payment-gateway"
    ]
    for url in genuine_urls:
        res = client.post("/api/check-link", json={"url": url})
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "no_known_threat_found"
        assert data["risk_level"] == "LOW"
        assert data["checks"]["reputation"] == "verified_directory"

def test_v10_api_check_spoofed_fake_youtube_membership():
    """Verify spoofed fake domains mentioning YouTube are flagged as brand impersonation threats."""
    fake_urls = [
        "https://youtube-free-membership.xyz/claim",
        "https://youtube.fake-portal.top/login"
    ]
    for url in fake_urls:
        res = client.post("/api/check-link", json={"url": url})
        assert res.status_code == 200
        data = res.json()
        assert data["status"] in ["known_threat", "suspicious_indicators"]
        assert data["risk_level"] in ["HIGH", "CRITICAL"]
        indicator_ids = [ind.get("id") for ind in data.get("indicators", [])]
        assert "brand_impersonation_url" in indicator_ids or "suspicious_tld" in indicator_ids

def test_v10_api_check_genuine_subscriptions_and_gateways():
    """Verify that major subscription services and payment gateways resolve to verified directory match with low risk."""
    urls = [
        "https://checkout.stripe.com/c/pay/cs_live_123",
        "https://www.paypal.com/checkoutnow?token=EC-12345",
        "https://www.netflix.com/signup/payment",
        "https://www.spotify.com/in-en/purchase/offer/premium-individual/",
        "https://chatgpt.com/checkout",
        "https://openai.com/pricing",
        "https://www.hotstar.com/in/subscribe/payment",
        "https://www.patreon.com/checkout",
        "https://store.steampowered.com/checkout"
    ]
    for url in urls:
        res = client.post("/api/check-link", json={"url": url})
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "no_known_threat_found"
        assert data["risk_level"] == "LOW"
        assert data["checks"]["reputation"] == "verified_directory"
        assert data.get("platform_category") in ["payment_gateway", "subscription_service", "financial_institution"]
        assert data.get("multi_parameter_scorecard") is not None
        assert data["multi_parameter_scorecard"]["transport_security"]["status"] == "passed"

def test_v10_api_check_spoofed_subscription_services():
    """Verify that fake copycat domains targeting Netflix, Stripe, PayPal are flagged as threats."""
    fake_urls = [
        "https://netflix-subscription-free.xyz/claim",
        "https://stripe-billing-portal.top/pay",
        "https://paypal-update-account.online/login",
        "https://spotify-premium-generator.net/offer"
    ]
    for url in fake_urls:
        res = client.post("/api/check-link", json={"url": url})
        assert res.status_code == 200
        data = res.json()
        assert data["status"] in ["known_threat", "suspicious_indicators"]
        assert data["risk_level"] in ["HIGH", "CRITICAL"]

def test_v10_api_get_directory_endpoint():
    """Verify GET /api/directory returns structured platforms."""
    res = client.get("/api/directory")
    assert res.status_code == 200
    data = res.json()
    assert "payment_gateways" in data
    assert "subscription_platforms" in data
    assert "banking_institutions" in data
    assert len(data["payment_gateways"]) >= 10
    assert len(data["subscription_platforms"]) >= 15

def test_v10_api_subscription_analyze_endpoint():
    """Verify POST /api/subscriptions/analyze detects fake renewal invoice scams and provides auto-debit guides."""
    # Fake Geek Squad renewal scam
    fake_invoice = (
        "Thank you for your business. Your Geek Squad Best Buy annual subscription has been auto-renewed for $399.99. "
        "Amount debited from checking account. If you did not authorize this charge, call our toll-free helpdesk at 1-800-555-0199 immediately for refund."
    )
    res1 = client.post("/api/subscriptions/analyze", json={"text": fake_invoice})
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["is_scam_invoice"] is True
    assert data1["risk_level"] == "HIGH"
    assert "cancellation_guides" in data1
    assert "upi_autopay" in data1["cancellation_guides"]
    assert "card_emandate" in data1["cancellation_guides"]

    # Legitimate subscription note
    legit_note = "Your monthly Spotify Premium subscription of INR 119 will renew on 25th Oct. Manage your plan in account settings."
    res2 = client.post("/api/subscriptions/analyze", json={"text": legit_note})
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["is_scam_invoice"] is False
    assert data2["risk_level"] == "LOW"
