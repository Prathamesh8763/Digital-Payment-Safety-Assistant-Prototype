import sys
import os
import pytest
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from schemas.safety import URLCheckRequest, URLCheckResponse, TextCheckRequest, EducationalConcept
from safety.url_checker import URLChecker
from safety.engine import SafetyEngine

client = TestClient(app)

class TestURLMatrixP0:
    """
    Automated regression suite verifying URL-001 through URL-025 from V6 PRD.
    Guarantees: 'No match is not proof of safety. Unknown results must stay unknown.'
    """

    def setup_method(self):
        self.checker = URLChecker()
        self.engine = SafetyEngine()

    def test_url_001_empty_or_whitespace_input(self):
        """URL-001: Empty or whitespace-only input -> invalid_input, ask for a URL"""
        res = self.checker.analyze_url(URLCheckRequest(url="   "))
        assert res.status == "invalid_input"
        assert res.risk_level == "UNABLE_TO_ASSESS"
        assert res.risk_level != "LOW"

        # Also via API
        response = client.post("/api/check/url", json={"url": "   "})
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "invalid_input"
        assert data["risk_level"] == "UNABLE_TO_ASSESS"

    def test_url_002_https_with_no_host(self):
        """URL-002: https:// with no host -> invalid_input"""
        res = self.checker.analyze_url(URLCheckRequest(url="https://"))
        assert res.status == "invalid_input"
        assert res.risk_level != "LOW"

    def test_url_003_malformed_scheme(self):
        """URL-003: Malformed scheme such as ht!tp://bad -> invalid_input"""
        res = self.checker.analyze_url(URLCheckRequest(url="ht!tp://bad"))
        assert res.status == "invalid_input"
        assert res.risk_level != "LOW"

    def test_url_004_unsupported_scheme_javascript(self):
        """URL-004: Unsupported scheme such as javascript:alert(1) -> invalid_input; no execution"""
        res = self.checker.analyze_url(URLCheckRequest(url="javascript:alert(1)"))
        assert res.status == "invalid_input"
        assert res.risk_level != "LOW"
        assert any("javascript:" in reason or "Unsupported" in reason for reason in res.why_suspicious)

    def test_url_005_made_up_payment_check_invalid(self):
        """URL-005: https://made-up-payment-check.invalid/login -> unverified/test-reserved host, clear guidance"""
        res = self.checker.analyze_url(URLCheckRequest(url="https://made-up-payment-check.invalid/login"))
        assert res.status == "unverified"
        assert res.risk_level == "UNABLE_TO_ASSESS"
        assert res.risk_level != "LOW"
        assert any(".invalid" in r for r in res.why_suspicious)

    def test_url_006_fake_bank_verify_example(self):
        """URL-006: https://fake-bank-verify.example/confirm -> unverified/test domain, not low/pass"""
        res = self.checker.analyze_url(URLCheckRequest(url="https://fake-bank-verify.example/confirm"))
        assert res.status == "unverified"
        assert res.risk_level == "UNABLE_TO_ASSESS"
        assert res.risk_level != "LOW"

    def test_url_007_syntactically_valid_unknown_domain(self):
        """URL-007: Syntactically valid unknown domain with no reputation match -> unverified, never Pass/Safe"""
        res = self.checker.analyze_url(URLCheckRequest(url="https://unknown-random-payment-portal-999.com/pay"))
        assert res.status == "unverified"
        assert res.risk_level == "UNABLE_TO_ASSESS"
        assert res.risk_level != "LOW"
        assert any("No match is not proof of safety" in r for r in res.why_suspicious)

    def test_url_008_cut_url_mid_path(self):
        """URL-008: URL cut mid-path but still parseable -> unverified, does not invent missing suffix"""
        res = self.checker.analyze_url(URLCheckRequest(url="https://unverified-service-portal.com/auth/lo"))
        assert res.status == "unverified"
        assert res.risk_level != "LOW"

    def test_url_009_provider_not_configured(self):
        """URL-009: Provider not configured -> unverified with checks_unavailable"""
        res = self.checker.analyze_url(URLCheckRequest(url="https://obscure-test-portal.org/login"))
        assert res.status == "unverified"
        assert "external_reputation_provider_not_configured" in res.checks_unavailable

    def test_url_010_provider_timeout_simulation(self):
        """URL-010: Provider timeout -> provider_unavailable/unverified, not Low/Pass"""
        def timeout_sim(url):
            return URLCheckResponse(
                risk_level="UNABLE_TO_ASSESS",
                risk_score=50,
                status="provider_unavailable",
                url_submitted=url,
                normalized_url=url,
                domain="timeout.test",
                protocol="https",
                is_https=True,
                is_shortened=False,
                is_ip_address=False,
                is_suspicious_tld=False,
                indicators=[],
                why_suspicious=["External reputation service timed out. Check could not be completed."],
                recommended_actions=["Retry the check or verify through official bank channels."],
                checks_unavailable=["reputation_provider_timeout"],
                educational_concept=EducationalConcept(
                    title="Provider Unavailable",
                    concept="When verification feeds time out, safety cannot be assumed.",
                    golden_rule="Never treat a service timeout as proof of safety."
                )
            )

        sim_checker = URLChecker(provider_simulator=timeout_sim)
        res = sim_checker.analyze_url(URLCheckRequest(url="https://timeout.test/action"))
        assert res.status == "provider_unavailable"
        assert res.risk_level == "UNABLE_TO_ASSESS"
        assert res.risk_level != "LOW"

    def test_url_011_provider_http_error_simulation(self):
        """URL-011: Provider HTTP 429/5xx -> controlled unavailable state and retry guidance"""
        def error_sim(url):
            return URLCheckResponse(
                risk_level="UNABLE_TO_ASSESS",
                risk_score=50,
                status="provider_unavailable",
                url_submitted=url,
                normalized_url=url,
                domain="error.test",
                protocol="https",
                is_https=True,
                is_shortened=False,
                is_ip_address=False,
                is_suspicious_tld=False,
                indicators=[],
                why_suspicious=["External reputation service returned HTTP 429 rate limit."],
                recommended_actions=["Pause briefly and try checking again."],
                checks_unavailable=["reputation_provider_rate_limited"],
                educational_concept=EducationalConcept(
                    title="Temporary Provider Error",
                    concept="Rate limits prevent external verification from running.",
                    golden_rule="Wait and retry; never assume unverified links are safe."
                )
            )

        sim_checker = URLChecker(provider_simulator=error_sim)
        res = sim_checker.analyze_url(URLCheckRequest(url="https://error.test/action"))
        assert res.status == "provider_unavailable"
        assert res.risk_level == "UNABLE_TO_ASSESS"

    def test_url_012_provider_positive_threat_or_apk(self):
        """URL-012: Direct APK download -> flagged / HIGH"""
        res = self.checker.analyze_url(URLCheckRequest(url="http://sbi-kyc-service.top/update.apk"))
        assert res.status == "flagged"
        assert res.risk_level == "HIGH"
        assert res.risk_score >= 85

    def test_url_013_official_domain_valid_negative(self):
        """URL-013: Official bank domain with HTTPS -> no_known_threat_found in checked sources"""
        res = self.checker.analyze_url(URLCheckRequest(url="https://onlinesbi.sbi/portal/login"))
        assert res.status == "no_known_threat_found"
        assert res.risk_level == "LOW"
        assert res.risk_score <= 15
        assert "authorized financial institution domain" in res.why_suspicious[0]

    def test_url_014_userinfo_deceptive_structure(self):
        """URL-014: trusted.example@attacker.invalid -> host parsed as attacker.invalid, flags misleading userinfo"""
        res = self.checker.analyze_url(URLCheckRequest(url="https://sbi.co.in@evil-phishing-host.xyz/login"))
        assert res.domain == "evil-phishing-host.xyz"
        assert res.status in ("flagged", "suspicious")
        assert any(ind.id == "deceptive_userinfo_structure" for ind in res.indicators)
        assert res.risk_level == "HIGH"

    def test_url_015_subdomain_brand_impersonation(self):
        """URL-015: bank.example.attacker.invalid -> identifies unauthorized host mentioning brand"""
        res = self.checker.analyze_url(URLCheckRequest(url="https://sbi.verify-kyc-alert.top/login"))
        assert res.status == "flagged"
        assert res.risk_level == "HIGH"
        assert res.impersonated_brand is not None

    def test_url_016_localhost_and_private_ip_addresses(self):
        """URL-016: localhost, loopback, private IP -> unverified / UNABLE_TO_ASSESS, never fetch"""
        for local_target in ["http://localhost:8080/test", "http://127.0.0.1/admin", "http://192.168.1.1/pay", "http://169.254.169.254/meta"]:
            res = self.checker.analyze_url(URLCheckRequest(url=local_target))
            assert res.status == "unverified"
            assert res.risk_level == "UNABLE_TO_ASSESS"
            assert res.risk_level != "LOW"

    def test_url_017_userinfo_credentials_redacted(self):
        """URL-017: URL contains userinfo (user:pass@host) -> flag structure, never leak credentials"""
        res = self.checker.analyze_url(URLCheckRequest(url="https://admin:superSecret123@suspicious-portal.xyz/pay"))
        assert "superSecret123" not in str(res.why_suspicious)
        assert "superSecret123" not in str(res.indicators)
        assert res.status in ("flagged", "suspicious")

    def test_url_018_idn_unicode_lookalike_normalization(self):
        """URL-018: Host normalization handles safe parsing without crash"""
        res = self.checker.analyze_url(URLCheckRequest(url="https://xn--e1afmkfd.xn--p1ai/test"))
        assert res.status in ("unverified", "suspicious", "flagged")
        assert res.risk_level != "LOW"

    def test_url_019_oversized_url_limit(self):
        """URL-019: URL exceeding 2000 characters -> rejected with controlled invalid_input"""
        oversized = "https://example.com/path?" + ("a" * 2500)
        res = self.checker.analyze_url(URLCheckRequest(url=oversized))
        assert res.status == "invalid_input"
        assert res.risk_level == "UNABLE_TO_ASSESS"

    def test_url_020_tracking_token_in_query(self):
        """URL-020: Query parameters handled safely without crashing"""
        res = self.checker.analyze_url(URLCheckRequest(url="https://hdfcbank.com/portal?auth_token=sensitive_token_999"))
        assert res.domain == "hdfcbank.com"
        assert res.status == "no_known_threat_found"

    def test_url_021_extract_url_with_trailing_punctuation(self):
        """URL-021: Trailing sentence punctuation stripped from extracted message URLs"""
        msg = "Please confirm your payment at https://onlinesbi.sbi/confirm. Do it now!"
        resp = self.engine.analyze_text(TextCheckRequest(text=msg))
        assert "https://onlinesbi.sbi/confirm" in resp.detected_urls
        assert "https://onlinesbi.sbi/confirm." not in resp.detected_urls

    def test_url_022_multiple_distinct_urls_in_message(self):
        """URL-022: Multiple distinct URLs extracted and listed safely"""
        msg = "First visit https://hdfcbank.com and if failed then try https://sbi.co.in immediately."
        resp = self.engine.analyze_text(TextCheckRequest(text=msg))
        assert len(resp.detected_urls) == 2
        assert "https://hdfcbank.com" in resp.detected_urls
        assert "https://sbi.co.in" in resp.detected_urls

    def test_url_023_domain_only_input_normalized(self):
        """URL-023: Domain-only input secure-pay.example -> normalized with https://, test domain remains unverified"""
        res = self.checker.analyze_url(URLCheckRequest(url="secure-pay.example"))
        assert res.normalized_url == "https://secure-pay.example"
        assert res.status == "unverified"
        assert res.risk_level == "UNABLE_TO_ASSESS"

    def test_url_024_known_benign_fixture(self):
        """URL-024: Known official benign fixture https://hdfcbank.com returns no_known_threat_found with caveat"""
        res = self.checker.analyze_url(URLCheckRequest(url="https://hdfcbank.com"))
        assert res.status == "no_known_threat_found"
        assert res.risk_level == "LOW"
        assert "Absence of a threat match does NOT prove safety" in res.uncertainty_note

    def test_url_025_unexpected_exception_safety(self):
        """URL-025: Malformed input that might break normal parsers falls back safely, never passes"""
        res = self.checker.analyze_url(URLCheckRequest(url="http://[::invalid-ipv6]:badport/path"))
        assert res.status in ("invalid_input", "unverified")
        assert res.risk_level != "LOW"


