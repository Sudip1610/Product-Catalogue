import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../api/catalogue.js';
import type { CategoryItem } from '../api/types.js';
import type { ApiError } from '../api/client.js';

export function useCategories() {
  return useQuery<CategoryItem[], ApiError>({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
  });
}
