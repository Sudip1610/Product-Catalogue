import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { SearchPage } from './SearchPage.js';
import { renderWithProviders } from '../test/test-utils.js';

describe('SearchPage', () => {
  it('shows empty prompt when no query is provided', () => {
    renderWithProviders(<SearchPage />, { route: '/search' });

    expect(
      screen.getByText(/please enter a search term/i),
    ).toBeInTheDocument();
  });

  it('short query shows hint and makes no API request', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    renderWithProviders(<SearchPage />, { route: '/search?q=a' });

    expect(
      screen.getByText(/search query must be at least 2 characters long/i),
    ).toBeInTheDocument();

    // No API calls for 1-char query
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('renders only matching products for a valid query', async () => {
    renderWithProviders(<SearchPage />, { route: '/search?q=backpack' });

    // Shows count
    expect(await screen.findByText(/found 1 product for/i)).toBeInTheDocument();
    expect(screen.getByText('Fjallraven Backpack')).toBeInTheDocument();
    expect(screen.queryByText('WD 2TB Elements Portable External Hard Drive')).not.toBeInTheDocument();
  });

  it('shows friendly empty state when nothing matches', async () => {
    renderWithProviders(<SearchPage />, { route: '/search?q=nonexistentquery' });

    expect(
      await screen.findByText(/no products found matching "nonexistentquery"/i),
    ).toBeInTheDocument();
  });
});
