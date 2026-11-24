import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSearch } from '../hooks/useSearch.js';
import { ProductGrid } from '../features/catalogue/ProductGrid.js';
import { Spinner } from '../components/ui/Spinner.js';
import { ErrorMessage } from '../components/ui/ErrorMessage.js';

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const trimmed = q.trim();

  const isQueryTooShort = trimmed.length > 0 && trimmed.length < 2;
  const isQueryEmpty = trimmed.length === 0;

  const { data, isLoading, error, refetch } = useSearch(q);

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

  const resultCountStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-muted)',
    marginTop: 'var(--space-1)',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Search Results</h1>
        {!isQueryEmpty && !isQueryTooShort && data && (
          <p style={resultCountStyle}>
            Found {data.items.length} {data.items.length === 1 ? 'product' : 'products'} for &ldquo;{trimmed}&rdquo;
          </p>
        )}
      </div>

      {isQueryEmpty && (
        <div
          role="status"
          style={{
            textAlign: 'center',
            padding: 'var(--space-12) var(--space-4)',
            color: 'var(--color-text-muted)',
          }}
        >
          <p>Please enter a search term in the box above to find products.</p>
        </div>
      )}

      {isQueryTooShort && (
        <div
          role="alert"
          style={{
            textAlign: 'center',
            padding: 'var(--space-8) var(--space-4)',
            color: 'var(--color-text-muted)',
            backgroundColor: 'var(--color-bg-subtle)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <p>Search query must be at least 2 characters long.</p>
        </div>
      )}

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" ariaLabel="Searching products..." />
        </div>
      )}

      {error && (
        <ErrorMessage
          message={error.message || 'Search failed. Please try again.'}
          onRetry={() => void refetch()}
        />
      )}

      {data && (
        <ProductGrid
          products={data.items}
          emptyMessage={`No products found matching "${trimmed}". Try another query.`}
        />
      )}
    </div>
  );
};
