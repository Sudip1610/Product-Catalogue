import { http, HttpResponse } from 'msw';
import type { CategoryItem, CategoryView, Product } from '../api/types.js';

export const mockProducts: Product[] = [
  {
    id: '1',
    title: 'Fjallraven Backpack',
    description: 'Your perfect pack for everyday use.',
    price: 109.95,
    currency: 'USD',
    category: "men's clothing",
    imageUrl: 'https://fakestoreapi.com/img/81fAn.jpg',
    rating: { average: 3.9, count: 120 },
  },
  {
    id: '2',
    title: 'Mens Casual Slim Fit',
    description: 'Slim-fitting style, contrast raglan long sleeve.',
    price: 22.3,
    currency: 'USD',
    category: "men's clothing",
    imageUrl: 'https://fakestoreapi.com/img/71-3fAn.jpg',
    rating: { average: 4.1, count: 259 },
  },
  {
    id: '3',
    title: 'Mens Cotton Jacket',
    description: 'Great outerwear jackets for Spring/Autumn/Winter.',
    price: 55.99,
    currency: 'USD',
    category: "men's clothing",
    imageUrl: 'https://fakestoreapi.com/img/71li-ujtlUL.jpg',
    rating: { average: 4.7, count: 500 },
  },
  {
    id: '4',
    title: 'Solid Gold Petite Micropave',
    description: 'Satisfaction Guaranteed. Return or exchange any order within 30 days.',
    price: 168.0,
    currency: 'USD',
    category: 'jewelery',
    imageUrl: 'https://fakestoreapi.com/img/61sbMiUnoGL.jpg',
    rating: { average: 4.9, count: 70 },
  },
  {
    id: '5',
    title: 'WD 2TB Elements Portable External Hard Drive',
    description: 'USB 3.0 and USB 2.0 Compatibility.',
    price: 64.0,
    currency: 'USD',
    category: 'electronics',
    imageUrl: 'https://fakestoreapi.com/img/61IBBVJvSDL.jpg',
    rating: { average: 4.5, count: 203 },
  },
];

export const mockCategories: CategoryItem[] = [
  { slug: 'electronics', name: 'electronics' },
  { slug: 'jewelery', name: 'jewelery' },
  { slug: "men's clothing", name: "men's clothing" },
  { slug: "women's clothing", name: "women's clothing" },
];

export const handlers = [
  // GET /api/v1/featured
  http.get('/api/v1/featured', () => {
    return HttpResponse.json({ items: mockProducts });
  }),

  // GET /api/v1/categories
  http.get('/api/v1/categories', () => {
    return HttpResponse.json({ items: mockCategories });
  }),

  // GET /api/v1/categories/:slug
  http.get('/api/v1/categories/:slug', ({ params }) => {
    const slug = decodeURIComponent(params.slug as string);
    const inCategory = mockProducts.filter((p) => p.category === slug);
    const view: CategoryView = {
      category: slug,
      topRated: inCategory.slice(0, 2),
      others: inCategory.slice(2),
    };
    return HttpResponse.json(view);
  }),

  // GET /api/v1/products?q=
  http.get('/api/v1/products', ({ request }) => {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') || '').toLowerCase();
    const items = mockProducts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
    return HttpResponse.json({ items, query: q });
  }),

  // GET /api/v1/products/:id
  http.get('/api/v1/products/:id', ({ params }) => {
    const id = params.id as string;
    const item = mockProducts.find((p) => p.id === id);
    if (!item) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: `Product ${id} not found` } },
        { status: 404 },
      );
    }
    return HttpResponse.json({ item });
  }),

  // POST /api/v1/enquiries
  http.post('/api/v1/enquiries', async ({ request }) => {
    const body = (await request.json()) as { name?: string; email?: string; message?: string };
    if (!body.name || !body.email || !body.message) {
      return HttpResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Validation failed' } },
        { status: 400 },
      );
    }
    return HttpResponse.json({ status: 'sent' }, { status: 201 });
  }),
];
