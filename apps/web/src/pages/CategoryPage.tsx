import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCategory } from '../hooks/useCategory.js';
import { ProductGrid } from '../features/catalogue/ProductGrid.js';
import { Spinner } from '../components/ui/Spinner.js';
import { ErrorMessage } from '../components/ui/ErrorMessage.js';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const decodedSlug = slug ? decodeURIComponent(slug) : '';

  const { data, isLoading, error, refetch } = useCategory(decodedSlug);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-8)',
  };

  const breadcrumbStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-2xl)',
    fontWeight: 'var(--font-weight-bold)',
    textTransform: 'capitalize',
    color: 'var(--color-text-main)',
  };

  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  };

  const sectionHeadingStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-xl)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-text-main)',
    borderBottom: '1px solid var(--color-border)',
    paddingBottom: 'var(--space-2)',
  };

  return (
    <div style={containerStyle}>
      <div>
        <nav aria-label="Breadcrumb" style={breadcrumbStyle}>
          <Link to="/" style={{ color: 'var(--color-primary)' }}>Home</Link>
          <span>/</span>
          <span style={{ textTransform: 'capitalize' }}>{decodedSlug}</span>
        </nav>
        <h1 style={titleStyle}>{decodedSlug}</h1>
      </div>

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" ariaLabel="Loading category products..." />
        </div>
      )}

      {error && (
        <ErrorMessage
          message={error.message || 'Failed to load category products.'}
          onRetry={() => void refetch()}
        />
      )}

      {data && (
        <>
          <section style={sectionStyle} aria-labelledby="top-rated-heading">
            <h2 id="top-rated-heading" style={sectionHeadingStyle}>
              Top Rated
            </h2>
            <ProductGrid products={data.topRated} emptyMessage="No top rated products in this category." />
          </section>

          {data.others.length > 0 && (
            <section style={sectionStyle} aria-labelledby="more-heading">
              <h2 id="more-heading" style={sectionHeadingStyle}>
                More in this category
              </h2>
              <ProductGrid products={data.others} />
            </section>
          )}
        </>
      )}
    </div>
  );
};
