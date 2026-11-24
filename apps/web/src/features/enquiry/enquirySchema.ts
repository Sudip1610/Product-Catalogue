import { z } from 'zod';

export const enquiryFormSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .max(30, 'Phone must be at most 30 characters')
    .regex(/^[\d\s+\-().]*$/, 'Phone may only contain digits and common symbols')
    .optional()
    .or(z.literal('')),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(2000, 'Message must be at most 2000 characters'),
  website: z.string().optional(),
});

export type EnquiryFormValues = z.infer<typeof enquiryFormSchema>;
