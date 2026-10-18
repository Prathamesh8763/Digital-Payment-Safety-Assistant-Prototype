import React from 'react';

/**
 * Accessible Textarea component.
 * Links labels, hints, and error messages via htmlFor and aria-describedby.
 * Provides character count indicator.
 */
export default function Textarea({
  id,
  name,
  label,
  value = '',
  onChange,
  placeholder,
  helperText,
  error,
  disabled = false,
  required = false,
  maxLength,
  showCount = false,
  rows = 5,
  className = '',
  ...rest
}) {
  const textareaId = id || (name ? `textarea-${name}` : 'analysis-textarea');
  const helperId = helperText ? `${textareaId}-help` : undefined;
  const errorId = error ? `${textareaId}-error` : undefined;

  const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined;

  const currentLength = (value || '').length;

  return (
    <div className={`form-group ${className}`} style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        {label && (
          <label htmlFor={textareaId} className="form-label">
            {label}
            {required && <span aria-hidden="true" style={{ color: 'var(--danger)', marginLeft: '4px' }}>*</span>}
          </label>
        )}
        {showCount && (
          <span
            aria-live="off"
            style={{
              fontSize: 'var(--font-size-xs)',
              color: maxLength && currentLength >= maxLength ? 'var(--danger)' : 'var(--text-muted)'
            }}
          >
            {currentLength}{maxLength ? ` / ${maxLength}` : ' characters'}
          </span>
        )}
      </div>

      {helperText && (
        <p id={helperId} className="form-help">
          {helperText}
        </p>
      )}

      <textarea
        id={textareaId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        maxLength={maxLength}
        aria-describedby={describedBy}
        aria-invalid={error ? 'true' : undefined}
        className="text-area"
        {...rest}
      />

      {error && (
        <p id={errorId} role="alert" style={{ color: 'var(--danger)', fontSize: 'var(--font-size-xs)', marginTop: '0.35rem', fontWeight: '500' }}>
          {error}
        </p>
      )}
    </div>
  );
}
