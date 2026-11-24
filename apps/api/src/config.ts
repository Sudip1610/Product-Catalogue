import fs from 'fs';
import path from 'path';
import { z } from 'zod';

function loadDotEnv(): void {
  const candidateDirs = [
    process.cwd(),
    path.resolve(process.cwd(), '..'),
    path.resolve(process.cwd(), '../..'),
  ];
  for (const dir of candidateDirs) {
    const envFile = path.join(dir, '.env');
    if (fs.existsSync(envFile)) {
      try {
        const content = fs.readFileSync(envFile, 'utf-8');
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim();
            if (process.env[key] === undefined) {
              process.env[key] = val;
            }
          }
        }
        break;
      } catch {
        // ignore read errors
      }
    }
  }
}

loadDotEnv();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173,http://localhost:8080')
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
