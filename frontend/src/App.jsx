import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TextCheck from './components/TextCheck';
import GuidedCheck from './components/GuidedCheck';
import ImageOCRCheck from './components/ImageOCRCheck';
import UrlQrCheck from './components/UrlQrCheck';
import HistoryDrawer from './components/HistoryDrawer';
import ResultDisplay from './components/ResultDisplay';
import { 
  MessageSquareText, 
  HelpCircle, 
  AlertCircle, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  History as HistoryIcon 
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';
const HISTORY_STORAGE_KEY = 'payment_safety_assistant_history_v2';

export default function App() {
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'image' | 'url_qr' | 'guided' | 'history'
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  // Load history from localStorage on startup
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  // Helper to persist history
  const saveToHistory = (assessment, type, snippet) => {
    try {
      const newRecord = {
        id: 'hist_' + Date.now(),
        timestamp: new Date().toISOString(),
        type: type,
        risk_level: assessment.risk_level,
        risk_score: assessment.risk_score,
        summary: assessment.summary,
        sample_snippet: snippet ? snippet.slice(0, 120) + (snippet.length > 120 ? '...' : '') : undefined,
        assessment: assessment
      };

      const updated = [newRecord, ...history].slice(0, 30); // Max 30 records
      setHistory(updated);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  const handleDeleteHistoryItem = (id) => {
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  };

  const handleSelectHistoryItem = (item) => {
    setResult(item.assessment);
  };

  // Text analysis
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
      saveToHistory(data, 'Text Check', payload.text);
    } catch (err) {
      setError(err.message || 'An error occurred while connecting to the safety assistant server.');
    } finally {
      setLoading(false);
    }
  };

  // Guided analysis
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
      saveToHistory(data, 'Guided Check', `Claim: ${payload.sender_claim}, Action: ${payload.requested_action}`);
    } catch (err) {
      setError(err.message || 'An error occurred while connecting to the safety assistant server.');
    } finally {
      setLoading(false);
    }
  };

  // URL inspection
  const handleAnalyzeUrl = async (payload) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/check/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to inspect link.');
      }

      const data = await response.json();
      setResult(data);
      saveToHistory(data, 'Link Inspection', payload.url);
    } catch (err) {
      setError(err.message || 'An error occurred while connecting to the link inspection service.');
    } finally {
      setLoading(false);
    }
  };

  // QR inspection
  const handleAnalyzeQr = async (payload) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/check/qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to analyze QR code.');
      }

      const data = await response.json();
      setResult(data);
      saveToHistory(data, 'QR Inspection', payload.payload);
    } catch (err) {
      setError(err.message || 'An error occurred while connecting to the QR safety inspection service.');
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
            {/* Primary V2 Navigation Tabs */}
            <div className="tabs-nav" role="tablist" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'text'}
                className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
                onClick={() => { setActiveTab('text'); setError(null); }}
              >
                <MessageSquareText size={16} />
                Text Check
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'image'}
                className={`tab-btn ${activeTab === 'image' ? 'active' : ''}`}
                onClick={() => { setActiveTab('image'); setError(null); }}
              >
                <ImageIcon size={16} />
                Screenshot OCR
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'url_qr'}
                className={`tab-btn ${activeTab === 'url_qr' ? 'active' : ''}`}
                onClick={() => { setActiveTab('url_qr'); setError(null); }}
              >
                <LinkIcon size={16} />
                Link & QR
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'guided'}
                className={`tab-btn ${activeTab === 'guided' ? 'active' : ''}`}
                onClick={() => { setActiveTab('guided'); setError(null); }}
              >
                <HelpCircle size={16} />
                "I'm Not Sure"
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'history'}
                className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => { setActiveTab('history'); setError(null); }}
              >
                <HistoryIcon size={16} />
                History ({history.length})
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

            {/* Tab Panels */}
            {activeTab === 'text' && (
              <TextCheck onAnalyze={handleAnalyzeText} loading={loading} />
            )}

            {activeTab === 'image' && (
              <ImageOCRCheck onAnalyze={handleAnalyzeText} loading={loading} />
            )}

            {activeTab === 'url_qr' && (
              <UrlQrCheck onAnalyzeUrl={handleAnalyzeUrl} onAnalyzeQr={handleAnalyzeQr} loading={loading} />
            )}

            {activeTab === 'guided' && (
              <GuidedCheck onAnalyze={handleAnalyzeGuided} loading={loading} />
            )}

            {activeTab === 'history' && (
              <HistoryDrawer
                history={history}
                onDeleteItem={handleDeleteHistoryItem}
                onClearAll={handleClearHistory}
                onSelectHistoryItem={handleSelectHistoryItem}
                onClose={() => setActiveTab('text')}
              />
            )}
          </div>
        ) : (
          <ResultDisplay result={result} onReset={handleReset} />
        )}
      </main>

      <footer className="app-footer">
        <p>
          Digital Payment Safety Assistant • V2 Multi-Modal Platform
        </p>
        <p style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>
          Rule-Based Detection Engine • On-Device OCR & QR Inspection • Local-First History • Zero Payment Credential Collection
        </p>
      </footer>
    </div>
  );
}
