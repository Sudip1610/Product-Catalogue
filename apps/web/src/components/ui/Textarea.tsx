import React from 'react';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  id?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, id, style, className = '', ...props }, ref) => {
    const textareaId = id || props.name;

    const containerStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-1)',
      width: '100%',
    };

    const labelStyle: React.CSSProperties = {
      fontSize: 'var(--font-size-sm)',
      fontWeight: 'var(--font-weight-medium)',
      color: 'var(--color-text-main)',
    };

    const textareaStyle: React.CSSProperties = {
      padding: 'var(--space-2) var(--space-3)',
      fontSize: 'var(--font-size-base)',
      borderRadius: 'var(--radius-md)',
      border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
      backgroundColor: 'var(--color-bg-surface)',
      color: 'var(--color-text-main)',
      outline: 'none',
      width: '100%',
      minHeight: '100px',
      resize: 'vertical',
      boxSizing: 'border-box',
      ...style,
    };

    const errorStyle: React.CSSProperties = {
      fontSize: 'var(--font-size-xs)',
      color: 'var(--color-danger)',
    };

    return (
      <div style={containerStyle}>
        {label && textareaId && (
          <label htmlFor={textareaId} style={labelStyle}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          style={textareaStyle}
          className={className}
          {...props}
        />
        {error && <span role="alert" style={errorStyle}>{error}</span>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
