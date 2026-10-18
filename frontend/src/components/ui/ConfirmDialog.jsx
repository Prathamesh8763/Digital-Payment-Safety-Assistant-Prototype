import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

/**
 * Accessible confirmation dialog for destructive actions (e.g. clearing history).
 */
export default function ConfirmDialog({
  isOpen,
  title = 'Confirm Action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'destructive' // 'destructive' | 'primary'
}) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', margin: '0.5rem 0 1.25rem' }}>
        <div
          style={{
            background: variant === 'destructive' ? 'var(--color-danger-100)' : 'var(--color-primary-100)',
            color: variant === 'destructive' ? 'var(--color-danger-600)' : 'var(--color-primary-600)',
            padding: '0.5rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <AlertTriangle size={24} aria-hidden="true" />
        </div>
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
          {message}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border-default)', paddingTop: '1rem' }}>
        <Button variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'destructive' ? 'danger' : 'primary'}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
