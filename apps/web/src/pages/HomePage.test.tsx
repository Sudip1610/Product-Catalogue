import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { HomePage } from './HomePage.js';
import { renderWithProviders } from '../test/test-utils.js';

describe('HomePage', () => {
  it('renders 5 featured products', async () => {
    renderWithProviders(<HomePage />);

    // Heading exists
    expect(screen.getByRole('heading', { level: 1, name: /featured products/i })).toBeInTheDocument();

    // 5 products loaded from MSW handlers
    const productTitles = await screen.findAllByRole('heading', { level: 3 });
    expect(productTitles).toHaveLength(5);
    expect(screen.getByText('Fjallraven Backpack')).toBeInTheDocument();
    expect(screen.getByText('WD 2TB Elements Portable External Hard Drive')).toBeInTheDocument();
  });
});
