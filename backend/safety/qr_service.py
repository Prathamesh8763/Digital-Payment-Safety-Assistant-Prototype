from urllib.parse import urlparse, parse_qs
from typing import Dict, Any, List
from schemas.safety import QRCheckRequest, QRCheckResponse, DetectedIndicator, EducationalConcept, URLCheckRequest
from safety.url_checker import URLChecker
from safety.detector import detect_indicators_in_text

class QRService:
    """
    Safely inspects decoded QR code payloads without executing transactions or navigating to URLs.
    Handles UPI Intent URIs, web URLs, and plain-text QR payloads.
    """

    def __init__(self):
        self.url_checker = URLChecker()

    def analyze_payload(self, request: QRCheckRequest) -> QRCheckResponse:
        raw = request.payload.strip()
        indicators: List[DetectedIndicator] = []
        why_suspicious: List[str] = []
        recommended_actions: List[str] = []
        parsed_details: Dict[str, Any] = {}

        # 1. UPI Intent Scheme (e.g. upi://pay?pa=...&pn=...)
        if raw.lower().startswith("upi://pay"):
            payload_type = "upi_intent"
            try:
                parsed_url = urlparse(raw)
                query_params = parse_qs(parsed_url.query)
                parsed_details = {
                    "payee_vpa": query_params.get("pa", [""])[0],
                    "payee_name": query_params.get("pn", [""])[0],
                    "amount": query_params.get("am", [""])[0],
                    "transaction_note": query_params.get("tn", [""])[0],
                    "merchant_code": query_params.get("mc", [""])[0]
                }
            except Exception:
                parsed_details = {"raw": raw}

            payee_vpa = parsed_details.get("payee_vpa", "")
            payee_name = parsed_details.get("payee_name", "")
            amount = parsed_details.get("amount", "")
            note = parsed_details.get("transaction_note", "")

            # Core UPI Risk: QR was presented to "receive" money
            context_lower = (request.context or "").lower()
            if any(k in context_lower for k in ["receive", "get money", "credited", "refund", "claim", "prize", "buyer"]):
                indicators.append(DetectedIndicator(
                    id="qr_receive_trap",
                    name="Scan QR to Receive Money Trap",
                    description="You were told to scan this QR code to RECEIVE money, but UPI QR codes can ONLY request outgoing payments.",
                    severity="high",
                    matched_clues=["Context indicates receiving money via QR"]
                ))
                why_suspicious.append("UPI QR codes and payment requests NEVER credit money to your account. Scanning this QR code will DEDUCT money from your account.")
                recommended_actions.append("Do NOT scan this QR code or authorize the transaction in your UPI app.")

            # Note analysis
            note_lower = note.lower()
            if any(k in note_lower for k in ["refund", "cashback", "lucky", "lottery", "prize", "verification", "kyc"]):
                indicators.append(DetectedIndicator(
                    id="misleading_qr_note",
                    name="Misleading Transaction Note",
                    description=f"The QR payload note says '{note}' to mislead you into thinking it is a refund or prize.",
                    severity="high",
                    matched_clues=[f"Suspicious note: {note}"]
                ))
                why_suspicious.append(f"The QR code note ('{note}') is crafted to disguise an outgoing debit transaction as a refund or award.")

            score = 85 if indicators else 35
            risk_level = "HIGH" if indicators else "LOW"

            if not indicators:
                why_suspicious.append("This is a standard UPI merchant/person-to-person payment QR code.")
                recommended_actions.append("Only proceed if YOU intentionally intend to transfer money to the named payee.")
                recommended_actions.append(f"Verify that the payee name ('{payee_name}') and UPI ID ('{payee_vpa}') match the person or shop you are paying.")

            educational = EducationalConcept(
                title="The Golden Rule of UPI QR Codes",
                concept="A QR code is like a bill: scanning it prepares money to LEAVE your account. To receive money, someone only needs your mobile number or UPI ID — they never need you to scan anything or enter a PIN.",
                golden_rule="Scan QR = Pay Money. Enter UPI PIN = Money Deducted. You NEVER scan a QR code to receive money."
            )

        # 2. Web URL Scheme (http:// or https://)
        elif raw.lower().startswith("http://") or raw.lower().startswith("https://") or ("." in raw and not " " in raw):
            payload_type = "url"
            url_res = self.url_checker.analyze_url(URLCheckRequest(url=raw, context=request.context))
            risk_level = url_res.risk_level
            score = url_res.risk_score
            indicators = url_res.indicators
            why_suspicious = url_res.why_suspicious
            recommended_actions = url_res.recommended_actions
            educational = url_res.educational_concept
            parsed_details = {
                "destination_domain": url_res.domain,
                "protocol": url_res.protocol,
                "is_https": url_res.is_https
            }

        # 3. Plain Text Payload
        else:
            payload_type = "text"
            text_detection = detect_indicators_in_text(raw)
            score = 65 if text_detection["indicators"] else 15
            risk_level = "HIGH" if score >= 66 else ("MEDIUM" if score >= 35 else "LOW")
            indicators = [
                DetectedIndicator(
                    id=ind["id"],
                    name=ind["name"],
                    description=ind["description"],
                    severity=ind["severity"],
                    matched_clues=ind.get("matched_clues", [])
                )
                for ind in text_detection["indicators"]
            ]
            why_suspicious = ["This QR code contains unformatted text rather than a payment address."]
            recommended_actions = ["Do not open or follow any instructions encoded in this text unless you recognize the author."]
            educational = EducationalConcept(
                title="QR Code Content Inspection",
                concept="QR codes can contain arbitrary text, contacts, or script commands. Always inspect the content safely before acting on it.",
                golden_rule="Never execute unfamiliar instructions found inside a QR code."
            )

        return QRCheckResponse(
            risk_level=risk_level,
            risk_score=score,
            payload_type=payload_type,
            raw_payload_preview=raw[:300] + ("..." if len(raw) > 300 else ""),
            parsed_details=parsed_details,
            indicators=indicators,
            why_suspicious=why_suspicious,
            recommended_actions=recommended_actions,
            educational_concept=educational
        )
