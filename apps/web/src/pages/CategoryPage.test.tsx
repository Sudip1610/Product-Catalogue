import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { CategoryPage } from './CategoryPage.js';
import { renderWithProviders } from '../test/test-utils.js';

describe('CategoryPage', () => {
  it('renders both Top Rated and More in this category sections', async () => {
    const route = `/category/${encodeURIComponent("men's clothing")}`;

    renderWithProviders(
      <Routes>
        <Route path="/category/:slug" element={<CategoryPage />} />
      </Routes>,
      { route },
    );

    // Wait for the category heading and sections to load
    expect(await screen.findByRole('heading', { level: 1, name: /men's clothing/i })).toBeInTheDocument();

    // Both sections rendered
    expect(await screen.findByRole('heading', { level: 2, name: /top rated/i })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 2, name: /more in this category/i })).toBeInTheDocument();

    // Verify products are rendered
    expect(screen.getByText('Fjallraven Backpack')).toBeInTheDocument();
    expect(screen.getByText('Mens Casual Slim Fit')).toBeInTheDocument();
    expect(screen.getByText('Mens Cotton Jacket')).toBeInTheDocument();
  });
});
