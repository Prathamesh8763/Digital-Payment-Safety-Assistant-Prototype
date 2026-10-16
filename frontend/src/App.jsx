import React, { useState } from 'react';
import Header from './components/Header';
import TextCheck from './components/TextCheck';
import GuidedCheck from './components/GuidedCheck';
import ImageOCRCheck from './components/ImageOCRCheck';
import UrlQrCheck from './components/UrlQrCheck';
import HistoryDrawer from './components/HistoryDrawer';
import ResultDisplay from './components/ResultDisplay';
import Alert from './components/ui/Alert';
import Card from './components/ui/Card';
import apiClient from './services/apiClient';
import { 
  MessageSquareText, 
  HelpCircle, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  History as HistoryIcon 
} from 'lucide-react';

const HISTORY_STORAGE_KEY = 'payment_safety_assistant_history_v2';

function loadStoredHistory() {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'image' | 'url_qr' | 'guided' | 'history'
  const [language, setLanguage] = useState('en'); // 'en' | 'hi' | 'hinglish'
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState(loadStoredHistory);

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
    } catch {
      // Ignore storage persistence failure
    }
  };

  const handleDeleteHistoryItem = (id) => {
    try {
      const updated = history.filter((item) => item.id !== id);
      setHistory(updated);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const handleClearHistory = () => {
    try {
      setHistory([]);
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const handleSelectHistoryItem = (item) => {
    setResult(item.assessment);
  };

  // Text analysis via centralized apiClient
  const handleAnalyzeText = async (payload) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await apiClient.checkText({ ...payload, language });
      setResult(data);
      saveToHistory(data, 'Text Check', payload.text);
    } catch (err) {
      setError(err.message || 'An error occurred while connecting to the safety assistant server.');
    } finally {
      setLoading(false);
    }
  };

  // Guided analysis via centralized apiClient
  const handleAnalyzeGuided = async (payload) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await apiClient.checkGuided({ ...payload, language });
      setResult(data);
      saveToHistory(data, 'Guided Check', `Claim: ${payload.sender_claim}, Action: ${payload.requested_action}`);
    } catch (err) {
      setError(err.message || 'An error occurred while connecting to the safety assistant server.');
    } finally {
      setLoading(false);
    }
  };

  // URL inspection via centralized apiClient
  const handleAnalyzeUrl = async (payload) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await apiClient.checkUrl({ ...payload, language });
      setResult(data);
      saveToHistory(data, 'Link Inspection', payload.url);
    } catch (err) {
      setError(err.message || 'An error occurred while connecting to the link inspection service.');
    } finally {
      setLoading(false);
    }
  };

  // QR inspection via centralized apiClient
  const handleAnalyzeQr = async (payload) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await apiClient.checkQr({ ...payload, language });
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
      <Header language={language} onLanguageChange={setLanguage} />

      <main>
        {!result ? (
          <Card>
            {/* Primary Navigation Tabs */}
            <nav className="tabs-nav" role="tablist" aria-label="Input mode selection">
              <button
                type="button"
                role="tab"
                id="tab-text"
                aria-controls="panel-text"
                aria-selected={activeTab === 'text'}
                className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
                onClick={() => { setActiveTab('text'); setError(null); }}
              >
                <MessageSquareText size={16} aria-hidden="true" />
                <span>Text Check</span>
              </button>

              <button
                type="button"
                role="tab"
                id="tab-image"
                aria-controls="panel-image"
                aria-selected={activeTab === 'image'}
                className={`tab-btn ${activeTab === 'image' ? 'active' : ''}`}
                onClick={() => { setActiveTab('image'); setError(null); }}
              >
                <ImageIcon size={16} aria-hidden="true" />
                <span>Screenshot OCR</span>
              </button>

              <button
                type="button"
                role="tab"
                id="tab-url_qr"
                aria-controls="panel-url_qr"
                aria-selected={activeTab === 'url_qr'}
                className={`tab-btn ${activeTab === 'url_qr' ? 'active' : ''}`}
                onClick={() => { setActiveTab('url_qr'); setError(null); }}
              >
                <LinkIcon size={16} aria-hidden="true" />
                <span>Link & QR</span>
              </button>

              <button
                type="button"
                role="tab"
                id="tab-guided"
                aria-controls="panel-guided"
                aria-selected={activeTab === 'guided'}
                className={`tab-btn ${activeTab === 'guided' ? 'active' : ''}`}
                onClick={() => { setActiveTab('guided'); setError(null); }}
              >
                <HelpCircle size={16} aria-hidden="true" />
                <span>"I'm Not Sure"</span>
              </button>

              <button
                type="button"
                role="tab"
                id="tab-history"
                aria-controls="panel-history"
                aria-selected={activeTab === 'history'}
                className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => { setActiveTab('history'); setError(null); }}
              >
                <HistoryIcon size={16} aria-hidden="true" />
                <span>History ({history.length})</span>
              </button>
            </nav>

            {error && (
              <Alert variant="error" onDismiss={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Tab Panels */}
            {activeTab === 'text' && (
              <div id="panel-text" role="tabpanel" aria-labelledby="tab-text">
                <TextCheck onAnalyze={handleAnalyzeText} loading={loading} />
              </div>
            )}

            {activeTab === 'image' && (
              <div id="panel-image" role="tabpanel" aria-labelledby="tab-image">
                <ImageOCRCheck onAnalyze={handleAnalyzeText} loading={loading} />
              </div>
            )}

            {activeTab === 'url_qr' && (
              <div id="panel-url_qr" role="tabpanel" aria-labelledby="tab-url_qr">
                <UrlQrCheck onAnalyzeUrl={handleAnalyzeUrl} onAnalyzeQr={handleAnalyzeQr} loading={loading} />
              </div>
            )}

            {activeTab === 'guided' && (
              <div id="panel-guided" role="tabpanel" aria-labelledby="tab-guided">
                <GuidedCheck onAnalyze={handleAnalyzeGuided} loading={loading} />
              </div>
            )}

            {activeTab === 'history' && (
              <div id="panel-history" role="tabpanel" aria-labelledby="tab-history">
                <HistoryDrawer
                  history={history}
                  onDeleteItem={handleDeleteHistoryItem}
                  onClearAll={handleClearHistory}
                  onSelectHistoryItem={handleSelectHistoryItem}
                  onClose={() => setActiveTab('text')}
                />
              </div>
            )}
          </Card>
        ) : (
          <ResultDisplay result={result} onReset={handleReset} />
        )}
      </main>

      <footer className="app-footer">
        <p>
          Digital Payment Safety Assistant • V4 Design System & Accessible Architecture
        </p>
        <p style={{ marginTop: '0.25rem', fontSize: 'var(--font-size-xs)' }}>
          Rule-Based Engine with Uncertainty Bounds • Multi-Language Support (EN/HI/Hinglish) • Zero Credential Retention • WCAG 2.2 AA Conformance
        </p>
      </footer>
    </div>
  );
}
