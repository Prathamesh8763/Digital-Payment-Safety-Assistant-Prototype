/**
 * ClearPay V9 Guided Safety Help Data & State Machine
 * Complies with Section 3, Section 5, and Section 6 of V9 PRD
 */

export const SCENARIOS = [
  {
    id: 'otp_pin',
    title: 'Someone asked for my OTP or PIN',
    description: 'A caller, text, or website is asking for a code, UPI PIN, password, or card details.',
    icon: 'lock',
    iconColor: 'blue',
    iconBg: '#eff6ff',
    iconTextColor: '#2563eb',
    initialQuestionId: 'q_otp_shared'
  },
  {
    id: 'account_blocked',
    title: 'A message says my account will be blocked',
    description: 'A warning creates pressure to verify, pay, or act immediately.',
    icon: 'alert-triangle',
    iconColor: 'red',
    iconBg: '#fef2f2',
    iconTextColor: '#ef4444',
    initialQuestionId: 'q_blocked_action'
  },
  {
    id: 'unexpected_request',
    title: 'I received an unexpected payment request',
    description: 'A collect request, QR code, or person says I must approve a payment to receive money.',
    icon: 'credit-card',
    iconColor: 'green',
    iconBg: '#f0fdf4',
    iconTextColor: '#16a34a',
    initialQuestionId: 'q_upi_type'
  },
  {
    id: 'link_qr',
    title: "I'm unsure about a link or QR code",
    description: "A shortened, unfamiliar, or misspelled address doesn't look right.",
    icon: 'link-2',
    iconColor: 'blue',
    iconBg: '#eff6ff',
    iconTextColor: '#2563eb',
    initialQuestionId: 'q_link_opened'
  },
  {
    id: 'something_else',
    title: "I'm not sure / something else",
    description: 'Start with a general safety checklist for the next step.',
    icon: 'compass',
    iconColor: 'purple',
    iconBg: '#faf5ff',
    iconTextColor: '#7c3aed',
    initialQuestionId: null // Direct to guidance
  }
];

export const QUESTIONS = {
  q_otp_shared: {
    id: 'q_otp_shared',
    scenarioId: 'otp_pin',
    prompt: 'Has anyone already received your code or UPI PIN?',
    helperText: 'Be honest with yourself—taking action quickly is what matters right now.',
    options: [
      {
        id: 'opt_otp_not_shared',
        label: "No, I haven't shared it",
        description: 'You still have the code and have not read it or typed it anywhere.',
        targetGuidanceId: 'guidance_otp_prevented'
      },
      {
        id: 'opt_otp_shared',
        label: 'Yes, I shared it or entered it',
        description: 'You read it to a caller, sent it in a message, or typed it on a website.',
        targetGuidanceId: 'urgent_compromise'
      },
      {
        id: 'opt_otp_unsure',
        label: "I'm not sure if they got it",
        description: 'You may have partially typed it, or your screen was being shared.',
        targetGuidanceId: 'urgent_compromise'
      }
    ]
  },
  q_blocked_action: {
    id: 'q_blocked_action',
    scenarioId: 'account_blocked',
    prompt: 'Did you open the link in the message or enter any details?',
    helperText: 'Different actions require different safety steps.',
    options: [
      {
        id: 'opt_blocked_no_action',
        label: 'No, I only read the message',
        description: 'You did not click any link or call the phone number in the message.',
        targetGuidanceId: 'guidance_blocked_prevented'
      },
      {
        id: 'opt_blocked_opened_only',
        label: 'I opened the link, but entered nothing',
        description: 'You visited the web page, but closed it without submitting passwords or codes.',
        targetGuidanceId: 'guidance_opened_link'
      },
      {
        id: 'opt_blocked_entered_details',
        label: 'I entered my details or downloaded an app',
        description: 'You typed your bank login, card number, or installed a recommended file/APK.',
        targetGuidanceId: 'urgent_compromise'
      },
      {
        id: 'opt_blocked_unsure',
        label: "I'm not sure",
        description: "You aren't sure if anything submitted automatically.",
        targetGuidanceId: 'urgent_compromise'
      }
    ]
  },
  q_upi_type: {
    id: 'q_upi_type',
    scenarioId: 'unexpected_request',
    prompt: 'Are you being asked to approve a payment or enter your UPI PIN?',
    helperText: 'Remember: A UPI PIN is only used to send money out, never to receive funds.',
    options: [
      {
        id: 'opt_upi_pin_asked',
        label: 'Yes, they told me to enter my UPI PIN to receive money',
        description: 'A buyer or caller claims entering your PIN is required to accept payment.',
        targetGuidanceId: 'guidance_collect_pin_trap'
      },
      {
        id: 'opt_upi_collect_only',
        label: 'I received an unexpected collect request notification',
        description: 'A notification popped up in PhonePe, Google Pay, or Paytm requesting money.',
        targetGuidanceId: 'guidance_collect_request'
      },
      {
        id: 'opt_upi_fake_screenshot',
        label: 'Someone sent a screenshot claiming they already paid me',
        description: 'They say money was deducted from their side, but it does not appear in your balance.',
        targetGuidanceId: 'guidance_fake_screenshot'
      }
    ]
  },
  q_link_opened: {
    id: 'q_link_opened',
    scenarioId: 'link_qr',
    prompt: 'Have you opened the link or scanned the QR code?',
    helperText: 'Checking links before opening them keeps your device safe.',
    options: [
      {
        id: 'opt_link_not_opened',
        label: "No, I haven't opened or scanned it yet",
        description: 'The link or QR code is in an SMS, email, or chat that you have paused on.',
        targetGuidanceId: 'guidance_link_unopened'
      },
      {
        id: 'opt_link_opened_only',
        label: 'Opened it, but entered nothing',
        description: 'The page loaded, but you did not type credentials or approve downloads.',
        targetGuidanceId: 'guidance_opened_link'
      },
      {
        id: 'opt_link_entered_details',
        label: 'Entered details or approved installation',
        description: 'You entered card details, netbanking passwords, or allowed an APK to install.',
        targetGuidanceId: 'urgent_compromise'
      }
    ]
  }
};

