import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header.js';

export const Layout: React.FC = () => {
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  };

  const mainStyle: React.CSSProperties = {
    flex: 1,
    maxWidth: 'var(--container-max-width)',
    width: '100%',
    margin: '0 auto',
    padding: 'var(--space-6) var(--space-4)',
  };

  const footerStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-bg-surface)',
    borderTop: '1px solid var(--color-border)',
    padding: 'var(--space-6) var(--space-4)',
    textAlign: 'center',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-muted)',
    marginTop: 'auto',
  };

  return (
    <div style={containerStyle}>
      <Header />
      <main style={mainStyle}>
        <Outlet />
      </main>
      <footer style={footerStyle}>
        <p>&copy; {new Date().getFullYear()} Product Catalogue PoC. All rights reserved.</p>
      </footer>
    </div>
  );
};
