import io
import re
from urllib.parse import urlparse, parse_qs, unquote
from typing import Dict, Any, List, Optional
from PIL import Image
import zxingcpp

from schemas.safety import (
    QRCheckRequest,
    QRCheckResponse,
    DetectedIndicator,
    EducationalConcept,
    URLCheckRequest,
    RiskLevel
)
from safety.url_checker import URLChecker
from safety.detector import detect_indicators_in_text

# Set safe decompression limits against image bomb denial-of-service
Image.MAX_IMAGE_PIXELS = 10_000_000

# Known brands frequently impersonated in Indian digital payment scams
KNOWN_BRANDS = [
    "amazon", "flipkart", "phonepe", "paytm", "gpay", "googlepay",
    "bhim", "sbi", "hdfc", "icici", "axis", "kotak", "pnb", "bob",
    "airtel", "jio", "bescom", "mahadiscom", "tatapower", "adani",
    "electricity", "irctc", "ola", "uber", "zomato", "swiggy", "olx"
]

# Scam bait / deceptive operational keywords in VPA handles
SCAM_VPA_KEYWORDS = [
    "refund", "cashback", "support", "care", "helpline", "helpdesk",
    "customercare", "tollfree", "kyc", "verification", "claim",
    "lottery", "winner", "prize", "reward", "resolution", "security",
    "agent", "dept", "nodal", "officer", "cancel", "dispute"
]

# Common free consumer PSP handles where brand claims indicate impersonation
CONSUMER_PSP_HANDLES = [
    "okhdfc", "okaxis", "okicici", "oksbi", "ybl", "ibl", "axl",
    "paytm", "upi", "apl", "postbank", "airtel", "pingpay", "jupiteraxis",
    "icici", "sbi", "hdfcbank", "barodampay"
]

GENERIC_PAYEE_NAMES = {
    "unknown", "customer", "user", "merchant", "payee", "na", "n/a",
    "admin", "null", "none", "person", "account", "test", "demo"
}


