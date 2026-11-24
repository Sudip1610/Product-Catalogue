## Summary
This pull request delivers the full implementation of the **Product Catalogue Proof of Concept (PoC)** in accordance with the specification. It provides a complete, production-ready fullstack solution featuring an Express 5 API with hexagonal (ports and adapters) architecture and a React 18 SPA styled with pure CSS design tokens.

The browser communicates exclusively with `/api/v1/*`; the external FakeStore API is only ever called by our backend. Customer enquiries submitted through an accessible client-side modal are validated, dropped if bot honeypots are filled, and dispatched via SMTP to Mailpit.

---

## Acceptance Criteria Checklist

- [x] **5 Featured Products**: Visible on the home page in configured order (`FEATURED_PRODUCT_IDS=1,3,5,6,12`) with fallback to top-5 by rating if missing.
- [x] **Category View**: Displays top-rated products (sorted by rating average desc, then rating count desc, then title asc) plus remaining products ("More in this category").
- [x] **Text Search**: Case-insensitive multi-word search with AND semantics matching title, description, and category.
- [x] **Product Details Page**: Full presentation of image, title, price, currency, rating, category badge, and description.
- [x] **Enquiry Flow**: Accessible modal dialog with focus trap and Escape key support; client-side validation using React Hook Form + Zod.
- [x] **Email Delivery**: Sales inbox receives structured email notification viewable in Mailpit (`http://localhost:8025`).
- [x] **Zero Direct Third-Party Calls**: Browser never connects to `fakestoreapi.com`; backend proxies and caches all catalogue data.
- [x] **Docker Compose in Under 10 Min**: `docker compose up --build` spins up `mailpit`, `api`, and `web` out of the box with zero manual configuration.
- [x] **Zero Committed Secrets**: `.env` is gitignored; `.env.example` provides safe local defaults.
- [x] **AWS Compatible**: Containerized services designed for Amazon ECS Fargate, CloudFront + S3, and Amazon SES.

---

## Architecture Overview

```
Browser (React 18 SPA)
   │  HTTP /api/v1/*
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

### Key Architectural Boundaries
1. **Domain & Services**: Pure TypeScript models and interfaces in `apps/api/src/domain/`. Services depend solely on domain ports.
2. **Composition Root**: `apps/api/src/container.ts` is the single module that wires concrete adapters to services.
3. **HTTP Layer**: Thin controllers, central error handler mapping domain errors to the standard JSON error contract `{ error: { code, message, details? } }`.
4. **Frontend API Client**: `apps/web/src/api/client.ts` is the only file calling `fetch`. All hooks use TanStack Query v5.

---

## Key Decisions & Trade-offs

- **Ports and Adapters**: Allows swapping FakeStore for PostgreSQL/Prisma or Mailpit for AWS SES by writing a single adapter file and changing one line in `container.ts`.
- **In-Memory TTL Cache with Stale-On-Error**: Guards against upstream rate-limiting or outages by serving stale data when the upstream fails.
- **Design Tokens**: `tokens.css` defines all spacing, colors, font sizes, and radii. No hardcoded colors exist in React components.
- **Nginx Reverse Proxy**: In production, Nginx serves static assets on port 8080 and proxies `/api/` to the backend container, eliminating CORS in production.

*(Full architectural details recorded in [`DECISIONS.md`](./DECISIONS.md))*

---

## What Was Dropped / Deferred (PoC Boundaries)
- Persistent enquiry storage in a relational database (enquiries are delivered via SMTP).
- Pagination for search and category product grids.
- Administrative portal for curating featured products.
- CAPTCHA integration (honeypot field used for lightweight spam deterrence).
- Distributed Redis caching (deferred in favor of in-memory decorator).

---

## How to Run & Test

### Docker Compose (Recommended)
```bash
cp .env.example .env
docker compose up --build
```
- **Web App**: [http://localhost:8080](http://localhost:8080)
- **API**: [http://localhost:3001/api/v1](http://localhost:3001/api/v1)
- **Health Check**: [http://localhost:3001/health](http://localhost:3001/health)
- **Mailpit UI**: [http://localhost:8025](http://localhost:8025)

### Local Dev (Without Docker)
```bash
npm install
npm run dev
```

### Running All Quality Gates
```bash
npm run lint       # ESLint across all workspaces
npm run typecheck  # TypeScript strict check across all workspaces
npm run test       # 81 tests passing (67 API, 14 Web)
npm run build      # Full production build
```

---

## AI Usage & Review Findings

Developed using Google DeepMind Antigravity with **Claude Sonnet 4.6 (Thinking)** and **Gemini 3.8 Flash (Medium)**.
Six key AI mistakes were caught during development reviews and corrected:
1. Vitest NodeNext module resolution for test helpers.
2. Cache decorator test spies vs. fake timer advancement.
3. False positive substring check on Zod validation errors.
4. ESLint flat config CommonJS parsing.
5. TypeScript production build configuration including test files.
6. Synchronous RTL query on asynchronous React page loads.

*(Full logs and details recorded in [`AI_USAGE.md`](./AI_USAGE.md))*

---

## Screenshots Guide

When reviewing, verify the following screens:
1. **Home Page**: Displays header with category navigation and search bar, and 5 featured product cards.
2. **Category Page**: Displays breadcrumbs, "Top Rated" section (top 3), and "More in this category" section.
3. **Search Page**: Search query results with count and empty state handling.
4. **Product Details Page**: Full image, title, price, description, and "Enquire" button.
5. **Enquiry Modal**: Form with validation errors and Thank you confirmation screen.
6. **Mailpit Inbox (`http://localhost:8025`)**: Received email with sanitized details and `Reply-To` set to customer email.

---

## Time Spent
Total elapsed time: **200 minutes (~3 hours 20 minutes)**, precisely matching the estimated project budget.
