import { useQuery } from '@tanstack/react-query';
import { searchProducts } from '../api/catalogue.js';
import type { Product } from '../api/types.js';
import type { ApiError } from '../api/client.js';

export function useSearch(query: string) {
  const trimmed = query.trim();
  const isValid = trimmed.length >= 2;

  return useQuery<{ items: Product[]; query: string }, ApiError>({
    queryKey: ['search', trimmed],
    queryFn: () => searchProducts(trimmed),
    enabled: isValid,
  });
}
