import React from 'react';
import { useFeatured } from '../hooks/useFeatured.js';
import { ProductGrid } from '../features/catalogue/ProductGrid.js';
import { Spinner } from '../components/ui/Spinner.js';
import { ErrorMessage } from '../components/ui/ErrorMessage.js';

export const HomePage: React.FC = () => {
  const { data: products, isLoading, error, refetch } = useFeatured();

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-6)',
  };

  const headerStyle: React.CSSProperties = {
    borderBottom: '1px solid var(--color-border)',
    paddingBottom: 'var(--space-4)',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-2xl)',
    fontWeight: 'var(--font-weight-bold)',
    color: 'var(--color-text-main)',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-muted)',
    marginTop: 'var(--space-1)',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Featured Products</h1>
        <p style={subtitleStyle}>Handpicked selections from our product catalogue</p>
      </div>

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" ariaLabel="Loading featured products..." />
        </div>
      )}

      {error && (
        <ErrorMessage
          message={error.message || 'Failed to load featured products.'}
          onRetry={() => void refetch()}
        />
      )}

      {products && <ProductGrid products={products} />}
    </div>
  );
};
