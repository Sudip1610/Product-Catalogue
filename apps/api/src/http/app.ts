import { randomUUID } from 'crypto';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import pino from 'pino';
import rateLimit from 'express-rate-limit';
import { catalogueRouter } from './routes/catalogue.routes.js';
import { enquiryRouter } from './routes/enquiry.routes.js';
import { errorHandler } from './errorHandler.js';
import type { ProductService } from '../services/productService.js';
import type { EnquiryService } from '../services/enquiryService.js';

export interface AppDeps {
  productService: ProductService;
  enquiryService: EnquiryService;
  config: {
    corsOrigins: string[];
    nodeEnv: string;
  };
}

/** Overrides for rate-limit windows/counts — use in tests to keep suites fast */
export interface RateLimitOverrides {
  windowMs?: number;
  generalMax?: number;
  enquiryMax?: number;
}

export function createApp(deps: AppDeps, rlOverrides: RateLimitOverrides = {}) {
  const app = express();

  // ── Security headers ───────────────────────────────────────────────────
  app.use(helmet());

  // ── CORS (explicit allow-list; never wildcard) ─────────────────────────
  const allowedOrigins = new Set(deps.config.corsOrigins);
  app.use((req, res, next) => {
    const origin = req.headers['origin'];
    if (typeof origin === 'string' && allowedOrigins.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // ── Request logging (quiet in test) ───────────────────────────────────
  const logger = pino({ enabled: deps.config.nodeEnv !== 'test' });
  app.use(
    pinoHttp({
      logger,
      genReqId: (_req, res) => {
        const id = randomUUID();
        res.setHeader('X-Request-Id', id);
        return id;
      },
    }),
  );

  // ── Body parsing ───────────────────────────────────────────────────────
  app.use(express.json({ limit: '10kb' }));

  // ── Health check (outside /api/v1 and outside rate limiting) ──────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // ── Rate limiters ──────────────────────────────────────────────────────
  const windowMs = rlOverrides.windowMs ?? 60_000;

  const generalLimiter = rateLimit({
    windowMs,
    limit: rlOverrides.generalMax ?? 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
      });
    },
  });

  const enquiryLimiter = rateLimit({
    windowMs,
    limit: rlOverrides.enquiryMax ?? 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: { code: 'RATE_LIMITED', message: 'Too many enquiries, please try again later' },
      });
    },
  });

  // ── API router ─────────────────────────────────────────────────────────
  const apiRouter = express.Router();
  apiRouter.use(generalLimiter);
  apiRouter.use(catalogueRouter(deps.productService));
  apiRouter.use('/enquiries', enquiryLimiter, enquiryRouter(deps.enquiryService));

  app.use('/api/v1', apiRouter);

  // ── 404 catch-all ──────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });

  // ── Central error handler ──────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
