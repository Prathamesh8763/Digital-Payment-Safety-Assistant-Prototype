import React, { useState, useEffect } from 'react';
import { Send, RotateCcw, Sparkles, CheckCircle2 } from 'lucide-react';

const FALLBACK_SCENARIOS = [
  {
    id: "fake_bank_support",
    title: "Fake Bank Call (OTP)",
    type: "scam",
    text: "Someone called me saying they are from SBI Customer Care. They said my account had a fraudulent debit and asked me to share my OTP immediately to reverse it."
  },
  {
    id: "fake_kyc_blocking",
    title: "KYC Account Block Threat",
    type: "scam",
    text: "Dear customer, your bank account will be blocked today within 2 hours because KYC is incomplete. Call 9876543210 or install this APK file to update immediately."
  },
  {
    id: "fake_refund",
    title: "Accidental Refund Trap",
    type: "scam",
    text: "I received a message: 'I sent you ₹5,000 by mistake instead of ₹500. Please scan this QR code or accept the collect request to refund my money.'"
  },
  {
    id: "prize_reward",
    title: "Lottery Advance Fee",
    type: "scam",
    text: "Congratulations! You have won ₹25,000 in the Lucky Draw. To claim your prize money, pay ₹499 registration fee first to UPI ID: winnerclaim@upi."
  },
  {
    id: "remote_access_anydesk",
    title: "AnyDesk Screen Share App",
    type: "scam",
    text: "Caller said my payment failed and told me to install AnyDesk or QuickSupport app from Play Store so they can guide me through the refund process."
  },
  {
    id: "upi_pin_to_receive",
    title: "Enter PIN to Receive Money",
    type: "scam",
    text: "A buyer on OLX sent me a QR code saying: 'Scan this QR code and enter your UPI PIN to receive ₹3,500 advance payment for your sofa.'"
  },
  {
    id: "legitimate_tea_stall",
    title: "Legitimate Tea Stall Payment",
    type: "legitimate",
    text: "I scanned the merchant QR code at Sharma Tea Stall and paid ₹40 using Google Pay. Received standard debit confirmation SMS from HDFC Bank."
  },
  {
    id: "legitimate_bill_payment",
    title: "Legitimate Electricity Bill",
    type: "legitimate",
    text: "I opened the official PhonePe app and paid my electricity bill of ₹850. Debited from my bank account with normal transaction ID."
  }
];

export default function TextCheck({ onAnalyze, loading }) {
  const [text, setText] = useState('');
  const [scenarios, setScenarios] = useState(FALLBACK_SCENARIOS);

  useEffect(() => {
    // Try fetching scenarios from backend
    fetch('http://localhost:8000/api/scenarios')
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setScenarios(data);
        }
      })
      .catch(() => {
        // Use fallback scenarios
      });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    onAnalyze({ text: text.trim() });
  };

  const handleSelectScenario = (scenario) => {
    setText(scenario.text);
  };

  const handleClear = () => {
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="text-check-form">
      <label htmlFor="situation-text" className="form-label">
        Describe what happened or paste the suspicious message:
      </label>
      <p className="form-help">
        Include what the person said, what they claimed, and what they asked you to do. (Never include real PINs or passwords!)
      </p>

      <textarea
        id="situation-text"
        className="text-area"
        placeholder="Example: Someone called me saying they are from my bank. They said my account will be blocked today unless I pay ₹2,000 or share my OTP..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        required
      />

      <div className="btn-row">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={text.trim().length < 3 || loading}
        >
          {loading ? (
            'Analyzing Situation...'
          ) : (
            <>
              <Send size={18} /> Check Safety
            </>
          )}
        </button>

        {text && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClear}
            disabled={loading}
          >
            <RotateCcw size={16} /> Clear
          </button>
        )}
      </div>

      <div className="scenarios-section">
        <div className="scenarios-title">
          <Sparkles size={14} style={{ display: 'inline', marginRight: '4px' }} />
          Try Demonstration Scenarios (Click to test):
        </div>
        <div className="scenarios-grid">
          {scenarios.map((sc) => (
            <button
              key={sc.id}
              type="button"
              className={`scenario-pill ${sc.type === 'legitimate' ? 'legit-pill' : ''}`}
              onClick={() => handleSelectScenario(sc)}
              title={sc.text}
            >
              {sc.type === 'legitimate' ? '✓ ' : '⚠️ '}
              {sc.title}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
