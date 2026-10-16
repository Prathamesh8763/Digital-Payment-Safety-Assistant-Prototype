from typing import Dict, Any, List

# Reviewed translations for Indian Digital Payment Context (FR-05)

TRANSLATIONS: Dict[str, Dict[str, Any]] = {
    "hi": {
        "risk_titles": {
            "HIGH": "उच्च जोखिम: संभावित भुगतान धोखाधड़ी (High Risk)",
            "MEDIUM": "मध्यम जोखिम: संदिग्ध चेतावनी संकेत मिले हैं (Medium Risk)",
            "LOW": "कम जोखिम: कोई स्पष्ट धोखाधड़ी संकेत नहीं मिला (Low Risk)",
            "UNABLE_TO_ASSESS": "मूल्यांकन करने में असमर्थ (Insufficient Data)"
        },
        "default_actions": {
            "HIGH": [
                "तुरंत रुकें। कोई भी भुगतान न करें और किसी अनजान लिंक पर क्लिक न करें।",
                "अपना यूपीआई पिन (UPI PIN), एटीएम पिन, ओटीपी या पासवर्ड कभी किसी के साथ साझा न करें।",
                "बैंक के आधिकारिक ऐप या अपने डेबिट कार्ड के पीछे दिए गए नंबर पर सीधे संपर्क करके जांचें।"
            ],
            "MEDIUM": [
                "सावधानी बरतें। भुगतान करने या जानकारी देने से पहले स्वतंत्र रूप से पुष्टि करें।",
                "किसी अनजान व्यक्ति के कहने पर एनीडेस्क (AnyDesk) या स्क्रीन शेयर ऐप डाउनलोड न करें।"
            ],
            "LOW": [
                "सामान्य सावधानी बरतें। अपने बैंक ऐप में लेन-देन विवरण हमेशा सत्यापित करें।",
                "कम जोखिम का मतलब यह नहीं है कि लेन-देन की गारंटी है। कभी भी अनजान व्यक्ति को पिन न दें।"
            ]
        },
        "golden_rules": {
            "upi_pin": "💡 स्वर्णिम नियम: यूपीआई पिन केवल पैसे भेजने/काटने के लिए होता है। पैसे प्राप्त करने के लिए कभी पिन नहीं डालना होता।",
            "bank_impersonation": "💡 स्वर्णिम नियम: बैंक अधिकारी कभी भी फोन पर ओटीपी या पासवर्ड नहीं मांगते।",
            "advance_fee": "💡 स्वर्णिम नियम: अगर कोई इनाम पाने के लिए पहले पैसे मांगे, तो वह इनाम नहीं, धोखाधड़ी है।",
            "remote_access": "💡 स्वर्णिम नियम: अनजान कॉलर के कहने पर एनीडेस्क या टीमव्यूअर कभी इंस्टॉल न करें।"
        },
        "uncertainty": "यह मूल्यांकन उपलब्ध संकेतों पर आधारित है। कम जोखिम का अर्थ पूर्ण सुरक्षा की गारंटी नहीं है।"
    },
    "hinglish": {
        "risk_titles": {
            "HIGH": "HIGH RISK: Sambhavit Payment Scam / Fraud",
            "MEDIUM": "MEDIUM RISK: Kuch Sandigdh Signs / Warning Mile Hain",
            "LOW": "LOW RISK: Koi Direct Scam Sign Nahi Mila",
            "UNABLE_TO_ASSESS": "Unable to Assess: Adhuri Jankari"
        },
        "default_actions": {
            "HIGH": [
                "Turant rukein! Koi bhi payment na karein aur anjaan link par click na karein.",
                "Apna UPI PIN, OTP, ATM PIN ya password kisi ke sath bhi share na karein.",
                "Bank ke official app ya debit card ke piche likhe toll-free number par call karke verify karein."
            ],
            "MEDIUM": [
                "Savdhani rakhein! Payment karne se pehle independent tareeqe se confirm karein.",
                "Kisi anjaan caller ke kehne par AnyDesk ya QuickSupport app install na karein."
            ],
            "LOW": [
                "Normal payment caution rakhein. Apne official banking app me balance verify karein.",
                "Low risk ka matlab 100% safe guarantee nahi hai. OTP/PIN kisi ko na batayein."
            ]
        },
        "golden_rules": {
            "upi_pin": "💡 Golden Rule: UPI PIN sirf paise bhejne (debit) ke liye hota hai. Paise lene ya receive karne ke liye kabhi PIN nahi lagta.",
            "bank_impersonation": "💡 Golden Rule: Bank wale kabhi phone par OTP ya PIN nahi maangte.",
            "advance_fee": "💡 Golden Rule: Agar prize paane ke liye pehle paise ya registration fee maangi jaye, toh woh 100% scam hai.",
            "remote_access": "💡 Golden Rule: Anjaan caller ke kehne par kabhi AnyDesk/TeamViewer app download na karein."
        },
        "uncertainty": "Yeh result detectable warning signs par aadharit hai. Low risk ka matlab yeh nahi ki samne wala 100% genuine hai."
    }
}

def localize_assessment(
    language: str,
    risk_level: str,
    recommended_actions: List[str],
    golden_rule: str,
    uncertainty_note: str
) -> Dict[str, Any]:
    """
    Translates or supplements the safety recommendations into Hindi or Hinglish
    when requested by the user, while preserving the evidence facts.
    """
    lang = (language or "en").lower().strip()
    if lang not in TRANSLATIONS:
        return {
            "localized_actions": recommended_actions,
            "localized_golden_rule": golden_rule,
            "localized_uncertainty": uncertainty_note
        }

    lang_pack = TRANSLATIONS[lang]
    actions = lang_pack["default_actions"].get(risk_level, recommended_actions)

    # Localize golden rule
    loc_rule = golden_rule
    if "upi" in golden_rule.lower() or "pin" in golden_rule.lower():
        loc_rule = lang_pack["golden_rules"]["upi_pin"]
    elif "prize" in golden_rule.lower() or "fee" in golden_rule.lower():
        loc_rule = lang_pack["golden_rules"]["advance_fee"]
    elif "remote" in golden_rule.lower() or "anydesk" in golden_rule.lower():
        loc_rule = lang_pack["golden_rules"]["remote_access"]
    elif "bank" in golden_rule.lower():
        loc_rule = lang_pack["golden_rules"]["bank_impersonation"]

    return {
        "localized_actions": actions,
        "localized_golden_rule": loc_rule,
        "localized_uncertainty": lang_pack["uncertainty"]
    }
