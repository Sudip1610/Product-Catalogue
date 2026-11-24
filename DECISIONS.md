# Decisions

## A3. Assumptions about the domain

1. **Featured fallback**: if `FEATURED_PRODUCT_IDS` is empty or all IDs are missing, return the top 5 by `rating.average` descending.
2. **Top-rated tie-break**: primary sort `rating.average` desc, secondary `rating.count` desc, tertiary `title` asc for determinism.
3. **Category slug**: use the raw Fake Store category string as the slug (e.g. `jewelery`, `men's clothing`). The API receives and returns URL-decoded values; URL encoding is the caller's responsibility.
4. **Search AND semantics**: a product matches only if **every** query word appears somewhere in `title`, `description`, or `category` (case-insensitive substring).
5. **Currency**: a single configured `DEFAULT_CURRENCY` applies to all products (Fake Store does not return a currency field).
6. **Honeypot**: if the `website` field is non-empty, return `201 { status: 'sent' }` and do nothing (silent drop).
7. **NotFoundError on unknown category**: `getCategoryView` throws `NotFoundError` when the category name does not appear in the repository's category list.

## A4. Architecture decisions

- **Ports and adapters (hexagonal)**: keeps business logic decoupled from infrastructure. Swapping Fake Store for a real DB, or Mailpit for SES, requires touching only `container.ts` and the adapter file.
- **In-memory TTL cache**: avoids hammering the upstream during dev; serves stale data on upstream failure.
- **Zod for all validation**: single library for both config parsing and request schema validation, keeping the error shape consistent.
- **Pino for logging**: structured JSON logs, low overhead, plays well with Docker log drivers.

## A5. Technology choices

| Concern | Choice | Reason |
|---|---|---|
| API framework | Express 5 | Familiar, minimal, async-safe by default |
| Validation | Zod | Type inference from schemas |
| Email transport | Nodemailer + Mailpit | Zero-config local SMTP, SES-compatible interface |
| Frontend framework | React 18 + Vite | Fast dev DX |
| Data fetching | TanStack Query v5 | Caching, loading/error states |
| Form handling | react-hook-form + zod | Mirror backend validation |
| Testing (API) | Vitest + Supertest | Fast, ESM-native |
| Testing (web) | Vitest + RTL + MSW | No real network calls |
| Containerisation | Docker Compose | One-command local run |

## A6. Things explicitly not built

- Pagination (see Next steps)
- Admin UI for curating featured items
- Persistent enquiry storage
- CAPTCHA
- Playwright e2e tests
- Redis cache (in-memory is enough for PoC)
- OpenAPI spec / generated client types
- IaC (CDK/Terraform)
- Observability (metrics, tracing)
- Image optimisation / SSR

## Next steps (with another day)

- Persist enquiries and use an outbox pattern for reliable email delivery.
- CAPTCHA on the enquiry form.
- Playwright e2e tests covering the full browser flow.
- Redis for the cache (survives API restarts, shareable across replicas).
- Pagination on category and search result pages.
- Admin UI to curate featured items without redeploying.
- OpenAPI spec and generated client types.
- IaC (CDK or Terraform) for ECS Fargate + SES deployment.
- Observability: structured metrics, distributed tracing.
- Image optimisation and SEO/SSR if public-facing traffic grows.
