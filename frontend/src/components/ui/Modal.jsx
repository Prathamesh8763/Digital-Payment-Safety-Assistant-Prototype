import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Accessible Modal dialog component using native HTML <dialog> element.
 * Adheres to Modern Web Guidance: uses .showModal() to automatically make outside content inert,
 * natively trap focus, and handle Esc key dismissal.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '540px',
  ariaLabelledBy = 'modal-dialog-title',
  showCloseButton = true
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        try {
          dialog.showModal();
        } catch {
          // Fallback if already open
        }
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Handle native Esc key press or cancel event
  const handleCancel = (e) => {
    e.preventDefault();
    onClose();
  };

  // Light dismiss on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      aria-labelledby={title ? ariaLabelledBy : undefined}
      style={{
        margin: 'auto',
        padding: 0,
        border: '1px solid var(--color-border-medium)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xl)',
        maxWidth: maxWidth,
        width: 'calc(100% - 2rem)',
        background: 'var(--color-bg-surface)',
        color: 'var(--color-text-primary)'
      }}
    >
      <div style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          {title && (
            <h2 id={ariaLabelledBy} style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', margin: 0 }}>
              {title}
            </h2>
          )}
          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '4px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '32px',
                minHeight: '32px'
              }}
            >
              <X size={20} aria-hidden="true" />
            </button>
          )}
        </div>

        <div>{children}</div>
      </div>
      <style>{`
        dialog::backdrop {
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(2px);
        }
      `}</style>
    </dialog>
  );
}
