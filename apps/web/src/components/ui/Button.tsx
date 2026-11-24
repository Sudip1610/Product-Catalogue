import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', style, children, ...props }, ref) => {
    const baseStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'var(--font-weight-medium)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid transparent',
      cursor: props.disabled ? 'not-allowed' : 'pointer',
      opacity: props.disabled ? 0.6 : 1,
      transition: 'background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast)',
      ...(size === 'sm' && {
        padding: 'var(--space-1) var(--space-3)',
        fontSize: 'var(--font-size-xs)',
      }),
      ...(size === 'md' && {
        padding: 'var(--space-2) var(--space-4)',
        fontSize: 'var(--font-size-sm)',
      }),
      ...(size === 'lg' && {
        padding: 'var(--space-3) var(--space-6)',
        fontSize: 'var(--font-size-base)',
      }),
      ...(variant === 'primary' && {
        backgroundColor: 'var(--color-primary)',
        color: 'var(--color-primary-contrast)',
      }),
      ...(variant === 'secondary' && {
        backgroundColor: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text-main)',
      }),
      ...(variant === 'danger' && {
        backgroundColor: 'var(--color-danger)',
        color: 'var(--color-text-inverse)',
      }),
      ...style,
    };

    return (
      <button ref={ref} style={baseStyle} className={className} {...props}>
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
