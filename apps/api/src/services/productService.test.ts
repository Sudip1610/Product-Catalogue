import { describe, it, expect, beforeEach } from 'vitest';
import { ProductService } from '../../src/services/productService.js';
import { NotFoundError } from '../../src/domain/errors.js';
import { FakeProductRepository, makeProduct, resetIdCounter } from '../../test/fakes.js';

beforeEach(() => resetIdCounter());

const cfg = { featuredProductIds: ['1', '3', '5'], categoryTopRatedCount: 2 };

// ── getFeatured ─────────────────────────────────────────────────────────

describe('ProductService.getFeatured', () => {
  it('returns featured products in configured order', async () => {
    const p1 = makeProduct({ id: '1', title: 'Alpha' });
    const p3 = makeProduct({ id: '3', title: 'Beta' });
    const p5 = makeProduct({ id: '5', title: 'Gamma' });
    const p2 = makeProduct({ id: '2', title: 'Delta' });
    const repo = new FakeProductRepository([p2, p5, p1, p3]); // shuffled
    const svc = new ProductService(repo, cfg);

    const result = await svc.getFeatured();

    expect(result.map((p) => p.id)).toEqual(['1', '3', '5']);
  });

  it('skips missing IDs and still returns the found ones', async () => {
    const p1 = makeProduct({ id: '1' });
    const p5 = makeProduct({ id: '5' });
    const repo = new FakeProductRepository([p1, p5]); // id=3 missing
    const svc = new ProductService(repo, cfg);

    const result = await svc.getFeatured();

    expect(result.map((p) => p.id)).toEqual(['1', '5']);
  });

  it('falls back to top-5 by rating when all configured IDs are missing', async () => {
    const products = [
      makeProduct({ id: '10', rating: { average: 4.9, count: 100 } }),
      makeProduct({ id: '11', rating: { average: 4.8, count: 50 } }),
      makeProduct({ id: '12', rating: { average: 4.7, count: 200 } }),
      makeProduct({ id: '13', rating: { average: 4.6, count: 10 } }),
      makeProduct({ id: '14', rating: { average: 4.5, count: 5 } }),
      makeProduct({ id: '15', rating: { average: 4.4, count: 1 } }),
    ];
    const repo = new FakeProductRepository(products);
    const svc = new ProductService(repo, cfg); // cfg has ids 1,3,5 – none present

    const result = await svc.getFeatured();

    expect(result).toHaveLength(5);
    expect(result[0]?.id).toBe('10'); // highest average
  });

  it('falls back to top-5 when featuredProductIds is empty', async () => {
    const products = Array.from({ length: 7 }, (_, i) =>
      makeProduct({ id: String(i + 20), rating: { average: 5 - i * 0.1, count: 10 } }),
    );
    const repo = new FakeProductRepository(products);
    const svc = new ProductService(repo, { featuredProductIds: [], categoryTopRatedCount: 2 });

    const result = await svc.getFeatured();

    expect(result).toHaveLength(5);
  });
});

// ── getCategoryView – top rated ranking ─────────────────────────────────

