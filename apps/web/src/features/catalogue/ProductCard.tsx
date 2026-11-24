import React from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../api/types.js';

export interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-bg-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
    textDecoration: 'none',
    color: 'inherit',
    height: '100%',
  };

  const imageContainerStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    padding: 'var(--space-4)',
    height: '220px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottom: '1px solid var(--color-border)',
  };

  const imageStyle: React.CSSProperties = {
    maxHeight: '100%',
    maxWidth: '100%',
    objectFit: 'contain',
  };

  const contentStyle: React.CSSProperties = {
    padding: 'var(--space-4)',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: 'var(--space-2)',
  };

  const categoryStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-xs)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--color-text-muted)',
    fontWeight: 'var(--font-weight-semibold)',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-base)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-text-main)',
    lineHeight: 'var(--line-height-tight)',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  };

  const footerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 'var(--space-3)',
  };

  const priceStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'var(--font-weight-bold)',
    color: 'var(--color-primary)',
  };

  const ratingStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
  };

  return (
    <Link
      to={`/product/${encodeURIComponent(product.id)}`}
      style={cardStyle}
      aria-label={`${product.title}, ${product.currency} ${product.price.toFixed(2)}`}
    >
      <div style={imageContainerStyle}>
        <img
          src={product.imageUrl}
          alt={product.title}
          style={imageStyle}
          loading="lazy"
        />
      </div>
      <div style={contentStyle}>
        <span style={categoryStyle}>{product.category}</span>
        <h3 style={titleStyle}>{product.title}</h3>
        <div style={footerStyle}>
          <span style={priceStyle}>
            {product.currency} {product.price.toFixed(2)}
          </span>
          <span style={ratingStyle} aria-label={`Rating: ${product.rating.average} out of 5 from ${product.rating.count} reviews`}>
            ★ {product.rating.average.toFixed(1)} ({product.rating.count})
          </span>
        </div>
      </div>
    </Link>
  );
};
