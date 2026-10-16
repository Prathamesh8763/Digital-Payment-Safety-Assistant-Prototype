import React from 'react';
import { History, Trash2, Download, AlertTriangle, ShieldCheck, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function HistoryDrawer({ history, onDeleteItem, onClearAll, onSelectHistoryItem, onClose }) {
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `safety_analysis_history_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getRiskBadge = (level) => {
    if (level === 'HIGH') return <span className="risk-meter" style={{ background: '#fee2e2', color: '#991b1b' }}>HIGH RISK</span>;
    if (level === 'MEDIUM') return <span className="risk-meter" style={{ background: '#fef3c7', color: '#92400e' }}>MEDIUM RISK</span>;
    return <span className="risk-meter" style={{ background: '#d1fae5', color: '#065f46' }}>LOW RISK</span>;
  };

  return (
    <div className="card" style={{ marginTop: '1.5rem', animation: 'fadeIn 0.25s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>
          <History size={20} style={{ color: 'var(--primary)' }} />
          Local Analysis History & Saved Reports
        </div>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-secondary"
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', minHeight: '32px' }}
        >
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
        🔒 <strong>Local-First Storage:</strong> Analysis summaries are stored only on your browser's local device storage. Raw credentials, full passwords, and payment secrets are never stored.
      </div>

      {(!history || history.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          No saved analyses yet. Completed safety checks will appear here automatically.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <button
              type="button"
              onClick={handleExportJson}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', minHeight: '32px' }}
            >
              <Download size={13} /> Export Report (JSON)
            </button>
            <button
              type="button"
              onClick={onClearAll}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', minHeight: '32px', color: '#991b1b' }}
            >
              <Trash2 size={13} /> Clear All History
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {history.map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'white',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}
              >
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => onSelectHistoryItem(item)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    {getRiskBadge(item.risk_level)}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
                      ({item.type || 'Text Check'})
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.2rem' }}>
                    {item.summary}
                  </div>
                  {item.sample_snippet && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      "{item.sample_snippet}"
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteItem(item.id)}
                  title="Delete this record"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    borderRadius: '4px'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#dc2626'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