class QRService:
    """
    Production-grade QR Payment Security Analyzer.
    Decodes QR images, classifies content, extracts UPI specification parameters,
    and inspects recipient identity, amounts, and deception cues.
    """

    def __init__(self):
        self.url_checker = URLChecker()

    def decode_image_bytes(self, file_bytes: bytes) -> str:
        """
        Safely decodes QR code contents from image bytes using zxing-cpp and Pillow.
        Applies grayscale and binarization fallbacks for low-contrast/photographed codes.
        """
        if not file_bytes:
            raise ValueError("Empty image data provided.")

        if len(file_bytes) > 5 * 1024 * 1024:
            raise ValueError("Image file size exceeds the 5 MB security limit.")

        try:
            image = Image.open(io.BytesIO(file_bytes))
        except Exception as e:
            raise ValueError("Unsupported or corrupted image file format.") from e

        # Pass 1: Direct scan of original image
        barcode = zxingcpp.read_barcode(image)
        if barcode and barcode.text:
            return barcode.text.strip()

        # Pass 2: Grayscale conversion for low-contrast camera photos
        try:
            gray = image.convert("L")
            barcode = zxingcpp.read_barcode(gray)
            if barcode and barcode.text:
                return barcode.text.strip()
        except Exception:
            pass

        # Pass 3: High-contrast binarization thresholding
        try:
            bw = gray.point(lambda p: 255 if p > 128 else 0)
            barcode = zxingcpp.read_barcode(bw)
            if barcode and barcode.text:
                return barcode.text.strip()
        except Exception:
            pass

        raise ValueError(
            "No readable QR code found in this image. "
            "Please ensure the QR code is clearly visible, well-lit, and not cropped."
        )

    def parse_upi_payload(self, raw: str) -> Dict[str, Any]:
        """
        Extracts standard NPCI UPI linking specification parameters from a URI.
        """
        parsed_url = urlparse(raw)
        query_params = parse_qs(parsed_url.query)

        def get_single(key: str) -> str:
            val = query_params.get(key, [""])[0]
            return unquote(val).strip()

        payee_vpa = get_single("pa")
        payee_name = get_single("pn")
        amount_str = get_single("am")
        currency = get_single("cu") or "INR"
        note = get_single("tn")
        mcc = get_single("mc")
        tr = get_single("tr") or get_single("tid")
        mode = get_single("mode")
        orgid = get_single("orgid")
        sign = get_single("sign")

        amount_numeric: Optional[float] = None
        formatted_amount = "User enters amount in app"
        if amount_str:
            try:
                amount_numeric = float(amount_str)
                formatted_amount = f"₹{amount_numeric:,.2f}"
            except ValueError:
                formatted_amount = f"{currency} {amount_str}"

        # Detect merchant vs personal handle
        vpa_handle = payee_vpa.split("@")[-1].lower() if "@" in payee_vpa else ""
        vpa_username = payee_vpa.split("@")[0].lower() if "@" in payee_vpa else ""

        return {
            "payee_vpa": payee_vpa,
            "payee_name": payee_name or "Not Provided / Concealed",
            "amount": formatted_amount,
            "amount_numeric": amount_numeric,
            "raw_amount": amount_str,
            "currency": currency,
            "transaction_note": note,
            "merchant_code": mcc,
            "transaction_ref": tr,
            "mode": mode,
            "org_id": orgid,
            "is_signed": bool(sign),
            "vpa_handle": vpa_handle,
            "vpa_username": vpa_username,
            "is_fixed_amount": amount_numeric is not None
        }

    def analyze_payload(self, request: QRCheckRequest) -> QRCheckResponse:
        """
        Executes multi-stage security analysis on the raw decoded QR string.
        """
        raw = request.payload.strip()
        indicators: List[DetectedIndicator] = []
        why_suspicious: List[str] = []
        recommended_actions: List[str] = []
        checks_performed: List[str] = ["qr_decoding", "content_classification"]
        checks_unavailable: List[str] = []
        parsed_details: Dict[str, Any] = {}

        # -------------------------------------------------------------
        # STAGE 3: Content Classification
        # -------------------------------------------------------------

        # 1. UPI Payment Intent Scheme (upi://pay?... or upi://?...)
        if raw.lower().startswith("upi://pay") or raw.lower().startswith("upi://"):
            payload_type = "upi_intent"
            checks_performed.extend(["upi_parameter_parsing", "recipient_inspection", "amount_inspection"])

            upi_data = self.parse_upi_payload(raw)
            parsed_details = upi_data

            payee_vpa = upi_data["payee_vpa"]
            payee_name = upi_data["payee_name"]
            amount_numeric = upi_data["amount_numeric"]
            note = upi_data["transaction_note"]
            vpa_username = upi_data["vpa_username"]
            vpa_handle = upi_data["vpa_handle"]

            # ---------------------------------------------------------
            # STAGE 4: Security Analysis Rules for UPI QR Codes
            # ---------------------------------------------------------

            # Rule 1: Reverse Collect / Receive Money Trap (CRITICAL SCAM)
            context_lower = (request.context or "").lower()
            receive_triggers = [
                "receive", "get money", "credited", "refund", "claim",
                "prize", "buyer", "selling", "olx", "quikr", "marketplace"
            ]
            if any(k in context_lower for k in receive_triggers):
                indicators.append(DetectedIndicator(
                    id="qr_receive_trap",
                    name="Scan QR to Receive Money Trap",
                    description=(
                        "You were instructed to scan this QR code to RECEIVE money, but UPI QR codes "
                        "can ONLY initiate an outgoing debit from your account."
                    ),
                    severity="high",
                    matched_clues=["Context indicates user was told to scan QR to receive money"]
                ))
                why_suspicious.append(
                    "UPI QR codes and payment requests NEVER credit money to your account. "
                    "Scanning this QR code will DEDUCT money from your account."
                )
                recommended_actions.append(
                    "Do NOT scan this QR code or authorize the payment in your UPI app."
                )
                recommended_actions.append(
                    "You NEVER enter a UPI PIN to receive money. Entering your PIN always sends funds."
                )

            # Rule 2: Deceptive Brand Impersonation on Personal VPA (e.g., refundamazon@okhdfc)
            matched_brand = next((b for b in KNOWN_BRANDS if b in vpa_username), None)
            matched_scam_keyword = next((s for s in SCAM_VPA_KEYWORDS if s in vpa_username), None)
            is_consumer_handle = vpa_handle in CONSUMER_PSP_HANDLES

            if matched_brand and (matched_scam_keyword or is_consumer_handle):
                indicators.append(DetectedIndicator(
                    id="brand_impersonation_vpa",
                    name="Deceptive Recipient UPI ID",
                    description=(
                        f"The recipient UPI ID ('{payee_vpa}') uses brand keywords ('{matched_brand}') "
                        f"{'and refund/support terms ' if matched_scam_keyword else ''}"
                        f"on a personal consumer handle ('@{vpa_handle}')."
                    ),
                    severity="high",
                    matched_clues=[f"Spoofed handle: {payee_vpa}"]
                ))
                why_suspicious.append(
                    f"The UPI ID ('{payee_vpa}') appears to imitate {matched_brand.title()} operations. "
                    f"Legitimate enterprises never collect payments or process refunds from personal consumer UPI handles."
                )
                recommended_actions.append(
                    f"Do not proceed. Contact {matched_brand.title()} exclusively through their official verified app."
                )

            # Rule 3: Misleading Transaction Note / Fake Refund Lure
            note_lower = note.lower()
            suspicious_note_keywords = [
                "refund", "cashback", "lucky", "lottery", "prize", "diwali",
                "reward", "kyc", "pan", "verification", "claim", "deposit", "cancel"
            ]
            matched_note_word = next((w for w in suspicious_note_keywords if w in note_lower), None)
            if matched_note_word:
                indicators.append(DetectedIndicator(
                    id="misleading_qr_note",
                    name="Misleading Transaction Note",
                    description=(
                        f"The QR payload note says '{note}' to mislead you into thinking "
                        f"this transaction is an incoming refund, reward, or verification."
                    ),
                    severity="high",
                    matched_clues=[f"Suspicious note lure: {matched_note_word}"]
                ))
                why_suspicious.append(
                    f"The transaction note ('{note}') is crafted to disguise an outgoing debit transaction as a refund or award."
                )

            # Rule 4: Missing or Generic Recipient Identity
            clean_payee_name = payee_name.lower().strip()
            if not payee_name or clean_payee_name in GENERIC_PAYEE_NAMES:
                indicators.append(DetectedIndicator(
                    id="missing_payee_identity",
                    name="Unverified / Concealed Recipient Name",
                    description=(
                        f"The payee display name is '{payee_name}'. "
                        "The actual identity of the account holder is concealed until opened inside your UPI app."
                    ),
                    severity="medium",
                    matched_clues=[f"Generic payee name: '{payee_name}'"]
                ))
                why_suspicious.append(
                    "The recipient name does not identify a verified business or individual."
                )
                recommended_actions.append(
                    "Check the verified account holder name displayed on your bank's confirmation screen before entering your PIN."
                )

            # Rule 5: Locked High-Value Amount
            if amount_numeric is not None and amount_numeric >= 2000.0:
                indicators.append(DetectedIndicator(
                    id="preset_high_amount",
                    name="Pre-Set Locked Payment Amount",
                    description=(
                        f"This QR code pre-fills an outgoing debit of {upi_data['amount']}. "
                        "Scammers frequently pre-lock amounts in marketplace and advance-fee scams."
                    ),
                    severity="medium",
                    matched_clues=[f"Pre-set amount: {upi_data['amount']}"]
                ))
                why_suspicious.append(
                    f"A fixed payment amount of {upi_data['amount']} is pre-configured in this QR code."
                )

            # Rule 6: Malformed VPA
            if not payee_vpa or "@" not in payee_vpa:
                indicators.append(DetectedIndicator(
                    id="malformed_upi_parameters",
                    name="Invalid / Missing Recipient VPA",
                    description="The QR code does not provide a valid Virtual Payment Address (VPA).",
                    severity="medium",
                    matched_clues=["Missing '@' in UPI ID"]
                ))
                why_suspicious.append("The payment address in this QR code is incomplete or malformed.")

            # ---------------------------------------------------------
            # STAGE 5: Risk Scoring for UPI QR
            # ---------------------------------------------------------
            high_indicators = [ind for ind in indicators if ind.severity == "high"]
            med_indicators = [ind for ind in indicators if ind.severity == "medium"]

            if high_indicators:
                risk_level: RiskLevel = "HIGH"
                score = min(100, 75 + len(high_indicators) * 10 + len(med_indicators) * 5)
            elif med_indicators:
                risk_level = "MEDIUM"
                score = min(65, 45 + len(med_indicators) * 10)
            else:
                risk_level = "LOW"
                score = 25
                why_suspicious.append("This is a standard UPI merchant/person-to-person payment request.")
                recommended_actions.append(
                    f"Verify that the payee name ('{payee_name}') and UPI ID ('{payee_vpa}') match the shop or individual you intend to pay."
                )
                recommended_actions.append(
                    "Confirm the exact amount in your UPI app before entering your UPI PIN."
                )

            educational = EducationalConcept(
                title="The Golden Rule of UPI QR Codes",
                concept=(
                    "A QR code functions like an invoice: scanning it prepares money to LEAVE your account. "
                    "To receive money, someone only needs your phone number or UPI ID — "
                    "they NEVER need you to scan anything or enter your UPI PIN."
                ),
                golden_rule="Scan QR = Pay Money. Enter UPI PIN = Money Deducted. You NEVER scan a QR code to receive money."
            )

        # 2. Web URL Scheme (http://, https://, or domain-like)
        elif raw.lower().startswith("http://") or raw.lower().startswith("https://") or ("." in raw and not " " in raw):
            payload_type = "url"
            checks_performed.extend(["url_syntax_check", "domain_directory_lookup", "reputation_feed_query"])

            url_res = self.url_checker.analyze_url(URLCheckRequest(url=raw, context=request.context))
            risk_level = url_res.risk_level
            score = url_res.risk_score
            indicators = url_res.indicators
            why_suspicious = url_res.why_suspicious
            recommended_actions = url_res.recommended_actions
            educational = url_res.educational_concept
            parsed_details = {
                "destination_url": raw,
                "destination_domain": url_res.domain,
                "protocol": url_res.protocol,
                "is_https": url_res.is_https,
                "verification_status": url_res.status
            }

        # 3. Plain Text Payload
        else:
            payload_type = "text"
            checks_performed.append("plain_text_credential_heuristic")

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
            recommended_actions = [
                "Do not open or execute any instructions found in this text unless you recognize the author."
            ]
            educational = EducationalConcept(
                title="QR Code Content Inspection",
                concept=(
                    "QR codes can contain arbitrary text, contacts, or script commands. "
                    "Always inspect the content safely before acting on it."
                ),
                golden_rule="Never execute unfamiliar instructions found inside a QR code."
            )
            parsed_details = {
                "text_content": raw[:200] + ("..." if len(raw) > 200 else "")
            }

        # Format uncertainty communication based on risk level
        if risk_level == "LOW":
            uncertainty_note = (
                "Payment format appears valid. However, ClearPay cannot guarantee that the named recipient is genuine. "
                "Always verify the recipient's verified banking name inside your UPI app before entering your PIN."
            )
        elif risk_level == "MEDIUM":
            uncertainty_note = (
                "Unusual payment instructions or missing recipient details were detected. "
                "Do not proceed until you have verified the recipient independently."
            )
        else:
            uncertainty_note = (
                "High-risk warning signs detected. Outgoing debit manipulation or deceptive recipient identity found. "
                "Do not proceed with this payment."
            )

        return QRCheckResponse(
            risk_level=risk_level,
            risk_score=score,
            payload_type=payload_type,
            raw_payload_preview=raw[:300] + ("..." if len(raw) > 300 else ""),
            parsed_details=parsed_details,
            payment_details=parsed_details if payload_type == "upi_intent" else None,
            indicators=indicators,
            why_suspicious=why_suspicious,
            recommended_actions=recommended_actions,
            checks_performed=checks_performed,
            checks_unavailable=checks_unavailable,
            educational_concept=educational,
            uncertainty_note=uncertainty_note
        )

    def decode_and_analyze_image(
        self,
        file_bytes: bytes,
        context: Optional[str] = None,
        language: str = "en"
    ) -> QRCheckResponse:
        """
        End-to-end QR image pipeline:
        Stage 1: Validation -> Stage 2: Decoding -> Stages 3-6: Security Analysis.
        """
        decoded_text = self.decode_image_bytes(file_bytes)
        request = QRCheckRequest(payload=decoded_text, context=context, language=language)
        return self.analyze_payload(request)
