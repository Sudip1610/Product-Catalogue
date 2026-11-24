// In-memory fakes for use in unit and integration tests.
// These are real implementations of the ports (not mocks),
// so tests assert behaviour, not wiring.

import type { ProductRepository, EmailSender, EmailMessage } from '../src/domain/ports.js';
import type { Product } from '../src/domain/product.js';

// ── Fake ProductRepository ──────────────────────────────────────────────

export class FakeProductRepository implements ProductRepository {
  private products: Product[];

  constructor(products: Product[] = []) {
    this.products = products;
  }

  async listAll(): Promise<Product[]> {
    return [...this.products];
  }

  async getById(id: string): Promise<Product | null> {
    return this.products.find((p) => p.id === id) ?? null;
  }

  async listCategories(): Promise<string[]> {
    return [...new Set(this.products.map((p) => p.category))];
  }

  /** Test helper: replace the product list */
  setProducts(products: Product[]): void {
    this.products = products;
  }
}

// ── Fake EmailSender ────────────────────────────────────────────────────

export class FakeEmailSender implements EmailSender {
  readonly sent: EmailMessage[] = [];
  private shouldFail = false;
  private failMessage = 'SMTP error';

  async send(message: EmailMessage): Promise<void> {
    if (this.shouldFail) {
      throw new Error(this.failMessage);
    }
    this.sent.push(message);
  }

  /** Test helper: cause the next send call to throw */
  failWith(message: string): void {
    this.shouldFail = true;
    this.failMessage = message;
  }

  reset(): void {
    this.sent.length = 0;
    this.shouldFail = false;
  }
}

// ── Product fixture builder ─────────────────────────────────────────────

let _idCounter = 0;

export function makeProduct(overrides: Partial<Product> = {}): Product {
  const id = String(++_idCounter);
  return {
    id,
    title: `Product ${id}`,
    description: `Description for product ${id}`,
    price: 9.99,
    currency: 'USD',
    category: 'electronics',
    imageUrl: `https://example.com/img/${id}.jpg`,
    rating: { average: 3.0, count: 10 },
    ...overrides,
  };
}

export function resetIdCounter(): void {
  _idCounter = 0;
}
