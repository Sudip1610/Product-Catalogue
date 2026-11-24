import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { searchQuerySchema } from '../schemas.js';
import type { ProductService } from '../../services/productService.js';

export function catalogueRouter(productService: ProductService): Router {
  const router = Router();

  // GET /featured
  router.get('/featured', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await productService.getFeatured();
      res.json({ items });
    } catch (err) {
      next(err);
    }
  });

  // GET /categories
  router.get('/categories', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await productService.getCategories();
      res.json({ items });
    } catch (err) {
      next(err);
    }
  });

  // GET /categories/:slug  — Express URL-decodes params automatically
  router.get('/categories/:slug', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rawSlug = req.params['slug'];
      const slug = typeof rawSlug === 'string' ? rawSlug : (rawSlug?.[0] ?? '');
      const view = await productService.getCategoryView(slug);
      res.json(view);
    } catch (err) {
      next(err);
    }
  });

  // GET /products?q=  (search; q required, 2–100 chars)
  router.get('/products', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = searchQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: parsed.error.issues,
          },
        });
        return;
      }
      const { q } = parsed.data;
      const items = await productService.search(q);
      res.json({ items, query: q });
    } catch (err) {
      next(err);
    }
  });

  // GET /products/:id
  router.get('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rawId = req.params['id'];
      const id = typeof rawId === 'string' ? rawId : (rawId?.[0] ?? '');
      const item = await productService.getById(id);
      res.json({ item });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
