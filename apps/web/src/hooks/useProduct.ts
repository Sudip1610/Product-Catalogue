import { useQuery } from '@tanstack/react-query';
import { getProductById } from '../api/catalogue.js';
import type { Product } from '../api/types.js';
import type { ApiError } from '../api/client.js';

export function useProduct(id: string) {
  return useQuery<Product, ApiError>({
    queryKey: ['product', id],
    queryFn: () => getProductById(id),
    enabled: Boolean(id),
  });
}
