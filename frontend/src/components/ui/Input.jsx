import React from 'react';

/**
 * Accessible Input component.
 * Links labels, hints, and error messages via htmlFor and aria-describedby.
 */
export default function Input({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  helperText,
  error,
  disabled = false,
  required = false,
  className = '',
  autoComplete,
  ...rest
}) {
  const inputId = id || (name ? `input-${name}` : undefined);
  const helperId = helperText && inputId ? `${inputId}-help` : undefined;
  const errorId = error && inputId ? `${inputId}-error` : undefined;

  const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`form-group ${className}`} style={{ marginBottom: '1rem' }}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span aria-hidden="true" style={{ color: 'var(--danger)', marginLeft: '4px' }}>*</span>}
        </label>
      )}

      {helperText && (
        <p id={helperId} className="form-help">
          {helperText}
        </p>
      )}

      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-describedby={describedBy}
        aria-invalid={error ? 'true' : undefined}
        autoComplete={autoComplete}
        className="text-area"
        style={{
          minHeight: '44px',
          height: '44px',
          padding: '0.5rem 0.75rem',
          resize: 'none'
        }}
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
