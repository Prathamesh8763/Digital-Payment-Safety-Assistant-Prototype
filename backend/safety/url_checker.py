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
    RiskLevel
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
    ("bob", "Bank of Baroda")
]

OFFICIAL_AUTHORIZED_DOMAINS = {
    "onlinesbi.sbi", "sbi.co.in", "hdfcbank.com", "icicibank.com", 
    "axisbank.com", "pnbindia.in", "rbi.org.in", "paytm.com", 
    "phonepe.com", "google.com", "pay.google.com", "bhimupi.org.in", 
    "npci.org.in", "canarabank.com", "kotak.com", "bankofbaroda.in"
}

DANGEROUS_EXTENSIONS = [".apk", ".exe", ".scr", ".bat", ".cmd", ".vbs", ".msi", ".jar", ".com"]

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
        is_official = any(host_clean == off or host_clean.endswith("." + off) for off in OFFICIAL_AUTHORIZED_DOMAINS)

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

        # 12. Verification Status & Scoring
        status: URLVerificationStatus
        risk_level: RiskLevel
        score: int

        if is_official and is_https and not indicators:
            status = "no_known_threat_found"
            risk_level = "LOW"
            score = 10
            why_suspicious = ["The domain matches a known, authorized financial institution domain in verified directories."]
            recommended_actions = [
                "Verify the exact SSL padlock and domain spelling in your browser address bar.",
                "Ensure you typed the address yourself rather than following an untrusted forwarded link."
            ]
        elif impersonated_brand or has_dangerous_ext:
            status = "flagged"
            risk_level = "HIGH"
            score = 90
        elif userinfo or is_ip or is_shortened or is_suspicious_tld or not is_https:
            status = "suspicious"
            score = 55
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
            indicators.append(DetectedIndicator(
                id="unknown_unverified_domain",
                name="Unverified / Unknown Web Domain",
                description=f"The domain '{host_clean}' is not recognized in official financial directories, and external threat feeds are not configured.",
                severity="medium",
                matched_clues=[f"Unverified public host: {host_clean}"]
            ))
            why_suspicious = [
                f"The domain '{host_clean}' is not recognized in official financial directories.",
                "No match is not proof of safety. Unknown, newly registered, or unlisted websites cannot be certified as safe.",
                "External threat-intelligence feeds are not configured to certify this domain."
            ]
            recommended_actions = [
                "Do NOT enter login credentials, passwords, or UPI PINs on unfamiliar web addresses.",
                "If this link was sent regarding a payment or account, open your official banking app directly instead."
            ]

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
            uncertainty_note="Inspected safely without visiting the destination. Absence of a threat match does NOT prove safety."
        )
