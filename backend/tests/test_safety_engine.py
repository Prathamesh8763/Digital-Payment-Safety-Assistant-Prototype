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