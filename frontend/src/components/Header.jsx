import React from 'react';
import { ShieldCheck, Lock, AlertCircle } from 'lucide-react';

export default function Header() {
  return (
    <header className="app-header">
      <div className="app-title-row">
        <ShieldCheck className="app-logo" />
        <h1 className="app-title">Digital Payment Safety Assistant</h1>
      </div>
      <p className="app-subtitle">
        Help yourself and family members spot payment scams, pause before acting, and learn safe digital payment habits.
      </p>

      <div className="privacy-banner" role="status">
        <Lock size={20} />
        <div>
          <strong>Privacy by Design:</strong> We never ask for or store your UPI PIN, OTP, card CVV, passwords, or bank account numbers.
        </div>
      </div>
    </header>
  );
}