class TestMessageRegressionMatrix:
    """
    Automated regression suite for MSG-001 through MSG-010 from V6 PRD.
    """

    def setup_method(self):
        self.engine = SafetyEngine()

    def test_msg_001_otp_request_and_urgency(self):
        """MSG-001: OTP request + urgent account-block threat -> HIGH risk"""
        resp = self.engine.analyze_text(TextCheckRequest(
            text="Dear customer, your bank account will be blocked today within 2 hours. Share your OTP immediately to verify."
        ))
        assert resp.risk_level == "HIGH"
        assert resp.risk_score >= 80

    def test_msg_002_salary_credited_notification(self):
        """MSG-002: Normal salary credited notification -> LOW risk"""
        resp = self.engine.analyze_text(TextCheckRequest(
            text="Your account has been credited with INR 45,000 towards salary for October. Available balance INR 65,000."
        ))
        assert resp.risk_level == "LOW"
        assert resp.risk_score <= 25

    def test_msg_003_verify_immediately_isolated(self):
        """MSG-003: 'Verify your account immediately' with no secrets asked -> MEDIUM urgency warning"""
        resp = self.engine.analyze_text(TextCheckRequest(
            text="Please verify your account immediately to keep services active."
        ))
        assert resp.risk_level in ("MEDIUM", "HIGH")

    def test_msg_004_request_to_share_upi_pin(self):
        """MSG-004: Request to share UPI PIN/password -> HIGH risk credential warning"""
        resp = self.engine.analyze_text(TextCheckRequest(
            text="Enter your secret UPI PIN to claim ₹5,000 cash prize right now."
        ))
        assert resp.risk_level == "HIGH"
        assert any(ind.id in ("sensitive_credential_request", "qr_receive_trap", "reward_advance_fee") for ind in resp.indicators)

    def test_msg_005_ordinary_conversation_with_payment(self):
        """MSG-005: Ordinary conversation with word 'payment' -> not high risk"""
        resp = self.engine.analyze_text(TextCheckRequest(
            text="I paid ₹40 for tea at Sharma Stall using Google Pay yesterday."
        ))
        assert resp.risk_level == "LOW"

    def test_msg_006_urgent_message_with_url(self):
        """MSG-006: Urgent message with URL -> message findings and extracted URLs separated"""
        resp = self.engine.analyze_text(TextCheckRequest(
            text="Account suspended! Visit http://sbi-kyc-verify.top/login.apk immediately to reactivate."
        ))
        assert resp.risk_level == "HIGH"
        assert len(resp.detected_urls) == 1
        assert "http://sbi-kyc-verify.top/login.apk" in resp.detected_urls
        assert len(resp.url_assessments) == 1
        assert resp.url_assessments[0]["status"] == "flagged"

    def test_msg_007_message_with_no_url(self):
        """MSG-007: Message with no URL -> detected_urls is empty"""
        resp = self.engine.analyze_text(TextCheckRequest(
            text="Someone called asking for my credit card CVV over the phone."
        ))
        assert resp.detected_urls == []
        assert resp.url_assessments == []

    def test_msg_008_message_with_multiple_urls(self):
        """MSG-008: Message with multiple URLs -> all extracted"""
        resp = self.engine.analyze_text(TextCheckRequest(
            text="Check https://onlinesbi.sbi or alternatively use https://sbi.co.in for official banking."
        ))
        assert len(resp.detected_urls) == 2

    def test_msg_009_empty_or_too_short_input_via_api(self):
        """MSG-009: Empty or undersized input -> HTTP 400"""
        response = client.post("/api/analyze", json={"message": "hi"})
        assert response.status_code == 400

    def test_msg_010_html_script_untrusted_input(self):
        """MSG-010: Untrusted HTML/script content treated safely as text"""
        resp = self.engine.analyze_text(TextCheckRequest(
            text="<script>alert('xss')</script> Your account will be closed today unless you share OTP."
        ))
        assert resp.risk_level == "HIGH"
        assert "<script>" in resp.summary or len(resp.why_suspicious) > 0


class TestAPIContractV6:
    """
    Verifies backward compatibility and V6 additive contract endpoints.
    """

    def test_post_analyze_legacy_field_compatibility(self):
        """POST /analyze retains risk_level, reasons, recommendation, and adds status, detected_urls"""
        response = client.post("/analyze", json={
            "message": "Dear customer, your bank account is blocked. Share OTP immediately."
        })
        assert response.status_code == 200
        data = response.json()
        # Required core fields
        assert "risk_level" in data
        assert "reasons" in data
        assert "recommendation" in data
        assert "detected_urls" in data
        assert "checks_performed" in data
        assert isinstance(data["reasons"], list)
        assert isinstance(data["recommendation"], str)

    def test_post_analyze_url_contract(self):
        """POST /analyze-url accepts URLCheckRequest and returns structured URLCheckResponse"""
        response = client.post("/analyze-url", json={
            "url": "https://made-up-payment-check.invalid/login"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "unverified"
        assert data["risk_level"] == "UNABLE_TO_ASSESS"
        assert data["domain"] == "made-up-payment-check.invalid"
        assert "checks_performed" in data
        assert "checks_unavailable" in data
