import type { ProductRepository } from '../domain/ports.js';
import type { Product } from '../domain/product.js';
import pino from 'pino';

const logger = pino({ name: 'CachingProductRepository' });

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class CachingProductRepository implements ProductRepository {
  private allCache: CacheEntry<Product[]> | null = null;
  private categoriesCache: CacheEntry<string[]> | null = null;
  private readonly ttlMs: number;

  constructor(
    private readonly inner: ProductRepository,
    ttlSeconds: number,
  ) {
    this.ttlMs = ttlSeconds * 1_000;
  }

  async listAll(): Promise<Product[]> {
    if (this.allCache && Date.now() < this.allCache.expiresAt) {
      return this.allCache.data;
    }
    try {
      const data = await this.inner.listAll();
      this.allCache = { data, expiresAt: Date.now() + this.ttlMs };
      return data;
    } catch (err) {
      if (this.allCache) {
        logger.warn({ err }, 'Upstream failed – serving stale listAll cache');
        return this.allCache.data;
      }
      throw err;
    }
  }

  async getById(id: string): Promise<Product | null> {
    // Check all-products cache first (avoids an extra upstream call)
    if (this.allCache && Date.now() < this.allCache.expiresAt) {
      return this.allCache.data.find((p) => p.id === id) ?? null;
    }
    // Fall through to inner — no per-ID caching to keep it simple
    return this.inner.getById(id);
  }

  async listCategories(): Promise<string[]> {
    if (this.categoriesCache && Date.now() < this.categoriesCache.expiresAt) {
      return this.categoriesCache.data;
    }
    try {
      const data = await this.inner.listCategories();
      this.categoriesCache = { data, expiresAt: Date.now() + this.ttlMs };
      return data;
    } catch (err) {
      if (this.categoriesCache) {
        logger.warn({ err }, 'Upstream failed – serving stale listCategories cache');
        return this.categoriesCache.data;
      }
      throw err;
    }
  }

  /** Test / internal helper: clear all cached entries */
  clearCache(): void {
    this.allCache = null;
    this.categoriesCache = null;
  }

  /** Test helper: check whether the all-products cache is populated */
  hasCachedAll(): boolean {
    return this.allCache !== null && Date.now() < this.allCache.expiresAt;
  }
}
