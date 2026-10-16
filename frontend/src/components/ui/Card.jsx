import React from 'react';

/**
 * Accessible Card container component
 */
export default function Card({
  as: Component = 'div',
  children,
  className = '',
  style = {},
  role,
  ariaLabel,
  ariaLabelledBy,
  ...rest
}) {
  return (
    <Component
      className={`card ${className}`}
      style={style}
      role={role}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      {...rest}
    >
      {children}
    </Component>
  );
}
