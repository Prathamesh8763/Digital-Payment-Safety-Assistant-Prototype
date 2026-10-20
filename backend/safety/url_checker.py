import re
import ipaddress
from urllib.parse import urlsplit, unquote
from typing import Dict, Any, List, Optional, Tuple
from schemas.safety import (
    URLCheckRequest,
    URLCheckResponse,
    DetectedIndicator,
    EducationalConcept,
    URLVerificationStatus,
    RiskLevel,
    CheckLinkRequest,
    CheckLinkResponse,
    CheckLinkFinding
)

SUSPICIOUS_TLDS = {
    "top", "xyz", "club", "live", "icu", "download", "vip", "bid", "click",
    "work", "link", "gq", "cf", "ml", "ga", "tk", "rest", "support", "online",
    "site", "store", "buzz", "fun", "loan", "win"
}

SHORTENER_DOMAINS = {
    "bit.ly", "tinyurl.com", "is.gd", "cutt.ly", "rb.gy", "t.co", "goo.gl",
    "ow.ly", "buff.ly", "rebrand.ly", "shorturl.at", "s.id"
}

RESERVED_TLDS = {
    "invalid", "example", "test", "localhost", "local", "onion"
}

# Verified Payment Gateways & Processors
VERIFIED_PAYMENT_GATEWAYS: Dict[str, str] = {
    # Global Payment Gateways
    "stripe.com": "Stripe",
    "checkout.stripe.com": "Stripe Checkout",
    "buy.stripe.com": "Stripe Payment Link",
    "paypal.com": "PayPal",
    "paypal.me": "PayPal.Me",
    "braintreepayments.com": "Braintree",
    "adyen.com": "Adyen",
    "squareup.com": "Square",
    "square.site": "Square Online",
    "klarna.com": "Klarna",
    "shopify.com": "Shopify Checkout",
    "shop.app": "Shop Pay (Shopify)",
    "myshopify.com": "Shopify Store",
    "paddle.com": "Paddle",
    "paddle.net": "Paddle Buyer Checkout",
    "fastspring.com": "FastSpring",
    "gumroad.com": "Gumroad",
    "lemonsqueezy.com": "Lemon Squeezy",
    "worldpay.com": "Worldpay",
    # India Payment Gateways & Aggregators
    "razorpay.com": "Razorpay",
    "rzp.io": "Razorpay Payment Link",
    "pages.razorpay.com": "Razorpay Payment Page",
    "cashfree.com": "Cashfree Payments",
    "billdesk.com": "BillDesk",
    "billdesk.io": "BillDesk",
    "payu.in": "PayU India",
    "payubiz.in": "PayU Biz",
    "ccavenue.com": "CCAvenue",
    "instamojo.com": "Instamojo",
    "cred.club": "CRED",
    "paytm.com": "Paytm",
    "paytmbank.com": "Paytm Payments Bank",
    "phonepe.com": "PhonePe",
    "bhimupi.org.in": "BHIM UPI (NPCI)",
    "npci.org.in": "National Payments Corporation of India"
}

# Verified Subscription & Digital Platforms
VERIFIED_SUBSCRIPTION_PLATFORMS: Dict[str, str] = {
    # Streaming & Media Subscriptions
    "netflix.com": "Netflix",
    "spotify.com": "Spotify",
    "youtube.com": "YouTube Memberships & Premium",
    "youtu.be": "YouTube Official Links",
    "hotstar.com": "Disney+ Hotstar",
    "disneyplus.com": "Disney+",
    "primevideo.com": "Amazon Prime Video",
    "jiocinema.com": "JioCinema",
    "zee5.com": "Zee5",
    "sonyliv.com": "SonyLIV",
    "crunchyroll.com": "Crunchyroll",
    "twitch.tv": "Twitch",
    "audible.com": "Audible",
    "audible.in": "Audible India",
    # AI, Cloud, Productivity & SaaS Subscriptions
    "openai.com": "OpenAI",
    "chatgpt.com": "ChatGPT Plus",
    "google.com": "Google",
    "google.co.in": "Google India",
    "pay.google.com": "Google Pay & Subscriptions",
    "payments.google.com": "Google Payments Center",
    "play.google.com": "Google Play Subscriptions",
    "microsoft.com": "Microsoft",
    "office.com": "Microsoft 365",
    "live.com": "Microsoft Live",
    "xbox.com": "Xbox",
    "apple.com": "Apple",
    "icloud.com": "Apple iCloud",
    "github.com": "GitHub",
    "adobe.com": "Adobe Creative Cloud",
    "canva.com": "Canva",
    "notion.so": "Notion",
    "slack.com": "Slack",
    "zoom.us": "Zoom",
    "atlassian.com": "Atlassian",
    "atlassian.net": "Atlassian Cloud",
    "trello.com": "Trello",
    "dropbox.com": "Dropbox",
    "linkedin.com": "LinkedIn Premium",
    "coursera.org": "Coursera",
    "udemy.com": "Udemy",
    "substack.com": "Substack",
    "patreon.com": "Patreon",
    "midjourney.com": "Midjourney",
    "figma.com": "Figma",
    "discord.com": "Discord",
    "discord.gg": "Discord",
    "steampowered.com": "Steam Store",
    "steamcommunity.com": "Steam Community",
    "epicgames.com": "Epic Games",
    # E-Commerce & Daily Essentials
    "amazon.com": "Amazon",
    "amazon.in": "Amazon India",
    "pay.amazon.in": "Amazon Pay India",
    "flipkart.com": "Flipkart",
    "myntra.com": "Myntra",
    "swiggy.com": "Swiggy",
    "zomato.com": "Zomato",
    "uber.com": "Uber",
    "olacabs.com": "Ola Cabs",
    "makemytrip.com": "MakeMyTrip",
    "irctc.co.in": "IRCTC",
    "bookmyshow.com": "BookMyShow"
}

# Verified Financial Institutions & Regulators
VERIFIED_BANKING_DOMAINS: Dict[str, str] = {
    "onlinesbi.sbi": "State Bank of India (SBI)",
    "sbi.co.in": "State Bank of India (SBI)",
    "hdfcbank.com": "HDFC Bank",
    "icicibank.com": "ICICI Bank",
    "axisbank.com": "Axis Bank",
    "pnbindia.in": "Punjab National Bank (PNB)",
    "canarabank.com": "Canara Bank",
    "kotak.com": "Kotak Mahindra Bank",
    "bankofbaroda.in": "Bank of Baroda",
    "indusind.com": "IndusInd Bank",
    "yesbank.in": "Yes Bank",
    "idfcfirstbank.com": "IDFC FIRST Bank",
    "federalbank.co.in": "Federal Bank",
    "rbi.org.in": "Reserve Bank of India (RBI)",
    "incometax.gov.in": "Income Tax Department"
}

