import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CORS_ORIGINS: z
    .string()
    .min(1)
    .transform((v) => v.split(',').map((s) => s.trim())),
  FAKESTORE_BASE_URL: z.string().url().default('https://fakestoreapi.com'),
  PRODUCT_CACHE_TTL_SECONDS: z.coerce.number().int().nonnegative().default(300),
  DEFAULT_CURRENCY: z.string().min(1).default('USD'),
  FEATURED_PRODUCT_IDS: z
    .string()
    .default('1,3,5,6,12')
    .transform((v) =>
      v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  CATEGORY_TOP_RATED_COUNT: z.coerce.number().int().positive().default(3),
  SMTP_HOST: z.string().min(1).default('localhost'),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().min(1).default('catalogue@example.local'),
  SALES_INBOX_EMAIL: z.string().email().default('sales@example.local'),
});

export type Config = z.infer<typeof envSchema>;

function loadConfig(): Config {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Configuration error – fix the following env vars:\n${issues}`);
  }
  return Object.freeze(result.data);
}

export const config: Config = loadConfig();
