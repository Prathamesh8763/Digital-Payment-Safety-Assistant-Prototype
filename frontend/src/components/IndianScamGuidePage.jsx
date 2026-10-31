import React, { useState } from 'react';
import {
  ShieldAlert,
  Smartphone,
  FileCheck2,
  AlertTriangle,
  Laptop,
  PhoneCall,
  TrendingUp,
  CreditCard,
  Lock,
  ArrowRight,
  PhoneForwarded
} from 'lucide-react';
import '../styles/scamGuide.css';

const SCAM_MODULES = [
  {
    id: 'upi_collect_fraud',
    category: 'UPI & QR Scams',
    title: 'UPI Collect Request & QR Receive Trap',
    icon: <Smartphone size={22} />,
    risk_type: 'Payment Authorization Trap',
    summary: 'A buyer on OLX, Facebook Marketplace, or an unknown caller sends you a QR code or an in-app "Collect Request" claiming it is to pay you money or process an advance.',
    golden_rule: 'You NEVER enter your UPI PIN or scan a QR code to receive money. Entering PIN = Money debited from your account.',
    red_flags: [
      'Buyer insists on sending advance via QR code or UPI Collect Request',
      'They tell you to "Accept" or "Approve" the request in your UPI app',
      'They claim you must enter your UPI PIN or press "1" to confirm your bank account'
    ],
    sample_text: 'I am sending ₹4,500 advance for your old sofa. Accept this PhonePe collect request and enter your UPI PIN to claim money.'
  },
  {
    id: 'fake_payment_screenshot',
    category: 'UPI & QR Scams',
    title: 'Fake Payment Screenshot & Spoofed Apps',
    icon: <FileCheck2 size={22} />,
    risk_type: 'Fabricated Proof of Transfer',
    summary: 'A stranger or buyer shows you a realistic payment confirmation screen (using spoof apps like Paytm Spoof) or sends a fake SMS from a normal 10-digit mobile number.',
    golden_rule: 'A screenshot or SMS from a regular 10-digit number is NOT proof of payment. Only money reflected in your official bank balance is real.',
    red_flags: [
      'Buyer shows a successful transfer screen, but your bank app balance has not changed',
      'The confirmation SMS originates from a standard 10-digit mobile number, not an official bank SMS header (e.g., VM-HDFCBK, AX-SBIBNK)',
      'Buyer rushes you, claiming "server is slow, don\'t worry the money will show up later"'
    ],
    sample_text: 'Payment successful! ₹3,200 sent to your UPI ID. See the attached transfer receipt screenshot.'
  },
  {
    id: 'electricity_utility_kyc',
    category: 'Panic & Disconnection',
    title: 'Electricity Bill & KYC Disconnection Panic',
    icon: <AlertTriangle size={22} />,
    risk_type: 'Coercive Urgency Scare',
    summary: 'You receive an urgent SMS stating your electricity or power connection will be cut off tonight at 9:30 PM due to an unpaid bill, urging you to call an officer number.',
    golden_rule: 'Electricity boards follow formal postal/written notice periods. They NEVER send disconnection threats from personal mobile numbers.',
    red_flags: [
      'The message lists a personal mobile number (+91 9xxxxxxxxx) instead of an official electricity office board',
      'Artificially tight deadline ("tonight at 9:30 PM" or "within 2 hours")',
      'They demand payment through an unverified link or ask you to install an APK file'
    ],
    sample_text: 'Dear consumer, your electricity connection will be disconnected tonight at 9:30 PM from the power office because your previous bill was not updated. Immediately call 9876543210.'
  },
  {
    id: 'screen_sharing_takeover',
    category: 'Remote Access & Malware',
    title: 'Screen-Sharing / AnyDesk Device Takeover',
    icon: <Laptop size={22} />,
    risk_type: 'Full Screen & SMS Surveillance',
    summary: 'A caller posing as customer support, bank technical staff, or refund officer instructs you to install AnyDesk, TeamViewer, QuickSupport, or RustDesk from the Play Store.',
    golden_rule: 'Never install remote desktop or screen-sharing applications on instructions from an unknown caller.',
    red_flags: [
      'Caller asks for the 9-digit or 10-digit access code displayed inside AnyDesk',
      'They tell you to open your banking app or UPI app while connected so they can "fix" a failed transaction',
      'They ask you to transfer ₹1 or ₹10 as a "test charge"'
    ],
    sample_text: 'Sir, your refund of ₹1,499 is stuck. Please download AnyDesk from Play Store and give me the 9-digit code so I can reverse the transaction from server.'
  },
  {
    id: 'fake_customer_care',
    category: 'Search Engine Traps',
    title: 'Fake Customer Care Google Maps / Search Scam',
    icon: <PhoneCall size={22} />,
    risk_type: 'Search Result Impersonation',
    summary: 'When searching Google or Google Maps for customer care numbers of Swiggy, Zomato, Courier, or Banks, you find fake phone numbers uploaded by scammers.',
    golden_rule: 'Never search Google or Google Maps for customer support numbers. Always use the built-in Help section inside official apps.',
    red_flags: [
      'Customer support number listed is a standard mobile number instead of an authentic 1800 toll-free line',
      'Executive asks you to share your OTP, card number, or UPI PIN',
      'Executive asks you to click an SMS link to receive your refund'
    ],
    sample_text: 'I called the SBI customer care number found on Google. The executive asked me for my 16-digit debit card number and OTP to cancel an unauthorized transaction.'
  },
  {
    id: 'part_time_task_job',
    category: 'Investment & Tasks',
    title: 'Part-Time Task & Telegram Job Scam',
    icon: <TrendingUp size={22} />,
    risk_type: 'Advance Deposit Ponzi Trap',
    summary: 'Unsolicited WhatsApp messages offer ₹2,000–₹5,000 daily for easy tasks like "liking YouTube videos" or "submitting Google reviews", escalating to mandatory "prepaid deposit tasks".',
    golden_rule: 'No legitimate company asks you to pay money or deposit funds to receive your earned salary.',
    red_flags: [
      'Messages received from international phone codes (+62, +234, +84, etc.) on WhatsApp',
      'Small payouts (₹150 to ₹500) given early to gain trust',
      'Added to Telegram VIP groups where you must deposit ₹10,000+ to unlock the next task'
    ],
    sample_text: 'Earn ₹3,000 to ₹5,000 daily working from home by just liking 3 YouTube videos per task. Reply YES to start earning.'
  },
  {
    id: 'otp_pin_solicitation',
    category: 'Credential Theft',
    title: 'OTP, MPIN & Password Solicitation Scam',
    icon: <Lock size={22} />,
    risk_type: 'Direct Credential Hijacking',
    summary: 'Fraudster calls claiming to be from your bank, telecom provider (5G SIM upgrade), or income tax office claiming an urgent need for an SMS verification code.',
    golden_rule: 'OTP stands for One-Time Password. Sharing your OTP is equivalent to handing over your bank vault keys.',
    red_flags: [
      'Caller says: "Do not read the message, just tell me the 6 digits you received"',
      'Caller claims sharing the OTP will prevent your account from being frozen',
      'Caller claims OTP is needed to cancel an unapproved payment'
    ],
    sample_text: 'This is calling from SBI Card verification. An unauthorized charge of ₹45,000 was attempted. To block this payment, please share the 6-digit OTP sent to your phone right now.'
  },
  {
    id: 'accidental_overpayment_trap',
    category: 'Refund & Overpayment',
    title: 'Accidental Overpayment & Refund Manipulation',
    icon: <CreditCard size={22} />,
    risk_type: 'Fake Emotional Manipulation',
    summary: 'A panicked stranger calls claiming they sent ₹25,000 to your number by mistake instead of ₹2,500 for a family medical emergency, begging you to return the difference.',
    golden_rule: 'Check your official bank app statement directly. Never return money based on an SMS screenshot or phone panic.',
    red_flags: [
      'Caller claims accidental transfer and shows a fake SMS notification',
      'They ask you to transfer the funds to a completely different UPI ID or phone number',
      'They send a UPI Collect Request disguised as a refund method'
    ],
    sample_text: 'Brother please help! My mother is in hospital and I sent ₹15,000 to your Google Pay by mistake instead of ₹1,500. Please return the extra ₹13,500 urgently.'
  }
];

