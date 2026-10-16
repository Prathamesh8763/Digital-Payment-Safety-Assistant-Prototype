import React, { useState } from 'react';
import { HelpCircle, Send, RotateCcw, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function GuidedCheck({ onAnalyze, loading }) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

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

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
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
    setCurrentStep(1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return;
    onAnalyze(formData);
  };

  return (
    <div className="guided-wizard-container">
      {/* Progress Bar & Step Indicator */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
            Guided Safety Assistant • Step {currentStep} of {totalSteps}
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Answer in your own words — no technical knowledge needed
          </span>
        </div>
        <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${(currentStep / totalSteps) * 100}%`,
              height: '100%',
              background: 'var(--primary)',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1 */}
        {currentStep === 1 && (
          <div className="guided-step">
            <label className="form-label" htmlFor="contact_source">
              1. Who contacted or approached you?
            </label>
            <p className="form-help">
              Select how this communication started. Legitimate banks rarely initiate unplanned calls from mobile numbers.
            </p>
            <select
              id="contact_source"
              name="contact_source"
              className="guided-select"
              value={formData.contact_source}
              onChange={handleChange}
            >
              <option value="unknown_call">Unknown Phone Call / Regular Mobile Number</option>
              <option value="bank_caller">Caller Claiming to be Bank Manager / Customer Care</option>
              <option value="sms">SMS / Text Message from Unknown Header</option>
              <option value="messaging_app">WhatsApp or Telegram Message</option>
              <option value="social_media">Social Media (Instagram, Facebook, OLX, Telegram)</option>
              <option value="in_person">In-Person Merchant / Billing Counter</option>
              <option value="other">Other Unfamiliar Channel</option>
            </select>
          </div>
        )}

        {/* Step 2 */}
        {currentStep === 2 && (
          <div className="guided-step">
            <label className="form-label" htmlFor="sender_claim">
              2. What did they claim or tell you?
            </label>
            <p className="form-help">
              Scammers often invent sudden emergencies, prizes, or threats to manipulate emotions.
            </p>
            <select
              id="sender_claim"
              name="sender_claim"
              className="guided-select"
              value={formData.sender_claim}
              onChange={handleChange}
            >
              <option value="bank_alert">Bank account will be blocked, suspended, or has an unauthorized debit</option>
              <option value="kyc_update">KYC update, PAN card link, or SIM deactivation deadline</option>
              <option value="prize_won">You won a lottery, Diwali reward, or cash jackpot</option>
              <option value="refund_pending">Unsolicited refund is waiting or extra money was sent by mistake</option>
              <option value="job_offer">Part-time job earning ₹2,000–₹5,000 daily for liking videos</option>
              <option value="friend_emergency">Friend or relative needing urgent financial help</option>
              <option value="normal_purchase">Everyday purchase of food, groceries, or household items</option>
            </select>
          </div>
        )}

        {/* Step 3 */}
        {currentStep === 3 && (
          <div className="guided-step">
            <label className="form-label" htmlFor="requested_action">
              3. What did they ask you to do?
            </label>
            <p className="form-help">
              Pay close attention to what action you were instructed to take.
            </p>
            <select
              id="requested_action"
              name="requested_action"
              className="guided-select"
              value={formData.requested_action}
              onChange={handleChange}
            >
              <option value="share_otp_pin">Tell or share an OTP, UPI PIN, ATM PIN, or password</option>
              <option value="pay_small_fee_first">Pay a registration fee, tax, or deposit first</option>
              <option value="scan_qr_to_receive">Scan a QR code or accept a collect request to receive money</option>
              <option value="install_anydesk_app">Download AnyDesk, TeamViewer, or QuickSupport screen-share app</option>
              <option value="click_link">Click an external link or download an APK file</option>
              <option value="normal_merchant_pay">Regular merchant store payment at checkout</option>
            </select>
          </div>
        )}

        {/* Step 4 */}
        {currentStep === 4 && (
          <div className="guided-step">
            <label className="form-label">
              4. Check any pressure tactics that apply:
            </label>
            <p className="form-help">
              Select all behaviors that occurred during this interaction.
            </p>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="has_urgency_pressure"
                  checked={formData.has_urgency_pressure}
                  onChange={handleChange}
                />
                <span>
                  <strong>Artificial Urgency / Panic:</strong> They pressured me to act immediately (e.g. "within 10 minutes", "account blocked today") so I wouldn't have time to think.
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
                  <strong>Demanded Money Transfer:</strong> They asked me to transfer or send money to an unfamiliar bank account, UPI ID, or phone number.
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
                  <strong>Secret Credentials Asked:</strong> They asked for confidential data like OTP, UPI PIN, card CVV, or netbanking passwords.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Step 5 */}
        {currentStep === 5 && (
          <div className="guided-step">
            <label className="form-label">
              5. Review Your Answers & Additional Notes:
            </label>
            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-light)', marginBottom: '1rem', fontSize: '0.88rem' }}>
              <div style={{ marginBottom: '0.35rem' }}><strong>Contact:</strong> {formData.contact_source.replace(/_/g, ' ')}</div>
              <div style={{ marginBottom: '0.35rem' }}><strong>Their Claim:</strong> {formData.sender_claim.replace(/_/g, ' ')}</div>
              <div style={{ marginBottom: '0.35rem' }}><strong>Demanded Action:</strong> {formData.requested_action.replace(/_/g, ' ')}</div>
              <div style={{ marginBottom: '0.35rem' }}>
                <strong>Warning Flags:</strong> {formData.has_urgency_pressure ? 'Urgency pressure' : ''}{formData.demands_money ? ', Demanded money' : ''}{formData.asks_sensitive_data ? ', Asked credentials' : ''}{(!formData.has_urgency_pressure && !formData.demands_money && !formData.asks_sensitive_data) ? 'None reported' : ''}
              </div>
            </div>

            <label className="form-label" htmlFor="additional_notes">
              Any other details you noticed? (Optional)
            </label>
            <input
              type="text"
              id="additional_notes"
              name="additional_notes"
              className="guided-select"
              placeholder="e.g. They were speaking loudly and said they are from Mumbai branch..."
              value={formData.additional_notes}
              onChange={handleChange}
            />
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="btn-row" style={{ marginTop: '1.5rem' }}>
          {currentStep > 1 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleBack}
              disabled={loading}
            >
              <ArrowLeft size={16} /> Back
            </button>
          )}

          {currentStep < totalSteps ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNext}
            >
              Next Step <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Evaluating Answers...' : <><Send size={18} /> Analyze Situation</>}
            </button>
          )}

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
    </div>
  );
}
