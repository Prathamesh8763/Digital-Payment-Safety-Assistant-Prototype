import React, { useState } from 'react';
import { HelpCircle, Send, RotateCcw } from 'lucide-react';

export default function GuidedCheck({ onAnalyze, loading }) {
  const [formData, setFormData] = useState({
    contact_source: 'unknown_call',
    sender_claim: 'bank_alert',
    requested_action: 'share_otp_pin',
    has_urgency_pressure: true,
    demands_money: false,
    asks_sensitive_data: true,
    additional_notes: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return;
    onAnalyze(formData);
  };

  const handleReset = () => {
    setFormData({
      contact_source: 'unknown_call',
      sender_claim: 'bank_alert',
      requested_action: 'share_otp_pin',
      has_urgency_pressure: false,
      demands_money: false,
      asks_sensitive_data: false,
      additional_notes: ''
    });
  };

  return (
    <form onSubmit={handleSubmit} className="guided-check-form">
      <div className="guided-group">
        <label className="form-label" htmlFor="contact_source">
          1. Who contacted you or approached you?
        </label>
        <select
          id="contact_source"
          name="contact_source"
          className="guided-select"
          value={formData.contact_source}
          onChange={handleChange}
        >
          <option value="unknown_call">Unknown Phone Call / Mobile Number</option>
          <option value="bank_caller">Caller Claiming to be Bank Manager / Support</option>
          <option value="sms">SMS / Text Message</option>
          <option value="messaging_app">WhatsApp or Telegram Message</option>
          <option value="social_media">Social Media (Facebook, Instagram, OLX)</option>
          <option value="in_person">In-Person Merchant / Store Owner</option>
          <option value="other">Other Unfamiliar Contact</option>
        </select>
      </div>

      <div className="guided-group">
        <label className="form-label" htmlFor="sender_claim">
          2. What did they claim or say?
        </label>
        <select
          id="sender_claim"
          name="sender_claim"
          className="guided-select"
          value={formData.sender_claim}
          onChange={handleChange}
        >
          <option value="bank_alert">Bank account will be blocked or debited</option>
          <option value="kyc_update">KYC update / PAN card verification required</option>
          <option value="prize_won">You won a lottery, gift card, or lucky cash prize</option>
          <option value="refund_pending">Refund is ready or extra money was sent to you by mistake</option>
          <option value="job_offer">Part-time online job or high daily earnings task</option>
          <option value="normal_purchase">Standard payment for groceries/shopping/tea</option>
          <option value="friend_emergency">Friend or relative needing urgent money</option>
        </select>
      </div>

      <div className="guided-group">
        <label className="form-label" htmlFor="requested_action">
          3. What did they ask you to do?
        </label>
        <select
          id="requested_action"
          name="requested_action"
          className="guided-select"
          value={formData.requested_action}
          onChange={handleChange}
        >
          <option value="share_otp_pin">Tell them an OTP, UPI PIN, or ATM PIN</option>
          <option value="pay_small_fee_first">Pay a small advance fee, tax, or deposit first</option>
          <option value="scan_qr_to_receive">Scan a QR code or approve a collect request to receive money</option>
          <option value="install_anydesk_app">Download an app like AnyDesk, TeamViewer, or QuickSupport</option>
          <option value="click_link">Click a website link or download an APK file</option>
          <option value="normal_merchant_pay">Regular merchant payment at billing counter</option>
        </select>
      </div>

      <div className="guided-group">
        <label className="form-label">
          4. Check any warning signs that apply:
        </label>
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="has_urgency_pressure"
              checked={formData.has_urgency_pressure}
              onChange={handleChange}
            />
            <span>
              <strong>Urgency / Panic:</strong> They pressured me to act immediately, set a short deadline, or threatened account/service blockage.
            </span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="demands_money"
              checked={formData.demands_money}
              onChange={handleChange}
            />
            <span>
              <strong>Demanding Money Transfer:</strong> They asked me to transfer or send money to an unfamiliar bank account or UPI ID.
            </span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="asks_sensitive_data"
              checked={formData.asks_sensitive_data}
              onChange={handleChange}
            />
            <span>
              <strong>Secret Credentials Asked:</strong> They asked for OTP, UPI PIN, card numbers, CVV, or banking passwords.
            </span>
          </label>
        </div>
      </div>

      <div className="guided-group">
        <label className="form-label" htmlFor="additional_notes">
          5. Anything else you want to note? (Optional)
        </label>
        <input
          type="text"
          id="additional_notes"
          name="additional_notes"
          className="guided-select"
          placeholder="E.g., They said they are from Mumbai branch..."
          value={formData.additional_notes}
          onChange={handleChange}
        />
      </div>

      <div className="btn-row">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? (
            'Evaluating Answers...'
          ) : (
            <>
              <Send size={18} /> Analyze Situation
            </>
          )}
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleReset}
          disabled={loading}
        >
          <RotateCcw size={16} /> Reset
        </button>
      </div>
    </form>
  );
}