export default function IndianScamGuidePage({ onNavigateHome, onNavigateAnalyze, onNavigateReport }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'UPI & QR Scams', 'Panic & Disconnection', 'Remote Access & Malware', 'Search Engine Traps', 'Investment & Tasks', 'Credential Theft', 'Refund & Overpayment'];

  const filteredModules = SCAM_MODULES.filter((module) => {
    const matchesCategory = selectedCategory === 'All' || module.category === selectedCategory;
    const matchesSearch =
      module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.golden_rule.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="scamguide-page">
      {/* Top Header */}
      <header className="scamguide-header">
        <nav className="scamguide-nav" aria-label="Scam Awareness Navigation">
          <a
            href="/"
            className="scamguide-brand"
            onClick={(e) => {
              e.preventDefault();
              onNavigateHome();
            }}
          >
            <div className="scamguide-brand-logo">C</div>
            <div>
              <span className="scamguide-brand-title">ClearPay</span>
              <span className="scamguide-brand-subtitle">Indian Digital Payment Scam Guide</span>
            </div>
          </a>

          <div className="scamguide-nav-actions">
            <button
              type="button"
              onClick={onNavigateReport}
              className="scamguide-report-cta"
            >
              <PhoneForwarded size={16} />
              Report Cybercrime (1930)
            </button>
            <button
              type="button"
              onClick={onNavigateHome}
              className="scamguide-back-btn"
            >
              ← Back to home
            </button>
          </div>
        </nav>
      </header>

      <main className="scamguide-container">
        {/* Hero */}
        <div className="scamguide-hero">
          <div className="scamguide-eyebrow">COMMON PAYMENT THREATS IN INDIA</div>
          <h1 className="scamguide-title">How Digital Payment Scams Work in India</h1>
          <p className="scamguide-subtitle">
            From UPI collect tricks and fake payment screenshots to electricity bill panics and screen-sharing takeovers—learn the psychological tricks fraudsters use before you make a move.
          </p>

          {/* Golden Rule Highlight */}
          <div className="scamguide-golden-banner">
            <ShieldAlert className="scamguide-golden-icon" />
            <div>
              <h3 className="scamguide-golden-title">The #1 Rule of UPI Payments</h3>
              <p className="scamguide-golden-desc">
                <strong>You NEVER enter a UPI PIN or scan a QR code to receive money.</strong> Entering your PIN always deducts money from your bank account. If someone tells you to enter your PIN to claim a refund, reward, or payment, it is 100% a scam.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="scamguide-controls">
          <input
            type="text"
            className="scamguide-search-input"
            placeholder="Search scams (e.g. UPI, AnyDesk, Electricity bill, OLX, Screenshot)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="scamguide-filter-pills">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`scamguide-filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Scam Cards Grid */}
        <div className="scamguide-grid">
          {filteredModules.map((item) => (
            <div key={item.id} className="scam-card">
              <div>
                <div className="scam-card-header">
                  <div className="scam-card-icon-wrap">{item.icon}</div>
                  <div>
                    <span className="scam-card-category-tag">{item.category}</span>
                    <h3 className="scam-card-title">{item.title}</h3>
                  </div>
                </div>

                <p className="scam-card-summary">{item.summary}</p>

                <div className="scam-card-rule-box">
                  🛡️ <strong>Golden Rule:</strong> {item.golden_rule}
                </div>

                <strong style={{ fontSize: '12px', color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                  Warning Signs & Red Flags:
                </strong>
                <ul className="scam-card-redflags">
                  {item.redflags?.map ? item.redflags.map((flag, idx) => (
                    <li key={idx}>{flag}</li>
                  )) : item.red_flags.map((flag, idx) => (
                    <li key={idx}>{flag}</li>
                  ))}
                </ul>
              </div>

              <div className="scam-card-footer">
                <button
                  type="button"
                  className="scam-card-action-btn"
                  onClick={() => onNavigateAnalyze && onNavigateAnalyze(item.sample_text)}
                >
                  <span>Test this example in Analyzer</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Reporting Callout Footer */}
        <section className="scamguide-interactive-section">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <h2 className="scamguide-interactive-title">Already a victim of financial cyber fraud?</h2>
              <p className="scamguide-interactive-subtitle">
                Act within the <strong>Golden Hour (1–2 hours)</strong>. Dial National Cybercrime Helpline <strong>1930</strong> or register on <strong>cybercrime.gov.in</strong> immediately to trigger an account freeze before scammers withdraw funds.
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateReport}
              className="scamguide-report-cta"
              style={{ fontSize: '15px', padding: '12px 22px' }}
            >
              <PhoneForwarded size={18} /> View Step-by-Step Reporting Guide
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
