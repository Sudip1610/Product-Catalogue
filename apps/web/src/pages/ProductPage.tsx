import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProduct } from '../hooks/useProduct.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import { Spinner } from '../components/ui/Spinner.js';
import { ErrorMessage } from '../components/ui/ErrorMessage.js';
import { EnquiryForm } from '../features/enquiry/EnquiryForm.js';

export const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: product, isLoading, error, refetch } = useProduct(id || '');

  const breadcrumbStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-6)',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 'var(--space-8)',
    alignItems: 'start',
  };

  const imageCardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: 'var(--space-8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '380px',
  };

  const imageStyle: React.CSSProperties = {
    maxHeight: '360px',
    maxWidth: '100%',
    objectFit: 'contain',
  };

  const infoStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  };

  const categoryBadgeStyle: React.CSSProperties = {
    display: 'inline-block',
    fontSize: 'var(--font-size-xs)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--color-primary)',
    fontWeight: 'var(--font-weight-semibold)',
    backgroundColor: 'var(--color-primary-subtle)',
    padding: 'var(--space-1) var(--space-3)',
    borderRadius: 'var(--radius-full)',
    alignSelf: 'flex-start',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-3xl)',
    fontWeight: 'var(--font-weight-bold)',
    color: 'var(--color-text-main)',
    lineHeight: 'var(--line-height-tight)',
  };

  const ratingRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-muted)',
  };

  const priceStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-3xl)',
    fontWeight: 'var(--font-weight-bold)',
    color: 'var(--color-primary)',
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-text-main)',
    lineHeight: 'var(--line-height-relaxed)',
    borderTop: '1px solid var(--color-border)',
    borderBottom: '1px solid var(--color-border)',
    padding: 'var(--space-4) 0',
  };

  return (
    <div>
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
          <Spinner size="lg" ariaLabel="Loading product details..." />
        </div>
      )}

      {error && (
        <ErrorMessage
          message={error.message || 'Failed to load product details.'}
          onRetry={() => void refetch()}
        />
      )}

      {product && (
        <>
          <nav aria-label="Breadcrumb" style={breadcrumbStyle}>
            <Link to="/" style={{ color: 'var(--color-primary)' }}>Home</Link>
            <span>/</span>
            <Link
              to={`/category/${encodeURIComponent(product.category)}`}
              style={{ color: 'var(--color-primary)', textTransform: 'capitalize' }}
            >
              {product.category}
            </Link>
            <span>/</span>
            <span style={{ color: 'var(--color-text-main)', fontWeight: 'var(--font-weight-medium)' }}>
              {product.title}
            </span>
          </nav>

          <div style={gridStyle}>
            <div style={imageCardStyle}>
              <img
                src={product.imageUrl}
                alt={product.title}
                style={imageStyle}
              />
            </div>

            <div style={infoStyle}>
              <Link
                to={`/category/${encodeURIComponent(product.category)}`}
                style={categoryBadgeStyle}
              >
                {product.category}
              </Link>

              <h1 style={titleStyle}>{product.title}</h1>

              <div style={ratingRowStyle}>
                <span aria-label={`Rating: ${product.rating.average} out of 5 stars`}>
                  ★ {product.rating.average.toFixed(1)}
                </span>
                <span>•</span>
                <span>{product.rating.count} customer reviews</span>
              </div>

              <div style={priceStyle}>
                {product.currency} {product.price.toFixed(2)}
              </div>

              <div style={descriptionStyle}>
                <p>{product.description}</p>
              </div>

              <div>
                <Button
                  size="lg"
                  variant="primary"
                  onClick={() => setIsModalOpen(true)}
                  aria-haspopup="dialog"
                >
                  Enquire About Product
                </Button>
              </div>
            </div>
          </div>

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={`Enquire: ${product.title}`}
          >
            <EnquiryForm
              productId={product.id}
              productTitle={product.title}
            />
          </Modal>
        </>
      )}
    </div>
  );
};