export const GUIDANCES = {
  guidance_otp_prevented: {
    id: 'guidance_otp_prevented',
    badge: 'PREVENTIVE GUIDANCE',
    badgeType: 'success',
    title: 'Keep it private — you did the right thing by pausing.',
    headline: 'No genuine bank, utility, or delivery agent ever asks for your OTP or PIN.',
    whySuspicious: [
      'Banks already manage your account securely; they never need you to read back an OTP to verify your identity.',
      'Scammers pretend to be fraud officers, KYC agents, or electricity board officials to pressure you into revealing codes.',
      'A UPI PIN or OTP gives the caller direct authorization to debit money or take over your mobile banking.'
    ],
    steps: [
      {
        step: 1,
        title: 'Do not share the code or PIN',
        desc: 'Ignore further calls or messages, even if they threaten immediate account suspension, fines, or legal action.'
      },
      {
        step: 2,
        title: 'Hang up and block the number',
        desc: 'If you are currently speaking with the caller, disconnect immediately. Mark the number as spam.'
      },
      {
        step: 3,
        title: 'Verify using your official app',
        desc: 'Open your banking app directly from your phone to check that your balance and status are normal.'
      },
      {
        step: 4,
        title: 'Analyze the message text',
        desc: 'You can paste the message into our Analyze tool to see what scam indicators triggered our safety rules.'
      }
    ],
    recommendedActionText: 'Analyze this message'
  },

  guidance_blocked_prevented: {
    id: 'guidance_blocked_prevented',
    badge: 'COMMON PANIC TACTIC',
    badgeType: 'warning',
    title: 'Urgent block warnings are almost always fake.',
    headline: 'Banks provide formal written notice and never freeze accounts via random SMS.',
    whySuspicious: [
      'Scammers fabricate urgent deadlines (e.g., "blocked within 2 hours", "tonight at 9:30 PM") so you act without thinking.',
      'They supply unofficial mobile numbers or suspicious links (e.g., .top, .apk, bit.ly) rather than official bank domains.',
      'Genuine banks provide clear, non-panicked notices inside your verified banking application.'
    ],
    steps: [
      {
        step: 1,
        title: 'Take a breath and do not click',
        desc: 'Do not click links or call mobile numbers provided inside the alert message.'
      },
      {
        step: 2,
        title: 'Log in to your official banking app',
        desc: 'If your KYC or bill is truly pending, you will see a banner inside your official app.'
      },
      {
        step: 3,
        title: 'Call the number on your debit card',
        desc: 'Use the trusted customer support number printed on the back of your physical card, not the number from the SMS.'
      },
      {
        step: 4,
        title: 'Inspect the message',
        desc: 'Paste the message into ClearPay Analyze to check its scam signals and learn what tricks were used.'
      }
    ],
    recommendedActionText: 'Analyze this message'
  },

  guidance_opened_link: {
    id: 'guidance_opened_link',
    badge: 'POTENTIAL PHISHING SITE',
    badgeType: 'warning',
    title: 'You visited the link, but submitted nothing.',
    headline: 'Safe next steps to ensure your device stays protected.',
    whySuspicious: [
      'Phishing sites mimic official bank portals to harvest usernames, passwords, and OTPs.',
      'Some deceptive links attempt background downloads of malicious APK files.'
    ],
    steps: [
      {
        step: 1,
        title: 'Close the browser tab immediately',
        desc: 'Do not interact with any form, prompt, or download button.'
      },
      {
        step: 2,
        title: 'Check your Downloads folder',
        desc: 'If an APK or unknown file downloaded automatically, delete it immediately without opening or installing it.'
      },
      {
        step: 3,
        title: 'Clear recent browser data',
        desc: 'In your mobile browser settings, clear cookies and cached files for the past hour.'
      },
      {
        step: 4,
        title: 'Check your banking app',
        desc: 'Open your genuine bank app to ensure balance and recent activity look normal.'
      }
    ],
    recommendedActionText: 'Inspect this link with Analyze'
  },

  guidance_collect_pin_trap: {
    id: 'guidance_collect_pin_trap',
    badge: 'CRITICAL UPI SAFETY RULE',
    badgeType: 'danger',
    title: 'Entering your UPI PIN only sends money out.',
    headline: 'You NEVER enter a UPI PIN to receive money or cashback.',
    whySuspicious: [
      'A UPI PIN is an authorization to DEBIT funds from your bank account.',
      'No technology in UPI allows receiving money by entering your secret PIN.',
      'Scammers on marketplaces (OLX, Facebook) send a "Pay" request disguised with text like "Receive ₹3,500".'
    ],
    steps: [
      {
        step: 1,
        title: 'Decline the request immediately',
        desc: 'Press "Decline" or "Reject" on the payment notification inside your UPI application.'
      },
      {
        step: 2,
        title: 'Never enter your PIN',
        desc: 'If you enter your PIN, the funds will be transferred instantly to the requester and cannot be stopped.'
      },
      {
        step: 3,
        title: 'Block the user in your UPI app',
        desc: 'Select "Report & Block" on the contact or VPA to prevent further requests.'
      },
      {
        step: 4,
        title: 'Report the marketplace listing',
        desc: 'If this happened during an online sale, report the user profile to the platform immediately.'
      }
    ],
    recommendedActionText: 'Analyze another situation'
  },

  guidance_collect_request: {
    id: 'guidance_collect_request',
    badge: 'UNEXPECTED COLLECT REQUEST',
    badgeType: 'warning',
    title: 'Decline collect requests from unfamiliar people.',
    headline: 'A collect request asks your permission to take money from your account.',
    whySuspicious: [
      'Scammers send collect requests hoping you tap "Pay" or "Approve" out of confusion or hurry.',
      'Legitimate payments to you appear directly in your bank account without any approval needed.'
    ],
    steps: [
      {
        step: 1,
        title: 'Decline the request',
        desc: 'Open PhonePe, Google Pay, or Paytm and tap "Decline" on any unfamiliar request.'
      },
      {
        step: 2,
        title: 'Do not enter your UPI PIN',
        desc: 'Entering your PIN completes the transfer immediately.'
      },
      {
        step: 3,
        title: 'Block the sender',
        desc: 'Use the in-app option to block the UPI ID (VPA) from sending future requests.'
      }
    ],
    recommendedActionText: 'Analyze another situation'
  },

  guidance_fake_screenshot: {
    id: 'guidance_fake_screenshot',
    badge: 'FAKE PAYMENT CONFIRMATION',
    badgeType: 'warning',
    title: 'Never trust screenshots or forwarded SMS as proof of payment.',
    headline: 'Always verify deposits inside your own banking app or SMS from your bank.',
    whySuspicious: [
      'Scammers use fake payment generator apps to create realistic-looking transaction receipts.',
      'They may claim they accidentally overpaid you and demand that you refund the difference.'
    ],
    steps: [
      {
        step: 1,
        title: 'Check your actual account balance',
        desc: 'Open your banking app and check your transaction history. If funds are not there, you have not been paid.'
      },
      {
        step: 2,
        title: 'Do not send any "refund"',
        desc: 'Never transfer money back to someone claiming an overpayment until you verify the funds with your bank.'
      },
      {
        step: 3,
        title: 'Hold any merchandise or delivery',
        desc: 'Do not dispatch goods or hand over items until the money is securely deposited in your bank.'
      }
    ],
    recommendedActionText: 'Analyze another situation'
  },

  guidance_link_unopened: {
    id: 'guidance_link_unopened',
    badge: 'UNVERIFIED LINK PRECAUTION',
    badgeType: 'warning',
    title: 'Inspect the link structure before clicking.',
    headline: 'Unknown links stay unknown until verified.',
    whySuspicious: [
      'Scammers use shortened links (bit.ly, tinyurl) or deceptive subdomains (e.g. sbi.bank-login.xyz) to hide true destinations.',
      'Legitimate Indian banks use verified official domains (e.g., .sbi, .bank, onlinesbi.sbi, hdfcbank.com) with HTTPS.'
    ],
    steps: [
      {
        step: 1,
        title: 'Do not click directly',
        desc: 'Unfamiliar links can lead to fake login pages or malicious file downloads.'
      },
      {
        step: 2,
        title: 'Inspect the link safely with ClearPay',
        desc: 'Copy the web address and use our Link Inspector to evaluate its domain structure without opening it.'
      },
      {
        step: 3,
        title: 'Navigate independently',
        desc: 'If the message claims to be from a utility or bank, open your browser and navigate to the official website yourself.'
      }
    ],
    recommendedActionText: 'Inspect link with Analyze'
  },

  guidance_general: {
    id: 'guidance_general',
    badge: 'GENERAL SAFETY CHECKLIST',
    badgeType: 'info',
    title: 'When in doubt, pause and verify independently.',
    headline: 'Follow this 4-step safety checklist before taking any action.',
    whySuspicious: [
      'Fraudsters count on high emotion, fear, or excitement to make you bypass normal precautions.',
      'Taking even a 5-minute pause and checking with an independent source stops over 90% of payment scams.'
    ],
    steps: [
      {
        step: 1,
        title: 'Pause before reacting',
        desc: 'Never act while feeling rushed. Real banks give you reasonable time to resolve genuine matters.'
      },
      {
        step: 2,
        title: 'Keep credentials secret',
        desc: 'Never disclose your OTP, UPI PIN, ATM PIN, CVV, passwords, or card numbers to anyone.'
      },
      {
        step: 3,
        title: 'Never install remote screen-sharing apps',
        desc: 'Never install AnyDesk, TeamViewer, QuickSupport, or APK files requested by someone over a call.'
      },
      {
        step: 4,
        title: 'Contact official channels directly',
        desc: 'Use the official customer support number printed on your bank card or official bank statement.'
      }
    ],
    recommendedActionText: 'Analyze a message now'
  },

  urgent_compromise: {
    id: 'urgent_compromise',
    badge: 'URGENT SAFETY ACTION',
    badgeType: 'danger',
    title: 'Immediate steps to protect your money',
    headline: 'Act quickly. The faster you act, the higher the chance of stopping unauthorized transfers.',
    whySuspicious: [
      'If you shared an OTP, entered your UPI PIN, or downloaded a remote app, an unauthorized person may have access to your account.',
      'Banks can freeze your cards or UPI access immediately to stop further debits.'
    ],
    steps: [
      {
        step: 1,
        title: 'Freeze your account or UPI immediately',
        desc: 'Open your banking app and use "Lock Card" / "Freeze UPI", or call your bank\'s 24x7 emergency helpline printed on your card.'
      },
      {
        step: 2,
        title: 'Change passwords and PINs from a clean device',
        desc: 'From a trusted phone or computer, change your netbanking password, UPI MPIN, and linked email passwords.'
      },
      {
        step: 3,
        title: 'Call National Cybercrime Helpline 1930',
        desc: 'In India, dial 1930 immediately or file an incident at cybercrime.gov.in. Calling within the first hour gives banks time to hold stolen funds.'
      },
      {
        step: 4,
        title: 'Uninstall any remote screen-sharing app',
        desc: 'If you installed AnyDesk, TeamViewer, RustDesk, or an APK, turn off Wi-Fi/mobile data immediately and delete the app.'
      },
      {
        step: 5,
        title: 'Save all evidence',
        desc: 'Take screenshots of messages, caller phone numbers, UPI reference numbers (UTR), and bank debit alerts.'
      }
    ],
    recommendedActionText: 'Start again'
  }
};

/**
 * Generates plain-English safety checklist for clipboard export
 */
export function generateChecklistText(guidance) {
  if (!guidance) return '';
  const lines = [
    `ClearPay Safety Guidance: ${guidance.title}`,
    `Summary: ${guidance.headline}`,
    '',
    'Recommended Action Steps:'
  ];
  guidance.steps.forEach((s) => {
    lines.push(`${s.step}. ${s.title}: ${s.desc}`);
  });
  lines.push('');
  lines.push('Notice: Educational guidance only. If money or account access is at risk, contact your bank through a verified official channel.');
  lines.push('National Cybercrime Reporting Helpline: 1930 (India) | cybercrime.gov.in');
  return lines.join('\n');
}