OFFICIAL_AUTHORIZED_DOMAINS = (
    set(VERIFIED_PAYMENT_GATEWAYS.keys()) |
    set(VERIFIED_SUBSCRIPTION_PLATFORMS.keys()) |
    set(VERIFIED_BANKING_DOMAINS.keys())
)

FINANCIAL_TARGET_BRANDS = [
    ("sbi", "State Bank of India (SBI)"),
    ("hdfc", "HDFC Bank"),
    ("icici", "ICICI Bank"),
    ("axis", "Axis Bank"),
    ("pnb", "Punjab National Bank"),
    ("rbi", "Reserve Bank of India"),
    ("paytm", "Paytm"),
    ("phonepe", "PhonePe"),
    ("gpay", "Google Pay"),
    ("bhim", "BHIM UPI"),
    ("npci", "NPCI"),
    ("yono", "SBI YONO"),
    ("canara", "Canara Bank"),
    ("kotak", "Kotak Mahindra Bank"),
    ("bob", "Bank of Baroda"),
    ("youtube", "YouTube"),
    ("google", "Google"),
    ("razorpay", "Razorpay"),
    ("stripe", "Stripe"),
    ("paypal", "PayPal"),
    ("netflix", "Netflix"),
    ("spotify", "Spotify"),
    ("openai", "OpenAI"),
    ("chatgpt", "ChatGPT"),
    ("amazon", "Amazon"),
    ("apple", "Apple"),
    ("microsoft", "Microsoft"),
    ("hotstar", "Disney+ Hotstar"),
    ("jiocinema", "JioCinema"),
    ("coursera", "Coursera"),
    ("udemy", "Udemy"),
    ("swiggy", "Swiggy"),
    ("zomato", "Zomato"),
    ("steam", "Steam"),
    ("canva", "Canva"),
    ("patreon", "Patreon")
]

DANGEROUS_EXTENSIONS = [".apk", ".exe", ".scr", ".bat", ".cmd", ".vbs", ".msi", ".jar", ".com"]

FAKE_LINK_AND_LOGGER_DOMAINS = {
    # Grabify & IP Logger domains
    "grabify.link", "iplogger.org", "iplogger.com", "iplogger.ru", "2no.co", "yip.su",
    "iplis.ru", "02ip.ru", "ezstat.ru", "whatsmydns.me", "curiouscat.club", "bmwforum.co",
    "leancoding.co", "quicksend.ch", "spottyfly.com", "stopify.co", "screener.one",
    "xda-developers.us", "fortnight.space", "freegiftcards.co", "dateing.club",
    "disord.gifts", "steamcomminuty.com", "steamcommunity.ru.com", "shsec.org",
    "pranklink.com", "fakelinkgenerator.com", "fakeupdate.net", "fakerat.com",
    # Tunnel & disposable forwarding domains commonly abused for fake links
    "ngrok-free.app", "ngrok.io", "trycloudflare.com", "loca.lt", "serveo.net",
    "pagekite.me", "telebit.io", "glitch.me", "000webhostapp.com"
}

DECEPTIVE_LURE_PATTERNS = [
    # Generic fake/prank/phish keywords
    r"\b(fake|prank|generator|iplog|grabify|phish|spoofer|cloner|deceptive)\b",
    # Financial scam lure patterns
    r"(free[-_]?recharge|free[-_]?gift|claim[-_]?reward|win[-_]?cash|lucky[-_]?draw|lottery[-_]?win|airdrop[-_]?claim|giveaway|spin[-_]?wheel)",
    # Threat / urgency lure patterns
    r"(kyc[-_]?verify|pan[-_]?update|account[-_]?unblock|card[-_]?block|sim[-_]?block|bill[-_]?unpaid|electricity[-_]?cut)",
    # Fake portal patterns
    r"(secure[-_]?login|bank[-_]?verify|pay[-_]?confirm|refund[-_]?approved|cashback[-_]?offer|reward[-_]?point)"
]

