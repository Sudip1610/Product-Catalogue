import { apiClient } from './client.js';
import type { CategoryItem, CategoryView, Product } from './types.js';

export async function getFeaturedProducts(): Promise<Product[]> {
  const data = await apiClient<{ items: Product[] }>('/featured');
  return data.items;
}

export async function getCategories(): Promise<CategoryItem[]> {
  const data = await apiClient<{ items: CategoryItem[] }>('/categories');
  return data.items;
}

export async function getCategoryView(slug: string): Promise<CategoryView> {
  return apiClient<CategoryView>(`/categories/${encodeURIComponent(slug)}`);
}

export async function searchProducts(
  q: string,
): Promise<{ items: Product[]; query: string }> {
  return apiClient<{ items: Product[]; query: string }>(
    `/products?q=${encodeURIComponent(q)}`,
  );
}

export async function getProductById(id: string): Promise<Product> {
  const data = await apiClient<{ item: Product }>(
    `/products/${encodeURIComponent(id)}`,
  );
  return data.item;
}
