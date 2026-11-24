import { useQuery } from '@tanstack/react-query';
import { getFeaturedProducts } from '../api/catalogue.js';
import type { Product } from '../api/types.js';
import type { ApiError } from '../api/client.js';

export function useFeatured() {
  return useQuery<Product[], ApiError>({
    queryKey: ['products', 'featured'],
    queryFn: () => getFeaturedProducts(),
  });
}
