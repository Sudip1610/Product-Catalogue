import type { ProductRepository } from '../domain/ports.js';
import type { Product } from '../domain/product.js';
import { NotFoundError } from '../domain/errors.js';

export interface CategoryItem {
  slug: string;
  name: string;
}

export interface CategoryView {
  category: string;
  topRated: Product[];
  others: Product[];
}

export interface ProductServiceConfig {
  featuredProductIds: string[];
  categoryTopRatedCount: number;
}

export class ProductService {
  constructor(
    private readonly repo: ProductRepository,
    private readonly cfg: ProductServiceConfig,
  ) {}

  async getFeatured(): Promise<Product[]> {
    const all = await this.repo.listAll();

    if (this.cfg.featuredProductIds.length === 0) {
      return this.topByRating(all, 5);
    }

    const byId = new Map(all.map((p) => [p.id, p]));
    const featured: Product[] = [];

    for (const id of this.cfg.featuredProductIds) {
      const product = byId.get(id);
      if (product) {
        featured.push(product);
      } else {
        console.warn(`[ProductService] Featured product id "${id}" not found – skipping`);
      }
    }

    // Fallback: if every configured ID was missing, return top 5 by rating
    if (featured.length === 0) {
      console.warn('[ProductService] All featured IDs missing – falling back to top-5 by rating');
      return this.topByRating(all, 5);
    }

    return featured;
  }

  async getCategories(): Promise<CategoryItem[]> {
    const categories = await this.repo.listCategories();
    return categories.map((name) => ({ slug: name, name }));
  }

  async getCategoryView(slug: string): Promise<CategoryView> {
    const all = await this.repo.listAll();
    const categories = await this.repo.listCategories();

    if (!categories.includes(slug)) {
      throw new NotFoundError(`Category "${slug}" not found`);
    }

    const inCategory = all.filter((p) => p.category === slug);
    const sorted = this.sortByRating(inCategory);

    const topRated = sorted.slice(0, this.cfg.categoryTopRatedCount);
    const topRatedIds = new Set(topRated.map((p) => p.id));
    const others = sorted
      .filter((p) => !topRatedIds.has(p.id))
      .sort((a, b) => a.title.localeCompare(b.title));

    return { category: slug, topRated, others };
  }

  async search(q: string): Promise<Product[]> {
    const normalised = q.trim().toLowerCase();
    const words = normalised.split(/\s+/).filter(Boolean);

    if (words.length === 0) return [];

    const all = await this.repo.listAll();

    return all.filter((p) => {
      const haystack = `${p.title} ${p.description} ${p.category}`.toLowerCase();
      return words.every((word) => haystack.includes(word));
    });
  }

  async getById(id: string): Promise<Product> {
    const product = await this.repo.getById(id);
    if (!product) {
      throw new NotFoundError(`Product "${id}" not found`);
    }
    return product;
  }

  // ── private helpers ────────────────────────────────────────────────

  private sortByRating(products: Product[]): Product[] {
    return [...products].sort((a, b) => {
      if (b.rating.average !== a.rating.average) {
        return b.rating.average - a.rating.average;
      }
      if (b.rating.count !== a.rating.count) {
        return b.rating.count - a.rating.count;
      }
      return a.title.localeCompare(b.title);
    });
  }

  private topByRating(products: Product[], n: number): Product[] {
    return this.sortByRating(products).slice(0, n);
  }
}
