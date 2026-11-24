import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/http/app.js';
import { ProductService } from '../src/services/productService.js';
import { EnquiryService } from '../src/services/enquiryService.js';
import { FakeProductRepository, FakeEmailSender, makeProduct, resetIdCounter } from './fakes.js';

// ── Test fixtures ────────────────────────────────────────────────────────

const electronics = 'electronics';
const clothing = "men's clothing";

const testProducts = [
  makeProduct({ id: '1', title: 'Blue Widget',  category: electronics, rating: { average: 4.9, count: 200 } }),
  makeProduct({ id: '2', title: 'Red Gadget',   category: electronics, rating: { average: 4.5, count: 100 } }),
  makeProduct({ id: '3', title: 'Green Doohickey', category: electronics, rating: { average: 4.1, count: 50 } }),
  makeProduct({ id: '4', title: 'Alpha Shirt',  category: clothing,     rating: { average: 3.8, count: 10 } }),
  makeProduct({ id: '5', title: 'Beta Trousers', category: clothing,    rating: { average: 3.5, count: 5 } }),
];

// ── App factory ──────────────────────────────────────────────────────────

function buildApp(products = testProducts) {
  resetIdCounter();
  const repo = new FakeProductRepository(products);
  const emailSender = new FakeEmailSender();
  const productService = new ProductService(repo, {
    featuredProductIds: ['1', '2', '3', '4', '5'],
    categoryTopRatedCount: 2,
  });
  const enquiryService = new EnquiryService(productService, emailSender, 'sales@test.local');
  const app = createApp(
    {
      productService,
      enquiryService,
      config: { corsOrigins: ['http://localhost:5173'], nodeEnv: 'test' },
    },
    // High limits so normal tests never hit them
    { windowMs: 60_000, generalMax: 1000, enquiryMax: 100 },
  );
  return { app, emailSender, repo };
}

// ── Shared error shape assertion ─────────────────────────────────────────

function expectErrorShape(body: unknown, code: string, _status: number) {
  expect(body).toMatchObject({
    error: { code, message: expect.any(String) },
  });
  // No stack traces — look for the specific pattern of a JS stack frame line
  // (e.g. "at Object.<anonymous>") not for the substring "at " which appears in validation messages
  expect(JSON.stringify(body)).not.toMatch(/\bat [A-Z][a-zA-Z]+\./);
  expect(JSON.stringify(body)).not.toContain('"stack"');
}

// ── Health ───────────────────────────────────────────────────────────────

describe('GET /health', () => {
  it('returns 200 { status: ok }', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

// ── Featured ─────────────────────────────────────────────────────────────

describe('GET /api/v1/featured', () => {
  it('returns 200 with { items: Product[] }', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/api/v1/featured');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ items: expect.any(Array) });
    expect(res.body.items).toHaveLength(5);
  });

  it('each item has the domain Product shape', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/api/v1/featured');
    const item = res.body.items[0];
    expect(item).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      price: expect.any(Number),
      currency: expect.any(String),
      category: expect.any(String),
      imageUrl: expect.any(String),
      rating: { average: expect.any(Number), count: expect.any(Number) },
    });
  });
});

// ── Categories ───────────────────────────────────────────────────────────

describe('GET /api/v1/categories', () => {
  it('returns 200 with { items: { slug, name }[] }', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual(
      expect.arrayContaining([
        { slug: electronics, name: electronics },
        { slug: clothing, name: clothing },
      ]),
    );
  });
});

// ── Category view ────────────────────────────────────────────────────────

