/**
 * @file Card Component
 */

import React from 'react';

export function Card({ children, className = '', title, subtitle, ...props }) {
  return (
    <div className={`card ${className}`} {...props}>
      {(title || subtitle) && (
        <div className="card__header">
          {title && <h3 className="card__title">{title}</h3>}
          {subtitle && <p className="card__subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="card__content">{children}</div>
    </div>
  );
}
