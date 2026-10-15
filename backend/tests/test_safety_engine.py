from backend.services.safety_engine import analyze_message


def test_high_risk_message():
    result = analyze_message(
        "Someone says my bank account will be blocked immediately and asks for my OTP."
    )

    assert result.risk_level == "High"
    assert len(result.reasons) == 3


def test_low_risk_message():
    result = analyze_message(
        "I received my monthly salary in my bank account today."
    )

    assert result.risk_level == "Low"
    assert len(result.reasons) == 0


def test_medium_risk_message():
    result = analyze_message(
        "Someone says I need to verify my account immediately."
    )

    assert result.risk_level == "Medium"
    assert len(result.reasons) == 1


def test_payment_request():
    result = analyze_message(
        "Send ₹500 to this account immediately."
    )

    assert result.risk_level == "Medium"
    assert len(result.reasons) == 2


def test_payment_request_without_urgency():
    result = analyze_message(
        "Send ₹500 to this account."
    )

    assert result.risk_level == "Medium"
    assert len(result.reasons) == 1
    assert result.reasons[0] == "The message asks the user to make a payment."


def test_transfer_payment_request():
    result = analyze_message(
        "Please transfer ₹500 to this account."
    )

    assert result.risk_level == "Medium"
    assert "The message asks the user to make a payment." in result.reasons


def test_payment_request_using_rs():
    result = analyze_message(
        "Send Rs. 500 to this account."
    )

    assert result.risk_level == "Medium"
    assert "The message asks the user to make a payment." in result.reasons
