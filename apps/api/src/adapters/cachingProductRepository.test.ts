import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CachingProductRepository } from '../../src/adapters/cachingProductRepository.js';
import { FakeProductRepository, makeProduct, resetIdCounter } from '../../test/fakes.js';
import { UpstreamError } from '../../src/domain/errors.js';

beforeEach(() => resetIdCounter());

// ── Helper: a repo that tracks call counts ───────────────────────────────

class CountingRepo extends FakeProductRepository {
  listAllCalls = 0;
  listCategoriesCalls = 0;

  override async listAll() {
    this.listAllCalls++;
    return super.listAll();
  }

  override async listCategories() {
    this.listCategoriesCalls++;
    return super.listCategories();
  }
}

// ── Basic caching behaviour ──────────────────────────────────────────────

describe('CachingProductRepository', () => {
  it('calls inner.listAll only once within TTL', async () => {
    const inner = new CountingRepo([makeProduct()]);
    const cached = new CachingProductRepository(inner, 60);

    await cached.listAll();
    await cached.listAll();
    await cached.listAll();

    expect(inner.listAllCalls).toBe(1);
  });

  it('calls inner.listCategories only once within TTL', async () => {
    const inner = new CountingRepo([makeProduct({ category: 'electronics' })]);
    const cached = new CachingProductRepository(inner, 60);

    await cached.listCategories();
    await cached.listCategories();

    expect(inner.listCategoriesCalls).toBe(1);
  });

  it('re-fetches after TTL expires', async () => {
    vi.useFakeTimers();
    const inner = new CountingRepo([makeProduct()]);
    // 1-second TTL
    const cached = new CachingProductRepository(inner, 1);

    await cached.listAll();
    expect(inner.listAllCalls).toBe(1);

    // Advance clock past TTL
    vi.advanceTimersByTime(2_000);

    await cached.listAll();
    expect(inner.listAllCalls).toBe(2);

    vi.useRealTimers();
  });

  it('returns cached data and logs a warning when upstream fails (stale-on-error)', async () => {
    vi.useFakeTimers();
    const products = [makeProduct()];
    const inner = new CountingRepo(products);
    const cached = new CachingProductRepository(inner, 60);

    // Prime the cache
    const first = await cached.listAll();
    expect(first).toHaveLength(1);
    expect(inner.listAllCalls).toBe(1);

    // Advance past TTL so the cache is stale
    vi.advanceTimersByTime(61_000);

    // Make inner fail on the next attempt
    vi.spyOn(inner, 'listAll').mockRejectedValueOnce(new UpstreamError('upstream down'));

    // Should serve stale data instead of throwing
    const stale = await cached.listAll();
    expect(stale).toHaveLength(1);
    expect(stale[0]?.id).toBe(first[0]?.id);

    vi.useRealTimers();
  });

  it('propagates the error when cache is cold and upstream fails', async () => {
    const inner = new CountingRepo([]);
    vi.spyOn(inner, 'listAll').mockRejectedValue(new UpstreamError('cold failure'));
    const cached = new CachingProductRepository(inner, 60);

    await expect(cached.listAll()).rejects.toThrow(UpstreamError);
  });

  it('getById hits all-products cache when warm', async () => {
    const p = makeProduct({ id: '42' });
    const inner = new CountingRepo([p]);
    const cached = new CachingProductRepository(inner, 60);

    // Prime cache
    await cached.listAll();
    expect(inner.listAllCalls).toBe(1);

    // getById should use cache – inner.listAll stays at 1
    const found = await cached.getById('42');
    expect(found?.id).toBe('42');
    expect(inner.listAllCalls).toBe(1);
  });

  it('clearCache forces a refetch on next call', async () => {
    const inner = new CountingRepo([makeProduct()]);
    const cached = new CachingProductRepository(inner, 60);

    await cached.listAll();
    cached.clearCache();
    await cached.listAll();

    expect(inner.listAllCalls).toBe(2);
  });
});