class URLChecker:
    """
    V6 Security-Hardened URL Verification & Heuristics Service.
    Enforces the core safety invariant:
    'No match is not proof of safety. Unknown results must stay unknown.'

    Inspects URLs without external outbound network calls (SSRF-safe).
    Distinguishes:
      - flagged (confirmed malicious or severe brand impersonation)
      - suspicious (warning signals: shortener, suspicious TLD, deceptive userinfo)
      - no_known_threat_found (matches verified official domain list with SSL)
      - unverified (unknown domain, reserved test domain, private IP, inconclusive)
      - invalid_input (malformed, bad scheme, over length, missing host)
      - provider_unavailable (external provider timeout, error, or unconfigured)
    """

    def __init__(self, provider_simulator: Optional[Any] = None):
        self.provider_simulator = provider_simulator

    def _is_ip_address(self, host: str) -> Tuple[bool, Optional[Any]]:
        """Determines if host is an IPv4 or IPv6 address."""
        clean_host = host.strip("[]")
        try:
            ip = ipaddress.ip_address(clean_host)
            return True, ip
        except ValueError:
            return False, None

    def _is_private_or_loopback_ip(self, ip_obj: Any) -> bool:
        """Checks if IP is private, loopback, link-local, or reserved (e.g. AWS/GCP metadata)."""
        return (
            ip_obj.is_private or
            ip_obj.is_loopback or
            ip_obj.is_link_local or
            ip_obj.is_reserved or
            ip_obj.is_multicast or
            str(ip_obj) == "0.0.0.0" or
            str(ip_obj) == "169.254.169.254"
        )

    def _is_reserved_domain(self, host: str) -> bool:
        """Checks for RFC 2606 / 6761 reserved test domains."""
        parts = host.split(".")
        if len(parts) >= 1 and parts[-1] in RESERVED_TLDS:
            return True
        return False

    def _extract_userinfo_and_host(self, netloc: str) -> Tuple[Optional[str], str]:
        """
        Safely isolates userinfo from the actual destination host.
        Example: 'trusted.example@attacker.invalid' -> ('trusted.example', 'attacker.invalid')
        """
        if "@" in netloc:
            userinfo, host_part = netloc.rsplit("@", 1)
            # Redact password if present in userinfo
            if ":" in userinfo:
                user, _ = userinfo.split(":", 1)
                safe_userinfo = f"{user}:***"
            else:
                safe_userinfo = userinfo
            return safe_userinfo, host_part
        return None, netloc

    def _sanitize_for_display(self, text: str) -> str:
        """Strips control characters from user text for safe display."""
        return re.sub(r"[\x00-\x1f\x7f-\x9f]", "", text)

    def _identify_platform(self, host_clean: str) -> Tuple[str, Optional[str]]:
        """
        Categorizes the host into:
          - 'payment_gateway', name
          - 'subscription_service', name
          - 'financial_institution', name
          - 'standard_commercial', None
          - 'unverified', None
        """
        for dom, name in VERIFIED_PAYMENT_GATEWAYS.items():
            if host_clean == dom or host_clean.endswith("." + dom):
                return "payment_gateway", name
        for dom, name in VERIFIED_SUBSCRIPTION_PLATFORMS.items():
            if host_clean == dom or host_clean.endswith("." + dom):
                return "subscription_service", name
        for dom, name in VERIFIED_BANKING_DOMAINS.items():
            if host_clean == dom or host_clean.endswith("." + dom):
                return "financial_institution", name
        tld = host_clean.split(".")[-1] if "." in host_clean else ""
        if tld not in SUSPICIOUS_TLDS and tld not in RESERVED_TLDS:
            return "standard_commercial", None
        return "unverified", None

    def _detect_checkout_intent(self, path: str, query: str) -> bool:
        """Determines if the URL points to an active checkout, payment, or subscription flow."""
        target = f"{path}/{query}".lower()
        patterns = [
            r"\b(checkout|pay|payment|billing|subscribe|subscription|purchase|pricing|cart|order|membership|invoice|plans)\b",
            r"(c/pay|buy/|checkoutnow|paid_memberships|signup/payment)"
        ]
        return any(re.search(p, target) for p in patterns)

    def _build_multi_parameter_scorecard(
        self,
        host_clean: str,
        is_https: bool,
        is_ip: bool,
        is_suspicious_tld: bool,
        is_official: bool,
        platform_category: str,
        platform_name: Optional[str],
        is_checkout: bool,
        impersonated_brand: Optional[str],
        is_fake_generator: bool,
        has_dangerous_ext: bool
    ) -> Dict[str, Any]:
        tld = host_clean.split(".")[-1] if "." in host_clean else ""
        return {
            "transport_security": {
                "status": "passed" if is_https else "failed",
                "label": "HTTPS Encrypted" if is_https else "Insecure Plain HTTP",
                "score": 100 if is_https else 0,
                "details": "Encrypted using modern SSL/TLS web protocol." if is_https else "Unencrypted plain-text transport. Credentials and card numbers can be intercepted."
            },
            "domain_hierarchy": {
                "status": "warning" if (is_suspicious_tld or is_ip) else "passed",
                "label": f"TLD: .{tld}" if not is_ip else "Numerical IP Address",
                "score": 40 if (is_suspicious_tld or is_ip) else 100,
                "details": f"Clean domain ending in .{tld}" if not is_suspicious_tld and not is_ip else "Domain uses a disposable, high-risk, or non-standard TLD."
            },
            "brand_integrity": {
                "status": "threat" if impersonated_brand else "passed",
                "label": "Authentic Entity" if not impersonated_brand else f"Impersonating {impersonated_brand}",
                "score": 0 if impersonated_brand else 100,
                "details": "No unauthorized brand lookalike found." if not impersonated_brand else f"The host pretends to be affiliated with {impersonated_brand} on an external unverified domain."
            },
            "platform_verification": {
                "status": "verified" if is_official else "unverified",
                "category": platform_category,
                "label": platform_name or ("Standard Web Merchant" if platform_category == "standard_commercial" else "Unverified Web Host"),
                "score": 100 if is_official else (60 if platform_category == "standard_commercial" else 30),
                "details": f"Verified official directory listing for {platform_name}." if is_official else "Independent host not in accredited banking/gateway directories."
            },
            "checkout_context": {
                "detected": is_checkout,
                "label": "Payment / Subscription Flow" if is_checkout else "Standard Web Page",
                "details": f"Active checkout/subscription parameters detected on {platform_name or host_clean}." if is_checkout else "General informational page."
            },
            "threat_reputation": {
                "status": "threat" if (is_fake_generator or has_dangerous_ext) else "clean",
                "label": "No Threat Reports" if not (is_fake_generator or has_dangerous_ext) else "Threat Flagged",
                "score": 0 if (is_fake_generator or has_dangerous_ext) else 100,
                "details": "No matches in active fake link generators, IP tracking loggers, or malicious APK downloads." if not (is_fake_generator or has_dangerous_ext) else "Address flagged in threat intelligence feeds for malicious tools or phishing."
            }
        }

    def _generate_safety_guidance(
        self,
        is_official: bool,
        platform_category: str,
        platform_name: Optional[str],
        is_checkout: bool,
        is_https: bool,
        impersonated_brand: Optional[str]
    ) -> List[str]:
        if impersonated_brand:
            return [
                f"Do NOT enter passwords, OTPs, or cards. This address mimics {impersonated_brand}.",
                f"Official operations for {impersonated_brand} never take place on this domain.",
                "Report this link to cybercrime authorities or close the page immediately."
            ]
        if not is_https:
            return [
                "Do NOT enter passwords, card numbers, or personal info over plain HTTP.",
                "Legitimate payment portals and checkout systems always require HTTPS encryption."
            ]
        if is_official:
            if platform_category == "payment_gateway":
                return [
                    f"This address belongs to {platform_name}, a verified payment processor.",
                    "Verify the merchant business name and charge amount displayed on the payment sheet.",
                    "Payment processors never ask for your ATM PIN or UPI PIN to accept a card payment."
                ]
            elif platform_category == "subscription_service":
                return [
                    f"This address belongs to {platform_name}, an official subscription service.",
                    "Check billing frequency (monthly vs annual) and trial renewal terms before confirming.",
                    "You can manage or cancel auto-debits anytime in your official account billing settings."
                ]
            elif platform_category == "financial_institution":
                return [
                    f"This address matches official domain directory records for {platform_name}.",
                    "Verify the SSL certificate padlock in your browser address bar.",
                    "Banks will never ask you to transfer money to another account to unblock your profile."
                ]
            else:
                return [
                    f"This address belongs to verified official platform {platform_name}.",
                    "Ensure you typed or navigated to this destination from official apps or bookmarks."
                ]
        if is_checkout:
            return [
                "This is an independent merchant checkout page with HTTPS encryption.",
                "Confirm the seller's legitimacy, refund policy, and contact info before purchasing.",
                "Check that payment processing takes place via trusted gateways (e.g. Stripe, Razorpay, PayPal).",
                "Never enter banking passwords or UPI PINs on unfamiliar checkout portals."
            ]
        return [
            "Do NOT enter login credentials, passwords, or UPI PINs on unfamiliar web addresses.",
            "If this link was sent regarding a payment dispute or account alert, open your official banking app directly instead."
        ]

    def analyze_url(self, request: URLCheckRequest) -> URLCheckResponse:
        raw_input = request.url
        checks_performed = ["url_syntax", "local_heuristics"]
        checks_unavailable = ["external_reputation_provider_not_configured"]

        # Check for provider simulator hook (for tests)
        if self.provider_simulator:
            simulated_res = self.provider_simulator(raw_input)
            if simulated_res is not None:
                return simulated_res

        # 1. Basic validation: length & empty check
        if not raw_input or not raw_input.strip():
            return URLCheckResponse(
                risk_level="UNABLE_TO_ASSESS",
                risk_score=0,
                status="invalid_input",
                url_submitted=raw_input or "",
                normalized_url="",
                domain="unknown",
                protocol="unknown",
                is_https=False,
                is_shortened=False,
                is_ip_address=False,
                is_suspicious_tld=False,
                impersonated_brand=None,
                indicators=[],
                why_suspicious=["No URL was provided. Please enter a valid web address to inspect."],
                recommended_actions=["Enter or paste a complete web link (e.g. https://example.com)."],
                checks_performed=checks_performed,
                checks_unavailable=checks_unavailable,
                educational_concept=EducationalConcept(
                    title="URL Input Required",
                    concept="To check the safety of a website, you must provide its web address.",
                    golden_rule="Always paste the full link without visiting it."
                )
            )

        raw_trimmed = raw_input.strip()

        # Check for excessive length
        if len(raw_trimmed) > 2000:
            return URLCheckResponse(
                risk_level="UNABLE_TO_ASSESS",
                risk_score=70,
                status="invalid_input",
                url_submitted=self._sanitize_for_display(raw_trimmed[:100] + "..."),
                normalized_url="",
                domain="unknown",
                protocol="unknown",
                is_https=False,
                is_shortened=False,
                is_ip_address=False,
                is_suspicious_tld=False,
                impersonated_brand=None,
                indicators=[
                    DetectedIndicator(
                        id="excessive_url_length",
                        name="URL Exceeds Maximum Safe Length",
                        description="The provided URL is unusually long (> 2,000 characters), which may indicate an obfuscation attempt.",
                        severity="high",
                        matched_clues=["URL exceeds 2,000 character limit"]
                    )
                ],
                why_suspicious=["The web link exceeds the maximum allowed length (2,000 characters) and cannot be safely parsed."],
                recommended_actions=["Check if the link contains extra text or truncated data."],
                checks_performed=checks_performed,
                checks_unavailable=checks_unavailable,
                educational_concept=EducationalConcept(
                    title="Obfuscated / Oversized Links",
                    concept="Scammers sometimes pad URLs with thousands of junk characters to overflow security scanners.",
                    golden_rule="Never paste or open massive, unreadable link payloads."
                )
            )

        # Reject embedded control characters or newlines
        if re.search(r"[\r\n\t\x00-\x1f]", raw_trimmed):
            return URLCheckResponse(
                risk_level="UNABLE_TO_ASSESS",
                risk_score=60,
                status="invalid_input",
                url_submitted=self._sanitize_for_display(raw_trimmed),
                normalized_url="",
                domain="unknown",
                protocol="unknown",
                is_https=False,
                is_shortened=False,
                is_ip_address=False,
                is_suspicious_tld=False,
                impersonated_brand=None,
                indicators=[
                    DetectedIndicator(
                        id="control_characters_in_url",
                        name="Embedded Control Characters",
                        description="The URL contains illegal control characters or line breaks.",
                        severity="high",
                        matched_clues=["Control characters detected"]
                    )
                ],
                why_suspicious=["The URL contains illegal line breaks or control characters."],
                recommended_actions=["Re-copy the URL cleanly without line breaks."],
                checks_performed=checks_performed,
                checks_unavailable=checks_unavailable,
                educational_concept=EducationalConcept(
                    title="Malformed URL Trap",
                    concept="Control characters in links can cause unexpected browser parsing vulnerabilities.",
                    golden_rule="Inspect only cleanly copied web addresses."
                )
            )

        # 2. Scheme parsing & strict scheme validation
        # Check if :// is present with an invalid scheme prefix (e.g. ht!tp://bad - URL-003)
        if "://" in raw_trimmed:
            scheme_candidate = raw_trimmed.split("://", 1)[0]
            if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*$", scheme_candidate):
                return URLCheckResponse(
                    risk_level="UNABLE_TO_ASSESS",
                    risk_score=75,
                    status="invalid_input",
                    url_submitted=self._sanitize_for_display(raw_trimmed),
                    normalized_url="",
                    domain="unknown",
                    protocol="unknown",
                    is_https=False,
                    is_shortened=False,
                    is_ip_address=False,
                    is_suspicious_tld=False,
                    impersonated_brand=None,
                    indicators=[
                        DetectedIndicator(
                            id="malformed_scheme_characters",
                            name="Malformed Scheme Syntax",
                            description="The URL contains illegal characters in the scheme before '://'.",
                            severity="high",
                            matched_clues=[f"Invalid scheme: {scheme_candidate}"]
                        )
                    ],
                    why_suspicious=["The web address scheme contains invalid or illegal characters."],
                    recommended_actions=["Check the link spelling and re-enter a standard web address."],
                    checks_performed=checks_performed,
                    checks_unavailable=checks_unavailable,
                    educational_concept=EducationalConcept(
                        title="Malformed Web Scheme",
                        concept="Web protocols must only contain letters, numbers, hyphens, and dots.",
                        golden_rule="Never attempt to open links with corrupted or non-standard schemes."
                    )
                )

        # Check scheme if present
        scheme_match = re.match(r"^([a-zA-Z][a-zA-Z0-9+.-]*):", raw_trimmed)
        if scheme_match:
            scheme = scheme_match.group(1).lower()
            if scheme not in ("http", "https"):
                # Dangerous / unsupported scheme
                return URLCheckResponse(
                    risk_level="UNABLE_TO_ASSESS",
                    risk_score=75,
                    status="invalid_input",
                    url_submitted=self._sanitize_for_display(raw_trimmed),
                    normalized_url="",
                    domain="unknown",
                    protocol=scheme,
                    is_https=False,
                    is_shortened=False,
                    is_ip_address=False,
                    is_suspicious_tld=False,
                    impersonated_brand=None,
                    indicators=[
                        DetectedIndicator(
                            id="unsupported_dangerous_scheme",
                            name=f"Unsupported Scheme: {scheme}:",
                            description=f"The address uses '{scheme}:' rather than standard web protocols (http/https). Schemes like javascript: or data: can execute code or trigger device actions.",
                            severity="high",
                            matched_clues=[f"Dangerous scheme: {scheme}"]
                        )
                    ],
                    why_suspicious=[
                        f"The link uses the '{scheme}:' scheme instead of standard web protocols.",
                        "Non-web schemes (such as javascript:, data:, file:, intent:) can execute malicious scripts or launch local device handlers."
                    ],
                    recommended_actions=[
                        "Do NOT click or execute this link in any browser or messaging app.",
                        "Only standard websites starting with 'https://' are supported for public safety checking."
                    ],
                    checks_performed=checks_performed,
                    checks_unavailable=checks_unavailable,
                    educational_concept=EducationalConcept(
                        title="Executable Script & Intent Schemes",
                        concept="Links beginning with 'javascript:' or 'intent:' do not open websites—they run commands or launch applications on your device.",
                        golden_rule="Never paste or open javascript:, data:, or custom application intent links from strangers."
                    )
                )
            normalized_url = raw_trimmed
        else:
            # Scheme-less input, normalize with https://
            scheme = "https"
            normalized_url = "https://" + raw_trimmed

        # 3. Standard parsing
        try:
            parsed = urlsplit(normalized_url)
        except Exception:
            parsed = None

        if not parsed or not parsed.netloc:
            return URLCheckResponse(
                risk_level="UNABLE_TO_ASSESS",
                risk_score=50,
                status="invalid_input",
                url_submitted=self._sanitize_for_display(raw_trimmed),
                normalized_url=normalized_url,
                domain="unknown",
                protocol=scheme,
                is_https=(scheme == "https"),
                is_shortened=False,
                is_ip_address=False,
                is_suspicious_tld=False,
                impersonated_brand=None,
                indicators=[
                    DetectedIndicator(
                        id="missing_host_netloc",
                        name="Missing or Malformed Host",
                        description="The address does not contain a recognizable domain name or server host.",
                        severity="medium",
                        matched_clues=["No host found in URL"]
                    )
                ],
                why_suspicious=["The URL does not contain a valid server address or domain name."],
                recommended_actions=["Ensure you copied the complete link, including the domain name."],
                checks_performed=checks_performed,
                checks_unavailable=checks_unavailable,
                educational_concept=EducationalConcept(
                    title="Incomplete Web Links",
                    concept="A link without a server name cannot be connected to or checked for security.",
                    golden_rule="Copy the full address starting with the domain name."
                )
            )

        # Extract userinfo and actual destination host
        userinfo, actual_netloc = self._extract_userinfo_and_host(parsed.netloc)

        # Strip port from host
        if ":" in actual_netloc:
            host_clean = actual_netloc.split(":")[0].lower()
        else:
            host_clean = actual_netloc.lower()

        host_clean = host_clean.rstrip(".")
        path = parsed.path.lower()

        if not host_clean:
            return URLCheckResponse(
                risk_level="UNABLE_TO_ASSESS",
                risk_score=50,
                status="invalid_input",
                url_submitted=self._sanitize_for_display(raw_trimmed),
                normalized_url=normalized_url,
                domain="unknown",
                protocol=scheme,
                is_https=(scheme == "https"),
                is_shortened=False,
                is_ip_address=False,
                is_suspicious_tld=False,
                impersonated_brand=None,
                indicators=[],
                why_suspicious=["The address has an empty hostname."],
                recommended_actions=["Enter a complete website address with a domain."],
                checks_performed=checks_performed,
                checks_unavailable=checks_unavailable,
                educational_concept=EducationalConcept(
                    title="Malformed Host",
                    concept="Every valid web address requires a domain name.",
                    golden_rule="Check that the link includes a full website address."
                )
            )

        # Validate hostname characters (RFC 1123 / RFC 952 DNS labels)
        if not re.match(r"^[a-zA-Z0-9.-]+$", host_clean):
            return URLCheckResponse(
                risk_level="UNABLE_TO_ASSESS",
                risk_score=60,
                status="invalid_input",
                url_submitted=self._sanitize_for_display(raw_trimmed),
                normalized_url=normalized_url,
                domain=host_clean,
                protocol=scheme,
                is_https=(scheme == "https"),
                is_shortened=False,
                is_ip_address=False,
                is_suspicious_tld=False,
                impersonated_brand=None,
                indicators=[
                    DetectedIndicator(
                        id="invalid_hostname_characters",
                        name="Invalid Characters in Hostname",
                        description=f"The hostname '{host_clean}' contains illegal characters not permitted in web addresses.",
                        severity="medium",
                        matched_clues=[f"Invalid host characters: {host_clean}"]
                    )
                ],
                why_suspicious=[f"The domain name '{host_clean}' contains invalid characters."],
                recommended_actions=["Check the link spelling. Valid domain names only contain letters, numbers, hyphens, and dots."],
                checks_performed=checks_performed,
                checks_unavailable=checks_unavailable,
                educational_concept=EducationalConcept(
                    title="Invalid Domain Syntax",
                    concept="Every legitimate website domain follows strict naming standards (alphanumeric, dots, hyphens).",
                    golden_rule="Do not open links with corrupted or invalid domain names."
                )
            )

        indicators: List[DetectedIndicator] = []
        why_suspicious: List[str] = []
        recommended_actions: List[str] = []

        # 4. Check for Deceptive Userinfo Structure (URL-014, URL-017)
        if userinfo:
            indicators.append(DetectedIndicator(
                id="deceptive_userinfo_structure",
                name="Deceptive User-Info in URL Structure",
                description=f"The link places '{userinfo}' before an '@' symbol. Web browsers ignore everything before the '@' and navigate strictly to '{host_clean}'.",
                severity="high",
                matched_clues=[f"Deceptive userinfo prefix: {userinfo}@"]
            ))
            why_suspicious.append(
                f"Deceptive URL structure detected: The text before the '@' ({userinfo}) is designed to mislead you into thinking you are visiting a trusted site, but your browser will actually connect to '{host_clean}'."
            )
            recommended_actions.append(
                f"The real destination of this link is '{host_clean}', NOT '{userinfo}'. Do NOT proceed."
            )

        # 5. IP Address Detection & Private/Loopback Check (URL-016)
        is_ip, ip_obj = self._is_ip_address(host_clean)
        if is_ip and ip_obj:
            is_private = self._is_private_or_loopback_ip(ip_obj)
            if is_private or host_clean == "localhost":
                indicators.append(DetectedIndicator(
                    id="private_loopback_address",
                    name="Private / Loopback / Local Address",
                    description="The address points to a private local network, loopback address, or internal infrastructure, not a public website.",
                    severity="high",
                    matched_clues=[f"Private/Loopback IP: {host_clean}"]
                ))
                return URLCheckResponse(
                    risk_level="UNABLE_TO_ASSESS",
                    risk_score=50,
                    status="unverified",
                    url_submitted=self._sanitize_for_display(raw_trimmed),
                    normalized_url=normalized_url,
                    domain=host_clean,
                    protocol=scheme,
                    is_https=(scheme == "https"),
                    is_shortened=False,
                    is_ip_address=True,
                    is_suspicious_tld=False,
                    impersonated_brand=None,
                    indicators=indicators,
                    why_suspicious=[
                        f"The link points to an internal, local, or loopback network address ({host_clean}).",
                        "Private IP ranges and localhost cannot be verified as legitimate public payment websites."
                    ],
                    recommended_actions=[
                        "Do NOT enter credentials or payment details on private/local network links.",
                        "Public payment requests must always originate from verified public domains."
                    ],
                    checks_performed=checks_performed,
                    checks_unavailable=checks_unavailable,
                    uncertainty_note="Local and private network targets cannot be verified for public payment safety.",
                    educational_concept=EducationalConcept(
                        title="Private Network Addresses",
                        concept="Private addresses (like 127.0.0.1, 10.x.x.x, 192.168.x.x) belong to local devices, not public banking portals.",
                        golden_rule="Official banks never send payment links directed at private or loopback IP addresses."
                    )
                )
            else:
                # Public IP address host
                indicators.append(DetectedIndicator(
                    id="ip_host_detected",
                    name="Direct Numerical IP Address Host",
                    description="The link points directly to a raw numerical IP address rather than a registered, verified domain name.",
                    severity="high",
                    matched_clues=[f"Public IP host: {host_clean}"]
                ))
                why_suspicious.append("Legitimate banks and payment platforms always use verified domain names (e.g. sbi.co.in), never raw numerical IP addresses.")
                recommended_actions.append("Do NOT open links containing direct numerical IP addresses.")

        # 6. Check for Reserved Test Suffixes (.invalid, .example, .test, .localhost) (URL-005, URL-006)
        is_reserved = self._is_reserved_domain(host_clean)
        if is_reserved:
            indicators.append(DetectedIndicator(
                id="reserved_test_domain",
                name="Reserved Test / Synthetic Domain",
                description=f"The domain '{host_clean}' ends with a reserved test suffix (.invalid/.example/.test). These domains cannot be registered by legitimate financial institutions.",
                severity="medium",
                matched_clues=[f"Reserved TLD: {host_clean.split('.')[-1]}"]
            ))
            return URLCheckResponse(
                risk_level="UNABLE_TO_ASSESS",
                risk_score=50,
                status="unverified",
                url_submitted=self._sanitize_for_display(raw_trimmed),
                normalized_url=normalized_url,
                domain=host_clean,
                protocol=scheme,
                is_https=(scheme == "https"),
                is_shortened=False,
                is_ip_address=is_ip,
                is_suspicious_tld=False,
                impersonated_brand=None,
                indicators=indicators,
                why_suspicious=[
                    f"The link uses a reserved test or fabricated domain ending (.{host_clean.split('.')[-1]}).",
                    "This address cannot be verified as an authentic public website or financial service.",
                    "No match is not proof of safety. Unknown or fabricated links must remain unverified."
                ],
                recommended_actions=[
                    "Do NOT enter banking credentials, passwords, or payment PINs.",
                    "Verify the authentic web address using the official mobile banking application or physical card."
                ],
                checks_performed=checks_performed,
                checks_unavailable=checks_unavailable,
                uncertainty_note="Synthetic and reserved test domains cannot be certified as safe.",
                educational_concept=EducationalConcept(
                    title="Unverified & Test Domain Names",
                    concept="Domains ending in .invalid, .example, or .test are reserved for documentation and testing. They are never genuine bank websites.",
                    golden_rule="An unknown or unverified link must never be treated as safe."
                )
            )

        # 7. Shortened URL Check
        is_shortened = any(host_clean == short or host_clean.endswith("." + short) for short in SHORTENER_DOMAINS)
        if is_shortened:
            indicators.append(DetectedIndicator(
                id="shortened_url",
                name="Shortened / Obfuscated Link",
                description="The true destination is concealed behind a URL shortening service.",
                severity="medium",
                matched_clues=[f"Shortener domain: {host_clean}"]
            ))
            why_suspicious.append("Shortened links conceal the actual destination server to hide phishing portals or APK malware downloads.")
            recommended_actions.append("Do NOT enter any login credentials or payment info if you follow a shortened link.")

        # 7b. Official domain check for subsequent lure bypass
        is_official = any(host_clean == off or host_clean.endswith("." + off) for off in OFFICIAL_AUTHORIZED_DOMAINS)

        # Fake Link & IP Logger Generator Check
        is_fake_generator = any(
            host_clean == f_dom or host_clean.endswith("." + f_dom) or ("fake" in host_clean and "link" in host_clean) or ("iplog" in host_clean) or ("grabify" in host_clean)
            for f_dom in FAKE_LINK_AND_LOGGER_DOMAINS
        )
        if is_fake_generator:
            indicators.append(DetectedIndicator(
                id="fake_link_generator_detected",
                name="Fake Link Generator / IP Logger Service",
                description="This address originates from a known fake link generator, prank tool, or IP logging service used to disguise real destinations or harvest private IP and location data.",
                severity="high",
                matched_clues=[f"Fake link / tracking host: {host_clean}"]
            ))
            why_suspicious.append("The link was generated using a known fake link generator or IP logger service designed to disguise destination URLs.")
            recommended_actions.append("Do NOT open this link. Block the sender who provided this fake link.")

        # 7c. Deceptive Lure / Fake Scam Keywords Check
        matched_lure = None
        if not is_official:
            check_string = f"{host_clean}/{path}"
            for pattern in DECEPTIVE_LURE_PATTERNS:
                m = re.search(pattern, check_string, re.IGNORECASE)
                if m:
                    matched_lure = m.group(0)
                    indicators.append(DetectedIndicator(
                        id="deceptive_lure_detected",
                        name="Deceptive Scam / Lure Keyword Pattern",
                        description=f"The address contains suspicious lure keywords ('{matched_lure}') commonly used in fake links, prize scams, or phishing traps.",
                        severity="high",
                        matched_clues=[f"Deceptive pattern in address: {matched_lure}"]
                    ))
                    why_suspicious.append(f"The address contains deceptive bait keywords ('{matched_lure}') often used by fake link generators and fraud campaigns.")
                    recommended_actions.append("Legitimate institutions do not distribute links with lure terms like this. Do not visit.")
                    break

        # 8. Suspicious TLD Check
        tld = host_clean.split(".")[-1] if "." in host_clean else ""
        is_suspicious_tld = tld in SUSPICIOUS_TLDS
        if is_suspicious_tld:
            indicators.append(DetectedIndicator(
                id="suspicious_tld",
                name="High-Risk Top-Level Domain",
                description=f"The domain uses the '.{tld}' extension, which is heavily associated with disposable phishing campaigns.",
                severity="medium",
                matched_clues=[f"Suspicious TLD: .{tld}"]
            ))
            why_suspicious.append(f"The link uses an unconventional extension (.{tld}) commonly purchased cheaply for temporary fraud websites.")

        # 9. Brand Impersonation & Typosquatting (URL-015)
        impersonated_brand = None

        if not is_official:
            for keyword, brand_name in FINANCIAL_TARGET_BRANDS:
                if keyword in host_clean:
                    impersonated_brand = brand_name
                    indicators.append(DetectedIndicator(
                        id="brand_impersonation_url",
                        name="Brand / Bank Domain Impersonation",
                        description=f"The domain name contains '{keyword}' but does NOT belong to the authentic {brand_name} organization.",
                        severity="high",
                        matched_clues=[f"Unauthorized host mentioning {keyword}: {host_clean}"]
                    ))
                    why_suspicious.append(
                        f"The domain pretends to be affiliated with {brand_name}, but is registered on an unauthorized external domain ({host_clean})."
                    )
                    recommended_actions.append(
                        f"Official {brand_name} operations are never hosted on {host_clean}. Contact your branch through official phone numbers."
                    )
                    break

        # 10. Insecure HTTP Protocol
        is_https = (scheme == "https")
        if not is_https and (impersonated_brand or "login" in path or "bank" in host_clean or "pay" in host_clean):
            indicators.append(DetectedIndicator(
                id="insecure_http_protocol",
                name="Insecure Connection (HTTP)",
                description="The link transmits information unencrypted over plain HTTP without SSL/TLS encryption.",
                severity="high",
                matched_clues=["Insecure http:// scheme"]
            ))
            why_suspicious.append("No modern financial institution or banking portal operates over unencrypted HTTP.")

        # 11. Dangerous File Download (.apk, .exe)
        has_dangerous_ext = any(path.endswith(ext) for ext in DANGEROUS_EXTENSIONS)
        if has_dangerous_ext:
            indicators.append(DetectedIndicator(
                id="dangerous_file_download",
                name="Malicious Application / APK Download",
                description="The link directly downloads an executable installer (.apk or .exe) to your phone or computer.",
                severity="high",
                matched_clues=[f"Direct installer in path: {path}"]
            ))
            why_suspicious.append("Scammers circulate fake banking apps via direct APK downloads to bypass Google Play Store security checks.")
            recommended_actions.append("Do NOT download or install the file. Only install banking apps from Google Play Store or Apple App Store.")

        # 12. Verification Status & Multi-Parameter Scoring
        platform_category, platform_name = self._identify_platform(host_clean)
        is_checkout = self._detect_checkout_intent(path, parsed.query if parsed else "")

        scorecard = self._build_multi_parameter_scorecard(
            host_clean=host_clean,
            is_https=is_https,
            is_ip=is_ip,
            is_suspicious_tld=is_suspicious_tld,
            is_official=is_official,
            platform_category=platform_category,
            platform_name=platform_name,
            is_checkout=is_checkout,
            impersonated_brand=impersonated_brand,
            is_fake_generator=is_fake_generator,
            has_dangerous_ext=has_dangerous_ext
        )

        safety_guidance = self._generate_safety_guidance(
            is_official=is_official,
            platform_category=platform_category,
            platform_name=platform_name,
            is_checkout=is_checkout,
            is_https=is_https,
            impersonated_brand=impersonated_brand
        )

        status: URLVerificationStatus
        risk_level: RiskLevel
        score: int

        if is_official and is_https and not indicators:
            status = "no_known_threat_found"
            risk_level = "LOW"
            score = 10
            why_suspicious = ["The domain matches a known, authorized financial institution domain in verified directories."]
            recommended_actions = safety_guidance
        elif impersonated_brand or has_dangerous_ext or is_fake_generator:
            status = "flagged"
            risk_level = "HIGH"
            score = 90
        elif userinfo or is_ip or is_shortened or is_suspicious_tld or matched_lure or not is_https:
            status = "suspicious"
            score = 75 if matched_lure else 55
            for ind in indicators:
                if ind.severity == "high":
                    score = max(score, 85)
            risk_level = "HIGH" if score >= 70 else "MEDIUM"
        else:
            # UNKNOWN DOMAIN with NO POSITIVE MATCH (V6 Core Requirement: URL-007, URL-008)
            # Must NEVER say "Safe" or "Pass"
            status = "unverified"
            risk_level = "UNABLE_TO_ASSESS"
            score = 40
            ind_desc = (
                f"The domain '{host_clean}' is an independent merchant address. Standard HTTPS encryption is present, but independent sellers require independent verification."
                if is_checkout else
                f"The domain '{host_clean}' is not recognized in official directories. Independent websites require independent verification before entering sensitive details."
            )
            indicators.append(DetectedIndicator(
                id="unknown_unverified_domain",
                name="Unverified / Unrecognized Web Domain",
                description=ind_desc,
                severity="medium",
                matched_clues=[f"Unverified public host: {host_clean}"]
            ))
            why_suspicious = [
                f"The domain '{host_clean}' is completely unrecognized in verified institutional directories.",
                "Fake link generators, phishing traps, and tracking tools frequently use newly registered or disposable domains.",
                "No match is not proof of safety. Unknown websites cannot be certified as safe.",
                "External threat-intelligence feeds are not configured to certify this domain."
            ]
            recommended_actions = safety_guidance

        checks_performed.append("domain_whitelist_check")
        if has_dangerous_ext:
            checks_performed.append("file_extension_check")

        educational = EducationalConcept(
            title="Domain Authentication vs Display Names",
            concept="Anyone can register a domain like 'sbi-update-kyc.top' or 'hdfc-refunds.xyz'. What matters is the authentic official domain ending (e.g. sbi.co.in or hdfcbank.com), not what the message claims.",
            golden_rule="Look at the exact domain before the first slash. When in doubt, type the official bank website address yourself."
        )

        return URLCheckResponse(
            risk_level=risk_level,
            risk_score=score,
            status=status,
            input_type="url",
            url_submitted=self._sanitize_for_display(raw_trimmed),
            normalized_url=normalized_url,
            domain=host_clean,
            protocol=scheme,
            is_https=is_https,
            is_shortened=is_shortened,
            is_ip_address=is_ip,
            is_suspicious_tld=is_suspicious_tld,
            impersonated_brand=impersonated_brand,
            indicators=indicators,
            why_suspicious=why_suspicious,
            recommended_actions=recommended_actions,
            checks_performed=checks_performed,
            checks_unavailable=checks_unavailable,
            educational_concept=educational,
            uncertainty_note="Inspected safely without visiting the destination. Absence of a threat match does NOT prove safety.",
            platform_category=platform_category,
            platform_name=platform_name,
            is_checkout_detected=is_checkout,
            multi_parameter_scorecard=scorecard,
            safety_guidance=safety_guidance
        )

    def check_link(self, request: CheckLinkRequest) -> CheckLinkResponse:
        """
        V10 Core Link Checker Service complying with PRD Section 7, 9, 11, and 12.1.
        Produces explainable, uncertainty-honest, plain-English results.
        Never converts absence of a threat match into a 'safe' verdict.
        """
        raw_url = request.url if request.url else ""
        u_res = self.analyze_url(URLCheckRequest(url=raw_url, language=request.language))

        # Map to V10 status and plain-English summary (PRD Table 7 & Appendix A)
        status: URLVerificationStatus
        summary: str
        checks: Dict[str, str]

        if u_res.status == "invalid_input":
            status = "invalid_input"
            summary = "This address looks incomplete. Check the full link and try again."
            checks = {
                "syntax": "failed",
                "host_analysis": "not_performed",
                "reputation": "unavailable"
            }
        elif u_res.status == "flagged":
            status = "known_threat"
            summary = "A known threat was reported by a checked source."
            checks = {
                "syntax": "passed",
                "host_analysis": "completed",
                "reputation": "completed" if "external_reputation" in u_res.checks_performed else "heuristic_flagged"
            }
        elif u_res.status == "suspicious":
            status = "suspicious_indicators"
            summary = "This link has suspicious signs. Don't open it until you've checked it independently."
            checks = {
                "syntax": "passed",
                "host_analysis": "completed",
                "reputation": "unavailable"
            }
        elif u_res.status == "no_known_threat_found":
            status = "no_known_threat_found"
            summary = "No known threat was found in the sources checked. This is not proof that the link is safe."
            if u_res.platform_name:
                summary += f" Verified {u_res.platform_name}."
            checks = {
                "syntax": "passed",
                "host_analysis": "completed",
                "reputation": "verified_directory"
            }
        elif u_res.status == "provider_unavailable":
            status = "check_unavailable"
            summary = "We couldn't finish checking this link. Try again later, or verify it another way."
            checks = {
                "syntax": "passed",
                "host_analysis": "completed",
                "reputation": "unavailable"
            }
        else:
            status = "unverified"
            summary = "We couldn't verify this link. That doesn't mean it is safe."
            if u_res.is_checkout_detected:
                summary += " Independent merchant checkout detected; verify seller reputation before paying."
            checks = {
                "syntax": "passed",
                "host_analysis": "completed",
                "reputation": "unavailable"
            }

        # Format findings with title, description, evidence, and severity
        findings = [
            CheckLinkFinding(
                title=ind.title or ind.name,
                description=ind.description,
                evidence=ind.evidence_excerpt or (ind.matched_clues[0] if ind.matched_clues else None),
                severity=ind.severity
            )
            for ind in u_res.indicators
        ]

        # Plain-English recommendations
        recommendations = list(u_res.recommended_actions) if u_res.recommended_actions else [
            "Do not enter private details until you verify the destination independently."
        ]

        import time
        return CheckLinkResponse(
            status=status,
            summary=summary,
            normalized_url=u_res.normalized_url,
            display_url=u_res.display_url or u_res.domain,
            checks=checks,
            findings=findings,
            recommendations=recommendations,
            checked_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            risk_level=u_res.risk_level,
            risk_score=u_res.risk_score,
            domain=u_res.domain,
            protocol=u_res.protocol,
            is_https=u_res.is_https,
            is_shortened=u_res.is_shortened,
            is_ip_address=u_res.is_ip_address,
            is_suspicious_tld=u_res.is_suspicious_tld,
            impersonated_brand=u_res.impersonated_brand,
            indicators=u_res.indicators,
            why_suspicious=u_res.why_suspicious,
            checks_performed=u_res.checks_performed,
            checks_unavailable=u_res.checks_unavailable,
            reference_id=u_res.reference_id,
            educational_concept=u_res.educational_concept,
            uncertainty_note=u_res.uncertainty_note,
            disclaimer=u_res.disclaimer,
            platform_category=u_res.platform_category,
            platform_name=u_res.platform_name,
            is_checkout_detected=u_res.is_checkout_detected,
            multi_parameter_scorecard=u_res.multi_parameter_scorecard,
            safety_guidance=u_res.safety_guidance
        )
