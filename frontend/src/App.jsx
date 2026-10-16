import React, { useState } from 'react';
import Header from './components/Header';
import TextCheck from './components/TextCheck';
import GuidedCheck from './components/GuidedCheck';
import ResultDisplay from './components/ResultDisplay';
import { MessageSquareText, HelpCircle, AlertCircle } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'guided'
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyzeText = async (payload) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/check/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to analyze situation. Please check your connection.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'An error occurred while connecting to the safety assistant server.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeGuided = async (payload) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/check/guided`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to analyze answers. Please check your connection.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'An error occurred while connecting to the safety assistant server.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="container">
      <Header />

      <main>
        {!result ? (
          <div className="card">
            {/* Tabs Navigation */}
            <div className="tabs-nav" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'text'}
                className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
                onClick={() => { setActiveTab('text'); setError(null); }}
              >
                <MessageSquareText size={18} />
                Text Safety Check
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'guided'}
                className={`tab-btn ${activeTab === 'guided' ? 'active' : ''}`}
                onClick={() => { setActiveTab('guided'); setError(null); }}
              >
                <HelpCircle size={18} />
                "I'm Not Sure" Guided Mode
              </button>
            </div>

            {error && (
              <div 
                style={{ 
                  background: '#fef2f2', 
                  border: '1px solid #fca5a5', 
                  color: '#991b1b', 
                  padding: '0.75rem 1rem', 
                  borderRadius: '8px', 
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem'
                }}
                role="alert"
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Active Tab Form */}
            {activeTab === 'text' ? (
              <TextCheck onAnalyze={handleAnalyzeText} loading={loading} />
            ) : (
              <GuidedCheck onAnalyze={handleAnalyzeGuided} loading={loading} />
            )}
          </div>
        ) : (
          <ResultDisplay result={result} onReset={handleReset} />
        )}
      </main>

      <footer className="app-footer">
        <p>
          Digital Payment Safety Assistant • Designed for real-world user safety & scam prevention.
        </p>
        <p style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>
          Rule-based Safety Engine • Free of tracker cookies • No financial credentials stored
        </p>
      </footer>
    </div>
  );
}
