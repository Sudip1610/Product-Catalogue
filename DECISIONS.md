# Architecture & Implementation Decisions

This document records the architectural decisions, domain assumptions, technology choices, and roadmap considerations for the Product Catalogue PoC.

---

## A3. Assumptions About the Domain

1. **Featured Products Fallback**:
   - The application prioritizes `FEATURED_PRODUCT_IDS` in the exact configured sequence.
   - Missing or deleted IDs are logged as warnings and skipped without crashing.
   - If all configured IDs are missing or the list is empty, the system falls back to the top 5 products sorted by rating average (descending), then count (descending).
2. **Top-Rated Ranking & Deterministic Tie-Breaking**:
   - Ranking sort orders primarily by `rating.average` descending.
   - Secondary tie-breaker: `rating.count` descending.
   - Tertiary tie-breaker: `title` ascending (alphabetical) for strictly deterministic rendering across page reloads.
3. **Category Slugs & Upstream Spellings**:
   - The API uses the raw category strings returned by FakeStore as slugs (e.g. `jewelery`, `men's clothing`, `women's clothing`).
   - Slugs containing spaces or apostrophes (such as `men's clothing`) are URL-encoded by callers and decoded automatically by Express route parameters.
   - FakeStore's upstream spelling of `jewelery` (single 'l') is preserved faithfully without altering slug identities.
4. **Search Semantics (Multi-Word AND Matching)**:
   - Search queries are trimmed and converted to lowercase.
   - Multi-word queries are split on whitespace.
   - A product matches if and only if **every word** appears somewhere in the combined string of `title + description + category` (case-insensitive substring match).
   - Queries with fewer than 2 characters are rejected client-side (showing an inline hint without initiating network calls) and validated server-side (`VALIDATION_ERROR` 400).
5. **Unified Currency**:
   - FakeStore API provides only numeric prices without currency codes.
   - The backend injects the configured `DEFAULT_CURRENCY` (default `USD`) into the domain `Product` model.
6. **Honeypot Anti-Spam**:
   - The enquiry payload includes an optional `website` field rendered with CSS visually hidden.
   - If the `website` field is populated upon submission (indicating bot activity), the server immediately returns `201 { "status": "sent" }` and silently discards the enquiry without sending an email.
7. **NotFoundError on Unknown Entities**:
   - Requests for unknown products (`/products/:id`) or invalid categories (`/categories/:slug`) throw a typed `NotFoundError` mapped to `404 NOT_FOUND`.

---

## A4. Architecture Decisions

- **Hexagonal / Ports-and-Adapters Architecture**:
  - Keeps business domain logic completely decoupled from Express, Nodemailer, FakeStore API, or any database.
  - Services depend solely on domain interfaces (`ProductRepository`, `EmailSender`).
  - Adapters are interchangeable modules implementing those interfaces.
- **Single Composition Root (`apps/api/src/container.ts`)**:
  - The composition root is the only place in the backend that imports concrete adapters and instantiates services.
  - Neither controllers nor services have any compile-time dependency on concrete adapters.
- **In-Memory TTL Cache with Stale-On-Error**:
  - `CachingProductRepository` wraps any `ProductRepository` decorator-style.
  - Caches product and category lists for `PRODUCT_CACHE_TTL_SECONDS`.
  - If the upstream API times out or fails while a cache exists, the decorator logs a structured warning and serves stale cached data to prevent user-facing downtime.
- **Zod for Validation & Type Inference**:
  - Configuration (`config.ts`), upstream FakeStore payloads (`fakeStoreProductRepository.ts`), HTTP request queries and bodies (`schemas.ts`), and frontend forms (`enquirySchema.ts`) are all strictly validated with Zod.
- **Centralized Error Handling**:
  - Central Express middleware catches all thrown errors and transforms domain errors into standard JSON responses matching `{ error: { code, message, details? } }`.
  - Stack traces and internal implementation details are never exposed to clients.
