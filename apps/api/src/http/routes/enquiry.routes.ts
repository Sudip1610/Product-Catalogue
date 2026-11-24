import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { enquiryBodySchema } from '../schemas.js';
import type { EnquiryService } from '../../services/enquiryService.js';

export function enquiryRouter(enquiryService: EnquiryService): Router {
  const router = Router();

  // POST /enquiries
  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as unknown;
      const parsed = enquiryBodySchema.safeParse(body);

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

      const { website, ...enquiryData } = parsed.data;

      // Honeypot: if website field is non-empty, silently do nothing and return 201
      if (website && website.length > 0) {
        res.status(201).json({ status: 'sent' });
        return;
      }

      await enquiryService.submit(enquiryData);
      res.status(201).json({ status: 'sent' });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