describe('GET /api/v1/categories/:slug', () => {
  it('returns 200 with { category, topRated, others }', async () => {
    const { app } = buildApp();
    const res = await request(app).get(`/api/v1/categories/${encodeURIComponent(electronics)}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      category: electronics,
      topRated: expect.any(Array),
      others: expect.any(Array),
    });
    expect(res.body.topRated).toHaveLength(2); // categoryTopRatedCount=2
  });

  it('topRated + others = all products in that category', async () => {
    const { app } = buildApp();
    const res = await request(app).get(`/api/v1/categories/${encodeURIComponent(electronics)}`);
    const total = res.body.topRated.length + res.body.others.length;
    expect(total).toBe(3); // 3 electronics products
  });

  it("URL-encoded slug works (men's clothing)", async () => {
    const { app } = buildApp();
    const res = await request(app).get(`/api/v1/categories/${encodeURIComponent(clothing)}`);
    expect(res.status).toBe(200);
    expect(res.body.category).toBe(clothing);
  });

  it('returns 404 NOT_FOUND for unknown category', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/api/v1/categories/nonexistent');
    expect(res.status).toBe(404);
    expectErrorShape(res.body, 'NOT_FOUND', 404);
  });
});

// ── Product search ────────────────────────────────────────────────────────

describe('GET /api/v1/products?q=', () => {
  it('returns 200 with { items, query } for a valid query', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/api/v1/products?q=widget');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ items: expect.any(Array), query: 'widget' });
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].title).toBe('Blue Widget');
  });

  it('returns 400 VALIDATION_ERROR when q is 1 character (too short)', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/api/v1/products?q=x');
    expect(res.status).toBe(400);
    expectErrorShape(res.body, 'VALIDATION_ERROR', 400);
  });

  it('returns 400 VALIDATION_ERROR when q is missing', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(400);
    expectErrorShape(res.body, 'VALIDATION_ERROR', 400);
  });

  it('returns empty items array when nothing matches', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/api/v1/products?q=unicorn');
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
  });
});

// ── Product by ID ─────────────────────────────────────────────────────────

describe('GET /api/v1/products/:id', () => {
  it('returns 200 with { item: Product }', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/api/v1/products/1');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ item: { id: '1', title: 'Blue Widget' } });
  });

  it('returns 404 NOT_FOUND for unknown id', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/api/v1/products/9999');
    expect(res.status).toBe(404);
    expectErrorShape(res.body, 'NOT_FOUND', 404);
  });
});

// ── Enquiries ─────────────────────────────────────────────────────────────

const validEnquiry = {
  productId: '1',
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '+44 7700 900000',
  message: 'Is this in stock?',
};

describe('POST /api/v1/enquiries', () => {
  it('returns 201 { status: sent } and sends an email', async () => {
    const { app, emailSender } = buildApp();
    const res = await request(app).post('/api/v1/enquiries').send(validEnquiry);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ status: 'sent' });
    expect(emailSender.sent).toHaveLength(1);
  });

  it('honeypot: returns 201 silently and sends NO email when website is filled', async () => {
    const { app, emailSender } = buildApp();
    const res = await request(app)
      .post('/api/v1/enquiries')
      .send({ ...validEnquiry, website: 'http://spam.example.com' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ status: 'sent' });
    expect(emailSender.sent).toHaveLength(0); // no email
  });

  it('returns 400 VALIDATION_ERROR when name is missing', async () => {
    const { app } = buildApp();
    const { name: _n, ...noName } = validEnquiry;
    const res = await request(app).post('/api/v1/enquiries').send(noName);
    expect(res.status).toBe(400);
    expectErrorShape(res.body, 'VALIDATION_ERROR', 400);
  });

  it('returns 400 VALIDATION_ERROR when email is invalid', async () => {
    const { app } = buildApp();
    const res = await request(app)
      .post('/api/v1/enquiries')
      .send({ ...validEnquiry, email: 'not-an-email' });
    expect(res.status).toBe(400);
    expectErrorShape(res.body, 'VALIDATION_ERROR', 400);
  });

  it('returns 400 VALIDATION_ERROR when message exceeds 2000 chars', async () => {
    const { app } = buildApp();
    const res = await request(app)
      .post('/api/v1/enquiries')
      .send({ ...validEnquiry, message: 'x'.repeat(2001) });
    expect(res.status).toBe(400);
    expectErrorShape(res.body, 'VALIDATION_ERROR', 400);
  });

  it('returns 404 NOT_FOUND when productId does not exist', async () => {
    const { app } = buildApp();
    const res = await request(app)
      .post('/api/v1/enquiries')
      .send({ ...validEnquiry, productId: '9999' });
    expect(res.status).toBe(404);
    expectErrorShape(res.body, 'NOT_FOUND', 404);
  });

  it('works without optional phone field', async () => {
    const { app } = buildApp();
    const { phone: _p, ...noPhone } = validEnquiry;
    const res = await request(app).post('/api/v1/enquiries').send(noPhone);
    expect(res.status).toBe(201);
  });
});

// ── Rate limiting ─────────────────────────────────────────────────────────

describe('Rate limiting', () => {
  it('returns 429 RATE_LIMITED after exceeding enquiry limit', async () => {
    // Create a separate app with very low enquiry limit
    const { app } = buildApp();
    const rateLimitedApp = (() => {
      resetIdCounter();
      const repo = new FakeProductRepository(testProducts);
      const emailSender = new FakeEmailSender();
      const productService = new ProductService(repo, {
        featuredProductIds: ['1'],
        categoryTopRatedCount: 1,
      });
      const enquiryService = new EnquiryService(
        productService,
        emailSender,
        'sales@test.local',
      );
      return createApp(
        {
          productService,
          enquiryService,
          config: { corsOrigins: [], nodeEnv: 'test' },
        },
        { windowMs: 60_000, generalMax: 1000, enquiryMax: 2 },
      );
    })();

    // First two requests succeed
    await request(rateLimitedApp).post('/api/v1/enquiries').send(validEnquiry);
    await request(rateLimitedApp).post('/api/v1/enquiries').send(validEnquiry);
    // Third exceeds the limit of 2
    const res = await request(rateLimitedApp).post('/api/v1/enquiries').send(validEnquiry);
    expect(res.status).toBe(429);
    expectErrorShape(res.body, 'RATE_LIMITED', 429);
  });
});

// ── CORS ──────────────────────────────────────────────────────────────────

describe('CORS', () => {
  it('sets Access-Control-Allow-Origin for allowed origins', async () => {
    const { app } = buildApp();
    const res = await request(app)
      .get('/api/v1/featured')
      .set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('does NOT set Access-Control-Allow-Origin for disallowed origins', async () => {
    const { app } = buildApp();
    const res = await request(app)
      .get('/api/v1/featured')
      .set('Origin', 'http://evil.example.com');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

// ── Unknown route ─────────────────────────────────────────────────────────

describe('Unknown routes', () => {
  it('returns 404 for unmatched routes', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/api/v1/doesnotexist');
    expect(res.status).toBe(404);
    expectErrorShape(res.body, 'NOT_FOUND', 404);
  });
});