describe('ProductService.getCategoryView', () => {
  const electronics = 'electronics';

  it('topRated uses rating.average desc then rating.count desc', async () => {
    const products = [
      makeProduct({ id: '1', category: electronics, rating: { average: 4.5, count: 100 } }),
      makeProduct({ id: '2', category: electronics, rating: { average: 4.5, count: 200 } }), // same avg, more count
      makeProduct({ id: '3', category: electronics, rating: { average: 4.8, count: 50 } }),  // highest avg
      makeProduct({ id: '4', category: electronics, rating: { average: 3.0, count: 999 } }),
    ];
    const repo = new FakeProductRepository(products);
    const svc = new ProductService(repo, { ...cfg, categoryTopRatedCount: 2 });

    const { topRated } = await svc.getCategoryView(electronics);

    expect(topRated.map((p) => p.id)).toEqual(['3', '2']);
  });

  it('title is the final tiebreaker', async () => {
    const products = [
      makeProduct({ id: '1', title: 'Zebra',  category: electronics, rating: { average: 4.0, count: 10 } }),
      makeProduct({ id: '2', title: 'Alpha',  category: electronics, rating: { average: 4.0, count: 10 } }),
      makeProduct({ id: '3', title: 'Mango',  category: electronics, rating: { average: 4.0, count: 10 } }),
    ];
    const repo = new FakeProductRepository(products);
    const svc = new ProductService(repo, { ...cfg, categoryTopRatedCount: 2 });

    const { topRated } = await svc.getCategoryView(electronics);

    expect(topRated.map((p) => p.title)).toEqual(['Alpha', 'Mango']);
  });

  it('others excludes topRated and is sorted by title', async () => {
    const products = [
      makeProduct({ id: '1', title: 'Zap',    category: electronics, rating: { average: 4.9, count: 1 } }),
      makeProduct({ id: '2', title: 'Banana', category: electronics, rating: { average: 3.0, count: 1 } }),
      makeProduct({ id: '3', title: 'Apple',  category: electronics, rating: { average: 2.0, count: 1 } }),
      makeProduct({ id: '4', title: 'Mango',  category: electronics, rating: { average: 1.0, count: 1 } }),
    ];
    const repo = new FakeProductRepository(products);
    const svc = new ProductService(repo, { ...cfg, categoryTopRatedCount: 2 });

    const { topRated, others } = await svc.getCategoryView(electronics);

    const topRatedIds = new Set(topRated.map((p) => p.id));
    expect(others.every((p) => !topRatedIds.has(p.id))).toBe(true);
    expect(others.map((p) => p.title)).toEqual(['Apple', 'Mango']);
  });

  it('throws NotFoundError for an unknown category', async () => {
    const repo = new FakeProductRepository([makeProduct({ category: electronics })]);
    const svc = new ProductService(repo, cfg);

    await expect(svc.getCategoryView('nonexistent')).rejects.toThrow(NotFoundError);
  });
});

// ── search ──────────────────────────────────────────────────────────────

describe('ProductService.search', () => {
  const products = [
    makeProduct({ id: '1', title: 'Blue Shirt',      description: 'A casual blue shirt', category: "men's clothing" }),
    makeProduct({ id: '2', title: 'Red Dress',       description: 'An elegant evening gown', category: "women's clothing" }),
    makeProduct({ id: '3', title: 'Gold Necklace',   description: 'Shiny jewelry piece', category: 'jewelery' }),
    makeProduct({ id: '4', title: 'Wireless Headphones', description: 'Noise cancelling audio', category: 'electronics' }),
  ];

  let svc: ProductService;
  beforeEach(() => {
    resetIdCounter();
    const repo = new FakeProductRepository(products);
    svc = new ProductService(repo, cfg);
  });

  it('is case-insensitive', async () => {
    const result = await svc.search('BLUE');
    expect(result.map((p) => p.id)).toContain('1');
  });

  it('trims and splits multi-word query (AND semantics)', async () => {
    const result = await svc.search('  blue  shirt  ');
    expect(result.map((p) => p.id)).toEqual(['1']);
  });

  it('matches words in description', async () => {
    const result = await svc.search('cancelling');
    expect(result.map((p) => p.id)).toContain('4');
  });

  it('matches words in category', async () => {
    const result = await svc.search('jewelery');
    expect(result.map((p) => p.id)).toContain('3');
  });

  it('returns empty array when no products match', async () => {
    const result = await svc.search('unicorn');
    expect(result).toHaveLength(0);
  });

  it('requires ALL words to match (AND not OR)', async () => {
    // 'blue gown' – blue is in product 1, gown is in product 2; nothing has both
    const result = await svc.search('blue gown');
    expect(result).toHaveLength(0);
  });

  it('returns empty for empty-after-trim query', async () => {
    const result = await svc.search('   ');
    expect(result).toHaveLength(0);
  });
});

// ── getById ─────────────────────────────────────────────────────────────

describe('ProductService.getById', () => {
  it('returns the product when found', async () => {
    const p = makeProduct({ id: '99' });
    const repo = new FakeProductRepository([p]);
    const svc = new ProductService(repo, cfg);

    const result = await svc.getById('99');
    expect(result).toEqual(p);
  });

  it('throws NotFoundError when missing', async () => {
    const repo = new FakeProductRepository([]);
    const svc = new ProductService(repo, cfg);

    await expect(svc.getById('999')).rejects.toThrow(NotFoundError);
  });
});
