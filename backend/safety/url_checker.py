import re
from urllib.parse import urlparse
from typing import Dict, Any, List, Optional
from schemas.safety import URLCheckRequest, URLCheckResponse, DetectedIndicator, EducationalConcept

SUSPICIOUS_TLDS = {
    "top", "xyz", "club", "live", "icu", "download", "vip", "bid", "click", 
    "work", "link", "gq", "cf", "ml", "ga", "tk", "rest", "support", "online", "site"
}

SHORTENER_DOMAINS = {
    "bit.ly", "tinyurl.com", "is.gd", "cutt.ly", "rb.gy", "t.co", "goo.gl", 
    "ow.ly", "buff.ly", "rebrand.ly", "shorturl.at", "s.id"
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
    ("yono", "SBI YONO")
]

OFFICIAL_AUTHORIZED_DOMAINS = {
    "onlinesbi.sbi", "sbi.co.in", "hdfcbank.com", "icicibank.com", 
    "axisbank.com", "pnbindia.in", "rbi.org.in", "paytm.com", 
    "phonepe.com", "google.com", "pay.google.com", "bhimupi.org.in", "npci.org.in"
}

DANGEROUS_EXTENSIONS = [".apk", ".exe", ".scr", ".bat", ".cmd", ".vbs", ".msi"]

