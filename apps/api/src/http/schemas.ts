import { z } from 'zod';

// ── Search query ─────────────────────────────────────────────────────────
export const searchQuerySchema = z.object({
  q: z
    .string({ required_error: 'q is required' })
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query must be at most 100 characters'),
});

// ── Enquiry body ─────────────────────────────────────────────────────────
export const enquiryBodySchema = z.object({
  productId: z.string().min(1, 'productId is required'),
  name: z.string().min(1, 'name is required').max(100, 'name must be at most 100 characters'),
  email: z.string().email('A valid email is required'),
  phone: z
    .string()
    .max(30, 'phone must be at most 30 characters')
    .regex(/^[\d\s+\-().]*$/, 'phone may only contain digits and common phone symbols')
    .optional(),
  message: z
    .string()
    .min(1, 'message is required')
    .max(2000, 'message must be at most 2000 characters'),
  // Honeypot: must be absent or empty string
  website: z.string().optional(),
});

export type EnquiryBody = z.infer<typeof enquiryBodySchema>;
