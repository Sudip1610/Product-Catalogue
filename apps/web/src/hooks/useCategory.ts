import { useQuery } from '@tanstack/react-query';
import { getCategoryView } from '../api/catalogue.js';
import type { CategoryView } from '../api/types.js';
import type { ApiError } from '../api/client.js';

export function useCategory(slug: string) {
  return useQuery<CategoryView, ApiError>({
    queryKey: ['category', slug],
    queryFn: () => getCategoryView(slug),
    enabled: Boolean(slug),
  });
}
