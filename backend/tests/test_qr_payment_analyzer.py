import io
import pytest
from PIL import Image
import zxingcpp
from fastapi.testclient import TestClient

from backend.main import app
from schemas.safety import QRCheckRequest
from safety.qr_service import QRService

client = TestClient(app)
qr_service = QRService()


def create_test_qr_image(payload: str) -> bytes:
    """Helper to generate a PNG QR code in memory."""
    barcode = zxingcpp.create_barcode(payload, zxingcpp.BarcodeFormat.QRCode)
    zxing_img = zxingcpp.write_barcode_to_image(barcode)
    # Convert zxing image to PIL image
    pil_img = Image.fromarray(zxing_img)
    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    return buf.getvalue()


def test_qr_decode_image_bytes():
    payload = "upi://pay?pa=chaipoint@hdfcbank&pn=Chai%20Point&am=50&cu=INR"
    img_bytes = create_test_qr_image(payload)
    decoded = qr_service.decode_image_bytes(img_bytes)
    assert decoded == payload


def test_qr_decode_blank_image_fails():
    blank = Image.new("RGB", (200, 200), color="white")
    buf = io.BytesIO()
    blank.save(buf, format="PNG")
    with pytest.raises(ValueError, match="No readable QR code found"):
        qr_service.decode_image_bytes(buf.getvalue())


def test_upi_parameter_parsing():
    raw = "upi://pay?pa=merchant%40axisbank&pn=Super%20Mart&am=1250.50&cu=INR&tn=Invoice%2042&mc=5411"
    parsed = qr_service.parse_upi_payload(raw)
    assert parsed["payee_vpa"] == "merchant@axisbank"
    assert parsed["payee_name"] == "Super Mart"
    assert parsed["amount"] == "₹1,250.50"
    assert parsed["amount_numeric"] == 1250.50
    assert parsed["currency"] == "INR"
    assert parsed["transaction_note"] == "Invoice 42"
    assert parsed["merchant_code"] == "5411"


def test_amazon_refund_impersonation_scam():
    # Matches the user-provided screenshot scenario: refundamazon@okhdfc with ₹2,500
    raw = "upi://pay?pa=refundamazon@okhdfc&pn=Unknown&am=2500&cu=INR&tn=Headphones%20order"
    res = qr_service.analyze_payload(QRCheckRequest(payload=raw))
    assert res.risk_level == "HIGH"
    assert res.risk_score >= 85
    indicator_ids = [ind.id for ind in res.indicators]
    assert "brand_impersonation_vpa" in indicator_ids
    assert "missing_payee_identity" in indicator_ids
    assert "preset_high_amount" in indicator_ids
    assert res.payment_details is not None
    assert res.payment_details["amount"] == "₹2,500.00"
    assert any("Amazon" in r or "personal" in r for r in res.why_suspicious)


def test_reverse_collect_trap_via_qr():
    raw = "upi://pay?pa=olxbuyer@okicici&am=4000&cu=INR"
    res = qr_service.analyze_payload(QRCheckRequest(
        payload=raw,
        context="Buyer told me to scan this to receive advance payment for my bicycle"
    ))
    assert res.risk_level == "HIGH"
    assert res.risk_score == 100
    indicator_ids = [ind.id for ind in res.indicators]
    assert "qr_receive_trap" in indicator_ids
    assert any("NEVER credit money" in s for s in res.why_suspicious)


def test_misleading_lottery_note():
    raw = "upi://pay?pa=shopkeeper@upi&pn=LuckyDraw&am=200&cu=INR&tn=Cashback%20Reward%20Verification"
    res = qr_service.analyze_payload(QRCheckRequest(payload=raw))
    assert res.risk_level == "HIGH"
    indicator_ids = [ind.id for ind in res.indicators]
    assert "misleading_qr_note" in indicator_ids


def test_standard_legitimate_merchant_qr():
    raw = "upi://pay?pa=dhabamart@hdfcbank&pn=Punjab%20Dhaba&am=320&cu=INR&mc=5812"
    res = qr_service.analyze_payload(QRCheckRequest(payload=raw))
    assert res.risk_level == "LOW"
    assert len(res.indicators) == 0
    assert res.payment_details["payee_name"] == "Punjab Dhaba"
    assert res.payment_details["amount"] == "₹320.00"
    # Never certifies absolute safety
    assert "cannot guarantee" in res.uncertainty_note.lower()


def test_api_check_qr_image_endpoint():
    payload = "upi://pay?pa=refundamazon@okhdfc&pn=Unknown&am=2500&cu=INR&tn=Headphones%20order"
    img_bytes = create_test_qr_image(payload)

    response = client.post(
        "/api/check/qr-image",
        files={"file": ("qr.png", img_bytes, "image/png")},
        data={"context": "Someone messaged me this QR to process a refund"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "HIGH"
    assert data["payload_type"] == "upi_intent"
    assert data["payment_details"]["payee_vpa"] == "refundamazon@okhdfc"
    assert data["payment_details"]["amount"] == "₹2,500.00"
    assert len(data["indicators"]) >= 2
    assert len(data["recommended_actions"]) >= 2


def test_api_check_qr_image_unreadable():
    blank = Image.new("RGB", (150, 150), color="white")
    buf = io.BytesIO()
    blank.save(buf, format="PNG")

    response = client.post(
        "/api/check/qr-image",
        files={"file": ("blank.png", buf.getvalue(), "image/png")}
    )
    assert response.status_code == 422
    assert "No readable QR code found" in response.json()["detail"]