class URLChecker:
    """
    Safely inspects URLs without making external outbound network requests.
    Defends against SSRF, typosquatting, obfuscation, and credential phishing links.
    """

    def analyze_url(self, request: URLCheckRequest) -> URLCheckResponse:
        raw_url = request.url.strip()
        
        # Normalize protocol if omitted
        if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", raw_url):
            normalized_url = "https://" + raw_url
        else:
            normalized_url = raw_url

        try:
            parsed = urlparse(normalized_url)
        except Exception:
            parsed = None

        if not parsed or not parsed.netloc:
            # Fallback for malformed input
            return URLCheckResponse(
                risk_level="HIGH",
                risk_score=75,
                url_submitted=raw_url,
                normalized_url=normalized_url,
                domain="unknown",
                protocol="unknown",
                is_https=False,
                is_shortened=False,
                is_ip_address=False,
                is_suspicious_tld=False,
                impersonated_brand=None,
                indicators=[
                    DetectedIndicator(
                        id="malformed_url",
                        name="Malformed or Obfuscated Web Address",
                        description="The provided address cannot be parsed as a legitimate web URL.",
                        severity="high",
                        matched_clues=["Invalid URL syntax"]
                    )
                ],
                why_suspicious=["The web link has an irregular or broken format designed to bypass standard browser checks."],
                recommended_actions=["Do NOT attempt to open this link in any browser."],
                educational_concept=EducationalConcept(
                    title="Malformed Link Trap",
                    concept="Scammers often use broken or non-standard characters to deceive automated security scanners.",
                    golden_rule="Never copy-paste unrecognized web addresses."
                )
            )

        protocol = parsed.scheme.lower()
        is_https = (protocol == "https")
        host = parsed.netloc.lower().split(":")[0]  # strip port
        path = parsed.path.lower()

        indicators: List[DetectedIndicator] = []
        why_suspicious: List[str] = []
        recommended_actions: List[str] = []

        # Check 1: Raw IP Address Host
        is_ip = bool(re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", host))
        if is_ip:
            indicators.append(DetectedIndicator(
                id="ip_host_detected",
                name="Direct IP Address Host",
                description="The link points directly to a raw numerical IP address rather than a registered, verified domain name.",
                severity="high",
                matched_clues=[f"Host is raw IP: {host}"]
            ))
            why_suspicious.append("Legitimate banks and payment platforms always use verified domain names (e.g. sbi.co.in), never raw numerical IP addresses.")
            recommended_actions.append("Do NOT open links containing direct IP addresses.")

        # Check 2: Shortened URL
        is_shortened = any(host == short or host.endswith("." + short) for short in SHORTENER_DOMAINS)
        if is_shortened:
            indicators.append(DetectedIndicator(
                id="shortened_url",
                name="Shortened / Obfuscated Link",
                description="The true destination is concealed behind a URL shortening service.",
                severity="medium",
                matched_clues=[f"Shortener domain: {host}"]
            ))
            why_suspicious.append("Shortened links conceal the actual destination server to hide phishing portals or APK malware downloads.")
            recommended_actions.append("Do NOT enter any login credentials or payment info if you follow a shortened link.")

        # Check 3: Suspicious TLD
        tld = host.split(".")[-1] if "." in host else ""
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

        # Check 4: Brand Typosquatting & Impersonation
        impersonated_brand = None
        is_official = any(host == off or host.endswith("." + off) for off in OFFICIAL_AUTHORIZED_DOMAINS)

        if not is_official:
            for keyword, brand_name in FINANCIAL_TARGET_BRANDS:
                if keyword in host:
                    impersonated_brand = brand_name
                    indicators.append(DetectedIndicator(
                        id="brand_impersonation_url",
                        name="Brand / Bank Domain Impersonation",
                        description=f"The domain name contains '{keyword}' but does NOT belong to the authentic {brand_name} organization.",
                        severity="high",
                        matched_clues=[f"Unverified host mentioning {keyword}: {host}"]
                    ))
                    why_suspicious.append(f"The domain pretends to be affiliated with {brand_name}, but is registered on an unauthorized external domain ({host}).")
                    recommended_actions.append(f"Official {brand_name} operations are never hosted on {host}. Contact your branch through official phone numbers.")
                    break

        # Check 5: Insecure HTTP
        if not is_https and (impersonated_brand or "login" in path or "bank" in host or "pay" in host):
            indicators.append(DetectedIndicator(
                id="insecure_http_protocol",
                name="Insecure Connection (HTTP)",
                description="The link transmits information unencrypted over plain HTTP without SSL/TLS encryption.",
                severity="high",
                matched_clues=["Insecure http:// scheme"]
            ))
            why_suspicious.append("No modern financial institution or banking portal operates over unencrypted HTTP.")

        # Check 6: Dangerous File Download (.apk, .exe)
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

        # Risk scoring
        score = 0
        if is_official:
            score = 10
            risk_level = "LOW"
            why_suspicious = ["The domain matches a known, authorized financial institution domain."]
            recommended_actions = [
                "Verify the exact SSL padlock in your browser address bar.",
                "Ensure you typed the web address yourself rather than following an untrusted forwarded link."
            ]
        else:
            for ind in indicators:
                score += 35 if ind.severity == "high" else 20
            
            if impersonated_brand or is_ip or has_dangerous_ext:
                score = max(score, 85)
            elif is_shortened or is_suspicious_tld:
                score = max(score, 55)

            score = min(max(score, 15 if not indicators else score), 100)

            if score >= 66:
                risk_level = "HIGH"
            elif score >= 35:
                risk_level = "MEDIUM"
            else:
                risk_level = "LOW"
                if not why_suspicious:
                    why_suspicious.append("No known phishing indicators or blacklisted patterns detected in the URL structure.")
                if not recommended_actions:
                    recommended_actions.append("Always verify the web address directly in your browser before typing sensitive passwords.")

        educational = EducationalConcept(
            title="Domain Authentication vs Display Names",
            concept="Anyone can buy a domain like 'sbi-update-kyc.top' or 'hdfc-refunds.xyz'. What matters is the official domain ending (e.g., sbi.co.in or hdfcbank.com), not what the message claims.",
            golden_rule="Look at the exact domain before the first slash. When in doubt, type the official bank website address yourself."
        )

        return URLCheckResponse(
            risk_level=risk_level,
            risk_score=score,
            url_submitted=raw_url,
            normalized_url=normalized_url,
            domain=host,
            protocol=protocol,
            is_https=is_https,
            is_shortened=is_shortened,
            is_ip_address=is_ip,
            is_suspicious_tld=is_suspicious_tld,
            impersonated_brand=impersonated_brand,
            indicators=indicators,
            why_suspicious=why_suspicious,
            recommended_actions=recommended_actions,
            educational_concept=educational
        )
