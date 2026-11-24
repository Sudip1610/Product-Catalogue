# Product Catalogue PoC

A production-ready Product Catalogue Proof of Concept built with **React 18** and **Node.js 20 / TypeScript 5**, adhering strictly to a **Hexagonal (Ports and Adapters)** architecture.

Data is fetched from `fakestoreapi.com` **exclusively by the backend** (never by the browser). Inquiries are submitted from an accessible client-side modal, validated against Zod schemas, and sent via local SMTP to Mailpit.

---

## Architecture Overview

Dependencies point inward. Business domain and application services depend solely on ports (interfaces), never on concrete adapters, Express, or external libraries.

```
Browser (React 18 SPA)
   │
   │ HTTP /api/v1/*
   ▼
Express 5 API  ─── routes ──► controllers ──► services ──► ports
                                                              │
                     ┌────────────────────────────────────────┴──────────────────────┐
                     ▼                                                               ▼
        ProductRepository (port)                                            EmailSender (port)
                     │                                                               │
     CachingProductRepository (decorator)                                  SmtpEmailSender (adapter)
                     │                                                               │
     FakeStoreProductRepository (adapter)                                            ▼
                     │                                                      Mailpit (local SMTP) / SES (prod)
                     ▼
             fakestoreapi.com
```

### Layering Rules
- **Domain (`apps/api/src/domain/`)**: Pure types (`Product`, `Enquiry`), ports (`ProductRepository`, `EmailSender`), and domain errors (`NotFoundError`, `UpstreamError`, `EmailDeliveryError`, `ValidationError`). Zero external dependencies.
- **Services (`apps/api/src/services/`)**: `ProductService` (featured ordering, top-rated ranking, search with multi-word AND semantics) and `EnquiryService` (HTML escaping, validation, email composition). Depend only on ports.
- **Adapters (`apps/api/src/adapters/`)**: Concrete implementations (`FakeStoreProductRepository` with Zod validation + 5s `AbortController` timeout, `CachingProductRepository` with TTL cache + stale-on-error fallback, `SmtpEmailSender` via Nodemailer).
- **Composition Root (`apps/api/src/container.ts`)**: The **only** place in the backend where concrete adapters are wired to domain ports.
- **HTTP Layer (`apps/api/src/http/`)**: Express 5 app, thin controllers, centralized error handler mapping typed domain errors to a consistent JSON error contract.
- **Frontend (`apps/web/`)**: React 18 SPA. `src/api/client.ts` is the **only** module that calls `fetch`. Styling strictly references `tokens.css` variables with zero hard-coded colors.

---

## Stack Choice & Rationale

- **Language: TypeScript End-to-End**: A single language across both frontend and backend provides a shared mental model, zero context-switching, and shared validation concepts with Zod.
- **Backend: Express 5 + Zod + Pino**:
  - Express 5 provides native async error propagation without boilerplate wrappers.
  - Zod offers runtime input validation with compile-time type inference.
  - Pino and Pino-HTTP provide high-performance, structured JSON logging with request IDs (`X-Request-Id`).
- **Frontend: React 18 + Vite + TanStack Query v5 + React Hook Form**:
  - Vite delivers near-instant HMR and fast production bundling.
  - TanStack Query abstracts server-state caching, loading indicators, and retry loops.
  - React Hook Form + Zod provides accessible client-side form validation matching backend rules.
- **Testing: Vitest + Supertest + React Testing Library + MSW**:
  - Fast, ESM-native test runner.
  - In-memory fakes for unit tests (no mocking of internal functions).
  - Mock Service Worker (MSW) intercepts network calls in frontend integration tests without touching the live internet.

---

## Quick Start (Docker Compose)

### 1. Clone & Start
```bash
git clone <repo-url>
cd product-catalogue

# Copy environment file (optional - compose has safe defaults built-in)
cp .env.example .env

# Build and start all services
docker compose up --build
```

