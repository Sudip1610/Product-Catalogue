import React from 'react';
import type { Product } from '../../api/types.js';
import { ProductCard } from './ProductCard.js';

export interface ProductGridProps {
  products: Product[];
  emptyMessage?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  emptyMessage = 'No products found.',
}) => {
  if (products.length === 0) {
    return (
      <div
        role="status"
        style={{
          padding: 'var(--space-8) var(--space-4)',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          backgroundColor: 'var(--color-bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
        }}
      >
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 'var(--space-6)',
  };

  return (
    <div style={gridStyle} data-testid="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
