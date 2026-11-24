import React from 'react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  ariaLabel = 'Loading...',
}) => {
  const pixelSize = size === 'sm' ? '1rem' : size === 'lg' ? '2.5rem' : '1.75rem';

  const style: React.CSSProperties = {
    display: 'inline-block',
    width: pixelSize,
    height: pixelSize,
    border: '3px solid var(--color-border)',
    borderTopColor: 'var(--color-primary)',
    borderRadius: 'var(--radius-full)',
    animation: 'spin 0.8s linear infinite',
  };

  return (
    <>
      <style>
        {`@keyframes spin { to { transform: rotate(360deg); } }`}
      </style>
      <div
        role="status"
        aria-label={ariaLabel}
        style={style}
      >
        <span className="visually-hidden">{ariaLabel}</span>
      </div>
    </>
  );
};