- **Client-Side API Isolation**:
  - `apps/web/src/api/client.ts` is the single point of entry for network requests on the frontend.
  - The frontend never communicates with `fakestoreapi.com` directly; all requests flow to `/api/v1/*`.
  - In production, Nginx reverse-proxies `/api/` to the backend container, eliminating CORS overhead.

---

## A5. Technology Choices

| Concern | Selection | Justification |
|---|---|---|
| **API Framework** | Express 5 | Async safety by default without `express-async-errors`, minimal footprint, broad ecosystem support |
| **Validation** | Zod 3 | TypeScript-first schema declaration with static type inference across backend and frontend |
| **Email Transport** | Nodemailer + Mailpit | Standard SMTP transport with zero-config local inbox capture in Docker Compose; matches AWS SES SMTP interface |
| **Frontend Framework** | React 18 + Vite | Fast build times, robust concurrent rendering support, modern ESM development environment |
| **Client State / Fetching** | TanStack Query v5 | Built-in caching, background refetching, declarative loading/error/retry states |
| **Form Management** | React Hook Form + Zod | Minimal re-renders, uncontrolled inputs, seamless integration with Zod schemas |
| **CSS & Design Tokens** | CSS Custom Properties (`tokens.css`) | Zero-runtime CSS variables, strict theming, clean separation of design tokens |
| **Testing** | Vitest + Supertest + RTL + MSW | ESM-native test runner, in-memory port fakes, MSW network mocking without live internet calls |
| **Containerization** | Docker Compose + Multi-stage Dockerfiles | Reproducible environment, small Alpine images, non-root execution (`USER node`, `USER nginx`) |

---

## A6. Explicitly Not Built (PoC Boundaries)

To meet the scope and time constraints of the PoC, the following items were intentionally deferred:
- Persistent enquiry storage in a database (enquiries are dispatched directly via email).
- Pagination for search and category product grids.
- Administrative dashboard for curating featured items dynamically.
- CAPTCHA integration (honeypot field is used for lightweight spam deterrence).
- End-to-end browser testing with Playwright or Cypress.
- Distributed Redis caching (in-memory TTL cache is sufficient for a single container instance).
- SSR (Server-Side Rendering) or dynamic OpenGraph image generation.

---

## Next Steps (With Another Day)

If given another day to evolve this PoC into an enterprise production system, the priority roadmap would include:

1. **Transactional Outbox & Database Persistence**:
   - Introduce PostgreSQL with Prisma or Kysely.
   - Persist enquiries to an `enquiries` table within a database transaction and emit an outbox event.
   - An asynchronous background worker processes the outbox queue, retries failed sends with exponential backoff, and tracks delivery status.
2. **Distributed Caching with Redis**:
   - Replace the in-memory cache in `CachingProductRepository` with a Redis adapter (`RedisProductRepository`) so cache state is shared across auto-scaled API replicas.
3. **Bot Protection & Security**:
   - Integrate Cloudflare Turnstile or Google reCAPTCHA v3 on the enquiry modal alongside the existing honeypot.
   - Add CSRF protection tokens for state-changing endpoints.
4. **Pagination & Faceted Filtering**:
   - Add `page` and `limit` query parameters to `/products` and `/categories/:slug`.
   - Implement faceted filters for price ranges, minimum ratings, and sort orders.
5. **OpenAPI Specification & Type Generation**:
   - Generate an OpenAPI 3.1 specification from Zod schemas using `zod-to-openapi`.
   - Automatically generate typed TypeScript API client SDKs for the frontend.
6. **Infrastructure as Code (IaC)**:
   - Provide AWS CDK or Terraform modules provisioning:
     - CloudFront distribution + S3 bucket for the React web app.
     - Application Load Balancer + ECS Fargate cluster for the Express API.
     - Amazon SES configuration with verified domain identities and DKIM records.
     - Amazon ElastiCache (Redis) and Amazon Aurora Serverless v2.
7. **Observability & Telemetry**:
   - Export OpenTelemetry metrics and traces to AWS CloudWatch, Datadog, or Honeycomb.
   - Track upstream FakeStore latency, cache hit/miss ratios, and enquiry dispatch durations.
