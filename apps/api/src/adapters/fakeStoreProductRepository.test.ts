import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FakeStoreProductRepository } from '../../src/adapters/fakeStoreProductRepository.js';
import { UpstreamError } from '../../src/domain/errors.js';

// ── Helpers ──────────────────────────────────────────────────────────────

const validUpstreamProduct = {
  id: 1,
  title: 'Fjallraven Backpack',
  description: 'Your perfect pack',
  price: 109.95,
  category: 'electronics',
  image: 'https://fakestoreapi.com/img/81fAn.jpg',
  rating: { rate: 3.9, count: 120 },
};

const validUpstreamProduct2 = {
  id: 2,
  title: 'Mens Casual Premium Slim Fit T-Shirts',
  description: 'Slim-fitting style',
  price: 22.3,
  category: "men's clothing",
  image: 'https://fakestoreapi.com/img/71-3fAn.jpg',
  rating: { rate: 4.1, count: 259 },
};

function mockFetch(body: unknown, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      json: async () => body,
    }),
  );
}

function mockFetchReject(error: Error): void {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));
}

const cfg = { baseUrl: 'https://fakestoreapi.com', currency: 'USD' };

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllGlobals());

// ── listAll ──────────────────────────────────────────────────────────────

describe('FakeStoreProductRepository.listAll', () => {
  it('maps upstream fields to the domain Product shape', async () => {
    mockFetch([validUpstreamProduct]);
    const repo = new FakeStoreProductRepository(cfg);

    const products = await repo.listAll();

    expect(products).toHaveLength(1);
    const p = products[0]!;
    expect(p.id).toBe('1');                       // number → string
    expect(p.imageUrl).toBe(validUpstreamProduct.image); // image → imageUrl
    expect(p.rating.average).toBe(3.9);           // rate → average
    expect(p.rating.count).toBe(120);
    expect(p.currency).toBe('USD');               // injected from config
    expect(p.price).toBe(109.95);
  });

  it('maps multiple products preserving order', async () => {
    mockFetch([validUpstreamProduct, validUpstreamProduct2]);
    const repo = new FakeStoreProductRepository(cfg);

    const products = await repo.listAll();

    expect(products.map((p) => p.id)).toEqual(['1', '2']);
  });

  it('throws UpstreamError when upstream returns a non-200 status', async () => {
    mockFetch({ message: 'Internal Server Error' }, 500);
    const repo = new FakeStoreProductRepository(cfg);

    await expect(repo.listAll()).rejects.toThrow(UpstreamError);
    await expect(repo.listAll()).rejects.toThrow('500');
  });

  it('throws UpstreamError when the response body fails zod validation', async () => {
    // Missing required `title` field
    mockFetch([{ id: 1, price: 10, category: 'x', image: 'https://x.com/img.jpg', rating: { rate: 1, count: 1 } }]);
    const repo = new FakeStoreProductRepository(cfg);

    await expect(repo.listAll()).rejects.toThrow(UpstreamError);
    await expect(repo.listAll()).rejects.toThrow('Validation');
  });

  it('throws UpstreamError when the response body is not an array', async () => {
    mockFetch({ error: 'oops' });
    const repo = new FakeStoreProductRepository(cfg);

    await expect(repo.listAll()).rejects.toThrow(UpstreamError);
  });

  it('throws UpstreamError on network error', async () => {
    mockFetchReject(new Error('ECONNREFUSED'));
    const repo = new FakeStoreProductRepository(cfg);

    await expect(repo.listAll()).rejects.toThrow(UpstreamError);
    await expect(repo.listAll()).rejects.toThrow('Network error');
  });

  it('throws UpstreamError on AbortController timeout', async () => {
    // Simulate an AbortError (name must be 'AbortError')
    const abortErr = Object.assign(new Error('The operation was aborted'), { name: 'AbortError' });
    mockFetchReject(abortErr);
    const repo = new FakeStoreProductRepository({ ...cfg, timeoutMs: 1 });

    await expect(repo.listAll()).rejects.toThrow(UpstreamError);
    await expect(repo.listAll()).rejects.toThrow('timed out');
  });
});

// ── getById ──────────────────────────────────────────────────────────────

describe('FakeStoreProductRepository.getById', () => {
  it('returns the product when found', async () => {
    mockFetch(validUpstreamProduct);
    const repo = new FakeStoreProductRepository(cfg);

    const p = await repo.getById('1');

    expect(p).not.toBeNull();
    expect(p?.id).toBe('1');
  });

  it('returns null when upstream returns malformed data for unknown ID', async () => {
    // Fake Store returns an empty object `{}` for unknown IDs
    mockFetch({});
    const repo = new FakeStoreProductRepository(cfg);

    const p = await repo.getById('9999');

    expect(p).toBeNull();
  });
});

// ── listCategories ────────────────────────────────────────────────────────

describe('FakeStoreProductRepository.listCategories', () => {
  it('returns categories array as-is (preserving FakeStore spellings)', async () => {
    const categories = ['electronics', 'jewelery', "men's clothing", "women's clothing"];
    mockFetch(categories);
    const repo = new FakeStoreProductRepository(cfg);

    const result = await repo.listCategories();

    expect(result).toEqual(categories);
    // Verify FakeStore's unusual spelling is preserved
    expect(result).toContain('jewelery');
  });

  it('throws UpstreamError when categories are not a string array', async () => {
    mockFetch([1, 2, 3]);
    const repo = new FakeStoreProductRepository(cfg);

    await expect(repo.listCategories()).rejects.toThrow(UpstreamError);
  });
});
