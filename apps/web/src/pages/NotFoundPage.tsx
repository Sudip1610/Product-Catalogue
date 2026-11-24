import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button.js';

export const NotFoundPage: React.FC = () => {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: 'var(--space-12) var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-4)',
      }}
    >
      <h1 style={{ fontSize: 'var(--font-size-3xl)' }}>404 - Page Not Found</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>
        The page you are looking for does not exist.
      </p>
      <Link to="/">
        <Button variant="primary">Return to Home</Button>
      </Link>
    </div>
  );
};