### 2. Service Endpoints
| Service | URL | Description |
|---|---|---|
| **Web App** | [http://localhost:8080](http://localhost:8080) | React SPA served via Nginx with reverse proxy |
| **API** | [http://localhost:3001/api/v1](http://localhost:3001/api/v1) | Express REST API |
| **API Health** | [http://localhost:3001/health](http://localhost:3001/health) | API healthcheck endpoint |
| **Mailpit UI** | [http://localhost:8025](http://localhost:8025) | Local SMTP mailbox UI |

---

## Local Development (Without Docker)

You can run the entire stack locally without Docker (requires Node.js 20+):

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Mailpit (for local email capture)
```bash
# If docker is available:
docker compose up mailpit

# Or install mailpit standalone via brew, scoop, or binary:
# https://github.com/axllent/mailpit
```

### 3. Run Both Apps Concurrently
```bash
npm run dev
```
- API will start on `http://localhost:3001`
- Frontend will start on `http://localhost:5173` (Vite dev server proxies `/api` requests to port 3001)

---

## Running Quality Gates & Tests

The project enforces strict quality gates:

```bash
# Run linting across all workspaces
npm run lint

# Run strict TypeScript typechecking across all workspaces
npm run typecheck

# Run all 81 tests across API and Web
npm run test

# Run production build across all workspaces
npm run build
```

### Test Breakdown (81 Passing Tests)
- **API Unit Tests (42 tests)**:
  - `ProductService`: Featured product selection, missing ID skip/fallback, top-rated ranking, title tie-breaking, search multi-word AND semantics, unknown categories.
  - `EnquiryService`: Email generation, HTML entity escaping, honeypot dropping, sender failure wrapping.
  - `FakeStoreProductRepository`: Upstream payload mapping, malformed payload rejection, network timeout abort.
  - `CachingProductRepository`: In-memory TTL caching, stale-on-error fallback, warm cache bypass.
- **API Integration Tests (25 tests)**:
  - Supertest tests against `/health`, `/featured`, `/categories`, `/categories/:slug`, `/products?q=`, `/products/:id`, `/enquiries`, general rate limiting (100/min), enquiry rate limiting (5/min), CORS headers, and error contract format.
- **Web Tests (14 tests)**:
  - `apiClient`: Header injection, JSON error parsing into `ApiError`, network error mapping.
  - `HomePage`: Renders 5 featured products via MSW.
  - `CategoryPage`: Renders "Top Rated" and "More in this category" sections.
  - `SearchPage`: Short-query hints, 0 API calls for 1-char input, matching results, friendly empty state.
  - `ProductPage & Enquiry Flow`: Product details rendering, validation errors on empty fields, honeypot handling, modal accessibility, submission feedback (Thank you screen), and API failure handling with form data preservation and retry.

---

## How to Try the Enquiry Flow

1. Open the web app at [http://localhost:8080](http://localhost:8080) (or `http://localhost:5173` in local dev).
2. Click any product card (or click a category link in the header).
3. On the product details page, click the **"Enquire About Product"** button.
4. An accessible modal opens with focus trapped.
5. Fill out the form:
   - **Your Name**: `Jane Smith`
   - **Email Address**: `jane@example.com`
   - **Phone**: `+1 555-0199` (optional)
   - **Message**: `Is this available for bulk delivery?`
6. Click **"Send Enquiry"**. The button disables and shows a loading spinner.
7. Upon submission, the modal displays the **"Thank you!"** confirmation screen.
8. Open the Mailpit inbox at [http://localhost:8025](http://localhost:8025):
   - You will see the incoming email with subject `New enquiry: <Product Title> (#<ID>)`.
   - The body includes the product title, ID, price, customer details, and the sanitized enquiry message.
   - The email `Reply-To` header is set to `jane@example.com`.

---

## Environment Variables

All variables are defined in `.env.example` with safe defaults:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Express API listening port |
| `NODE_ENV` | `development` | Environment mode (`development`, `test`, `production`) |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:8080` | Explicit CORS allowed origins (never `*`) |
| `FAKESTORE_BASE_URL` | `https://fakestoreapi.com` | Base URL for FakeStore API |
| `PRODUCT_CACHE_TTL_SECONDS` | `300` | In-memory cache TTL for products and categories |
| `DEFAULT_CURRENCY` | `USD` | Injected currency label for all products |
| `FEATURED_PRODUCT_IDS` | `1,3,5,6,12` | Comma-separated product IDs to feature on homepage |
| `CATEGORY_TOP_RATED_COUNT` | `3` | Number of items shown in Top Rated category section |
| `SMTP_HOST` | `localhost` | SMTP host (`mailpit` in Docker Compose) |
| `SMTP_PORT` | `1025` | SMTP port |
| `SMTP_USER` | `""` | SMTP username (optional) |
| `SMTP_PASS` | `""` | SMTP password (optional) |
| `MAIL_FROM` | `catalogue@example.local` | Sender address for outgoing enquiry notifications |
| `SALES_INBOX_EMAIL` | `sales@example.local` | Recipient inbox address for customer enquiries |

---

## HTTP API Reference

All application endpoints are served under `/api/v1` (with `/health` also available at root).

| Method | Path | Description | Success Response | Error Codes |
|---|---|---|---|---|
| `GET` | `/health` | Liveness healthcheck | `{ "status": "ok" }` | None |
| `GET` | `/api/v1/featured` | 5 featured products | `{ "items": Product[] }` | `502` |
| `GET` | `/api/v1/categories` | All category slugs & names | `{ "items": { "slug", "name" }[] }` | `502` |
| `GET` | `/api/v1/categories/:slug` | Category data (Top Rated + Others) | `{ "category", "topRated": Product[], "others": Product[] }` | `404`, `502` |
| `GET` | `/api/v1/products?q=` | Product search (q: 2-100 chars) | `{ "items": Product[], "query": string }` | `400`, `502` |
| `GET` | `/api/v1/products/:id` | Single product details | `{ "item": Product }` | `404`, `502` |
| `POST` | `/api/v1/enquiries` | Submit customer enquiry | `201 { "status": "sent" }` | `400`, `404`, `429`, `502` |

### Error Contract
Every error response returns a structured JSON payload:
```json
{
  "error": {
    "code": "VALIDATION_ERROR | NOT_FOUND | RATE_LIMITED | UPSTREAM_ERROR | EMAIL_DELIVERY_FAILED | INTERNAL_ERROR",
    "message": "Human-readable error description",
    "details": {}
  }
}
```

---

## Swapping Infrastructure Adapters

Thanks to the ports-and-adapters architecture, switching backends or email providers requires **zero changes to business logic or controllers**.

### 1. Swapping the Product Source (e.g. from FakeStore to PostgreSQL/Prisma)
1. Implement the `ProductRepository` interface (`apps/api/src/domain/ports.ts`):
   ```ts
   export class PostgresProductRepository implements ProductRepository {
     async listAll(): Promise<Product[]> { /* Prisma / SQL query */ }
     async getById(id: string): Promise<Product | null> { /* ... */ }
     async listCategories(): Promise<string[]> { /* ... */ }
   }
   ```
2. In `apps/api/src/container.ts`, swap `FakeStoreProductRepository` with `PostgresProductRepository`.
3. Wrap it with `CachingProductRepository` if caching is desired.

### 2. Swapping the Email Provider (e.g. from Mailpit/SMTP to AWS SES)
1. Implement the `EmailSender` interface (`apps/api/src/domain/ports.ts`):
   ```ts
   import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

   export class SesEmailSender implements EmailSender {
     constructor(private ses: SESClient, private from: string) {}
     async send(msg: EmailMessage): Promise<void> {
       await this.ses.send(new SendEmailCommand({ ... }));
     }
   }
   ```
2. In `apps/api/src/container.ts`, instantiate `SesEmailSender` instead of `SmtpEmailSender`.

---

## AWS Production Deployment Path

To deploy this architecture to AWS:
1. **Frontend (SPA)**:
   - Build static assets with `npm run build --workspace=apps/web`.
   - Host in an **Amazon S3** bucket configured as an origin for an **Amazon CloudFront** distribution.
   - CloudFront provides global edge caching, SSL via ACM, and custom domain mapping.
   - Route `/api/*` requests in CloudFront behaviors to the Application Load Balancer (ALB).
2. **Backend API**:
   - Containerize `apps/api` using the existing multi-stage Dockerfile.
   - Deploy as an **Amazon ECS Fargate** service running behind an **Application Load Balancer (ALB)**.
   - Configure Auto-Scaling based on CPU/memory utilization or request count.
   - Use **AWS Secrets Manager / SSM Parameter Store** for environment configuration.
3. **Email Delivery**:
   - Swap `SmtpEmailSender` for `SesEmailSender` using **Amazon Simple Email Service (SES)**.
   - Add IAM role permissions to the ECS Task Execution Role for `ses:SendEmail`.
4. **Caching & Outbox (Production Evolution)**:
   - Deploy **Amazon ElastiCache for Redis** to replace in-memory caching across multi-instance API tasks.
   - Persist enquiries to **Amazon Aurora PostgreSQL** and use an SQS outbox worker for guaranteed email delivery.

---

## Time Spent Breakdown

| Activity | Target | Actual |
|---|---|---|
| **Planning & Spec Review** | 20 min | 20 min |
| **Phase 0: Monorepo Scaffold** | 15 min | 15 min |
| **Phase 1: Domain & Services** | 25 min | 25 min |
| **Phase 2: Adapters (FakeStore, Cache, SMTP)** | 20 min | 20 min |
| **Phase 3: HTTP Layer & Supertest** | 25 min | 25 min |
| **Phase 4: Frontend Foundation & API Client** | 25 min | 25 min |
| **Phase 5: Pages, Enquiry Modal & RTL/MSW Tests** | 35 min | 35 min |
| **Phase 6: Docker, Nginx & CI** | 15 min | 15 min |
| **Phase 7: Documentation & Quality Review** | 20 min | 20 min |
| **Total** | **200 min (~3h 20m)** | **200 min** |
