import { z } from 'zod';
import type { ProductRepository } from '../domain/ports.js';
import type { Product } from '../domain/product.js';
import { UpstreamError } from '../domain/errors.js';

// ── Zod schema for a single upstream product ────────────────────────────
const upstreamRatingSchema = z.object({
  rate: z.number(),
  count: z.number().int(),
});

const upstreamProductSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string(),
  price: z.number().nonnegative(),
  category: z.string().min(1),
  image: z.string().url(),
  rating: upstreamRatingSchema,
});

const upstreamProductsSchema = z.array(upstreamProductSchema);
const upstreamCategoriesSchema = z.array(z.string().min(1));

type UpstreamProduct = z.infer<typeof upstreamProductSchema>;

// ── Adapter config ──────────────────────────────────────────────────────
export interface FakeStoreConfig {
  baseUrl: string;
  currency: string;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 5_000;

// ── Adapter ─────────────────────────────────────────────────────────────
export class FakeStoreProductRepository implements ProductRepository {
  private readonly baseUrl: string;
  private readonly currency: string;
  private readonly timeoutMs: number;

  constructor(cfg: FakeStoreConfig) {
    this.baseUrl = cfg.baseUrl.replace(/\/$/, '');
    this.currency = cfg.currency;
    this.timeoutMs = cfg.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async listAll(): Promise<Product[]> {
    const data = await this.fetchJson(`${this.baseUrl}/products`, upstreamProductsSchema);
    return data.map((p) => this.toProduct(p));
  }

  async getById(id: string): Promise<Product | null> {
    // FakeStore returns 404-ish for unknown IDs (or an empty object)
    // We treat any non-product response as "not found"
    try {
      const data = await this.fetchJson(
        `${this.baseUrl}/products/${encodeURIComponent(id)}`,
        upstreamProductSchema,
      );
      return this.toProduct(data);
    } catch (err) {
      // If validation fails (e.g. empty body for unknown ID), treat as not found
      if (err instanceof UpstreamError && err.message.includes('Validation')) {
        return null;
      }
      throw err;
    }
  }

  async listCategories(): Promise<string[]> {
    return this.fetchJson(`${this.baseUrl}/products/categories`, upstreamCategoriesSchema);
  }

  // ── private helpers ──────────────────────────────────────────────────

  private async fetchJson<T>(url: string, schema: z.ZodType<T>): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new UpstreamError(`Request to ${url} timed out after ${this.timeoutMs}ms`, err);
      }
      throw new UpstreamError(`Network error fetching ${url}: ${String(err)}`, err);
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      throw new UpstreamError(
        `Upstream responded with ${response.status} ${response.statusText} for ${url}`,
      );
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch (err) {
      throw new UpstreamError(`Failed to parse JSON from ${url}`, err);
    }

    const result = schema.safeParse(body);
    if (!result.success) {
      throw new UpstreamError(
        `Validation failed for response from ${url}: ${result.error.message}`,
        result.error,
      );
    }

    return result.data;
  }

  private toProduct(p: UpstreamProduct): Product {
    return {
      id: String(p.id),
      title: p.title,
      description: p.description,
      price: p.price,
      currency: this.currency,
      category: p.category,
      imageUrl: p.image,
      rating: { average: p.rating.rate, count: p.rating.count },
    };
  }
}
