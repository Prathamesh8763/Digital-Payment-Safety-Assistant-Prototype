import React, { useState } from 'react';
import { History, Trash2, Download, ArrowLeft } from 'lucide-react';
import Button from './ui/Button';
import Badge from './ui/Badge';
import ConfirmDialog from './ui/ConfirmDialog';

export default function HistoryDrawer({ history, onDeleteItem, onClearAll, onSelectHistoryItem, onClose }) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `safety_analysis_history_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleConfirmClear = () => {
    setIsConfirmOpen(false);
    onClearAll();
  };

  return (
    <div className="history-drawer-container" aria-label="Local Analysis History">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-lg)', color: 'var(--color-text-primary)' }}>
          <History size={20} style={{ color: 'var(--primary)' }} aria-hidden="true" />
          Local Analysis History & Saved Reports
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          leftIcon={ArrowLeft}
          style={{ padding: '0.35rem 0.75rem', fontSize: 'var(--font-size-xs)', minHeight: '32px' }}
        >
          Back
        </Button>
      </div>

      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '1rem', background: 'var(--color-bg-subtle)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
        🔒 <strong>Local-First Storage:</strong> Analysis summaries are stored only on your browser's local device storage. Raw credentials, full passwords, and payment secrets are never stored.
      </div>

      {(!history || history.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
          No saved analyses yet. Completed safety checks will appear here automatically.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={handleExportJson}
              leftIcon={Download}
              style={{ padding: '0.35rem 0.75rem', fontSize: 'var(--font-size-xs)', minHeight: '32px' }}
            >
              Export Report (JSON)
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setIsConfirmOpen(true)}
              leftIcon={Trash2}
              style={{ padding: '0.35rem 0.75rem', fontSize: 'var(--font-size-xs)', minHeight: '32px' }}
            >
              Clear All History
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {history.map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}
              >
                <div
                  style={{ flex: 1, cursor: 'pointer' }}
                  onClick={() => onSelectHistoryItem(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectHistoryItem(item);
                    }
                  }}
                  aria-label={`View analysis from ${new Date(item.timestamp).toLocaleString()}: ${item.summary}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    <Badge level={item.risk_level} size="sm" />
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)' }}>
                      ({item.type || 'Text Check'})
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: '0.2rem' }}>
                    {item.summary}
                  </div>
                  {item.sample_snippet && (
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      "{item.sample_snippet}"
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteItem(item.id)}
                  title="Delete this record"
                  aria-label={`Delete record from ${new Date(item.timestamp).toLocaleString()}`}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-text-subtle)',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    borderRadius: 'var(--radius-xs)',
                    minWidth: '32px',
                    minHeight: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>

          <ConfirmDialog
            isOpen={isConfirmOpen}
            title="Clear All History?"
            message="Are you sure you want to delete all saved safety reports from your browser? This action cannot be undone."
            confirmLabel="Delete All Records"
            cancelLabel="Cancel"
            onConfirm={handleConfirmClear}
            onCancel={() => setIsConfirmOpen(false)}
            variant="destructive"
          />
        </>
      )}
    </div>
  );
}
