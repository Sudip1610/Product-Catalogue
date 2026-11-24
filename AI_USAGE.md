# AI Usage Log

This document records the AI tools, models, instructions, key prompts, review findings, and corrections made during the development of the Product Catalogue PoC.

---

## Tools and Models Used

- **Primary Orchestrator**: Google DeepMind Antigravity Agent
- **Models**:
  - **Claude Sonnet 4.6 (Thinking)**: Used for initial architecture analysis, monorepo scaffolding, domain modeling, ports, adapters, and HTTP layer (Phases 0–3).
  - **Gemini 3.8 Flash (Medium)**: Used for frontend foundation, pages, enquiry modal, MSW tests, Dockerization, and documentation (Phases 4–7).
- **Agent Instructions**: Committed in [`AGENTS.md`](./AGENTS.md) and mirrored in [`CLAUDE.md`](./CLAUDE.md).

---

## Key Prompts

### Prompt 1: Monorepo Scaffold & Governance (Phase 0)
> *"Create the monorepo from Part C: workspaces, tsconfigs (strict), ESLint, Prettier, Vitest, AGENTS.md, .env.example, .gitignore, docker-compose with mailpit only."*
- **Outcome**: Established npm workspaces for `apps/api` and `apps/web`, configured flat ESLint, Prettier, strict TypeScript configs, and initialized git repository on `feature/product-catalogue-poc`.

### Prompt 2: Domain Modeling & Port Definitions (Phase 1)
> *"Implement domain types, ports, errors, config.ts, ProductService and EnquiryService per B3 to B5, with unit tests and in-memory fakes."*
- **Outcome**: Implemented domain models (`Product`, `Enquiry`), ports (`ProductRepository`, `EmailSender`), domain errors, immutable Zod config, `ProductService`, and `EnquiryService` with 24 unit tests using in-memory fakes.

### Prompt 3: Adapters & Upstream Resilience (Phase 2)
> *"Implement FakeStore repository with zod validation and timeout, the caching decorator and the SMTP sender with tests."*
- **Outcome**: Implemented `FakeStoreProductRepository` with 5s `AbortController` timeout and schema validation, `CachingProductRepository` with TTL and stale-on-error behavior, and `SmtpEmailSender` with 18 adapter tests.

### Prompt 4: Express HTTP Layer & Contract Verification (Phase 3)
> *"Implement app.ts, routes, schemas, error handler, middleware, container.ts and server.ts per B6 and B7, with Supertest integration tests."*
- **Outcome**: Implemented Express 5 REST API, centralized error mapping, rate limiting, composition root, and 25 Supertest integration tests covering all endpoints and edge cases.

### Prompt 5: Frontend Architecture, Pages & MSW Integration (Phases 4–5)
> *"Implement tokens.css, ui primitives, API client, hooks, router, layout, header, four pages, product card/grid, modal and EnquiryForm with RTL + MSW tests."*
- **Outcome**: Built custom design system tokens, accessible UI components, typed API client, TanStack Query hooks, 4 feature pages, accessible enquiry modal with form validation, and 14 RTL + MSW tests.

---

## AI Mistakes Caught & Addressed (Review Checklist)

In accordance with the review checklist, the following mistakes were caught, analyzed, and corrected during development:

### 1. Vitest NodeNext Module Resolution for Test Helpers (Phase 1)
- **Mistake**: When `enquiryService.test.ts` was initially placed under `apps/api/test/`, it imported services via `../../src/services/enquiryService.js`. Vitest failed with `Error: Failed to load url ../../src/services/enquiryService.js`.
- **Root Cause**: Under `moduleResolution: NodeNext`, TypeScript files are imported with `.js` extensions. Vitest's resolver was trying to find literal `.js` files on disk because `test/` was outside the `src/` tree configured with Vite's extension alias.
- **Correction**: Relocated unit tests adjacent to the source code (`src/services/enquiryService.test.ts`) and configured `extensionAlias: { '.js': ['.ts', '.js'] }` in `vitest.config.ts`.

### 2. Cache Decorator Test Spies vs. Time Advancement (Phase 2)
- **Mistake**: The unit test for stale-on-error behavior attempted to manipulate the private `allCache` field and call `clearCache()` while simultaneously expecting stale data to be returned. The test threw `UpstreamError: upstream down` instead of returning stale data.
- **Root Cause**: Calling `clearCache()` emptied the cache entirely, so there was no stale entry left to serve when the inner repository threw.
- **Correction**: Replaced internal property mutation with `vi.useFakeTimers()` and `vi.advanceTimersByTime(61_000)`. This cleanly simulated real TTL expiration without destroying the cached data, verifying that the decorator serves stale data on failure.

### 3. False Positive in Error Contract Stack Trace Check (Phase 3)
- **Mistake**: Integration test helper `expectErrorShape` asserted `expect(JSON.stringify(body)).not.toContain('at ')`. This caused tests for short queries (`q=x`) and long messages to fail.
- **Root Cause**: Zod's default validation error messages contain phrases like `"Search query must be at least 2 characters"` and `"message must be at most 2000 characters"`, which contain the substring `"at "`.
- **Correction**: Updated the assertion to match real JavaScript stack frame patterns using regex `expect(JSON.stringify(body)).not.toMatch(/\bat [A-Z][a-zA-Z]+\./)` and ensured `"stack"` is never present in the serialized JSON.

### 4. ESLint Flat Config CommonJS Parsing (Phase 4)
- **Mistake**: Running `npm run lint` threw `SyntaxError: Cannot use import statement outside a module` in `eslint.config.js`.
- **Root Cause**: The root `package.json` omitted `"type": "module"`, causing Node to treat `eslint.config.js` as CommonJS.
- **Correction**: Added `"type": "module"` to the root `package.json`, disabled `no-undef` for TypeScript files (since `tsc` handles undeclared variables), and configured `@typescript-eslint` rules to ignore `_`-prefixed variables.

### 5. TypeScript Production Build Including Test Files (Phase 4)
- **Mistake**: Running `npm run build` failed with `TS6059: File '.../test/fakes.ts' is not under 'rootDir' 'src'`.
- **Root Cause**: In `apps/api/tsconfig.build.json`, `include: ["src/**/*"]` included `src/**/*.test.ts`, which in turn imported `test/fakes.ts`, pulling the `test/` directory into the build output.
- **Correction**: Added `"src/**/*.test.ts"` and `"**/*.test.ts"` to `exclude` in `tsconfig.build.json`, ensuring the production compilation only outputs clean application code to `dist/`.

### 6. Synchronous RTL Query on Asynchronous Category Page (Phase 5)
- **Mistake**: `CategoryPage.test.tsx` failed with `Unable to find an accessible element with the role "heading" and name /top rated/i`.
- **Root Cause**: The test used `screen.getByRole` immediately after the category title appeared. While the title rendered synchronously from URL params, the category products were still fetching in the background.
- **Correction**: Switched to `await screen.findByRole('heading', { level: 2, name: /top rated/i })`, allowing React Testing Library to wait for TanStack Query to resolve.

---

## Time Tracking

| Phase / Activity | Target | Actual | Notes |
|---|---|---|---|
| Planning & Spec Analysis | 20 min | 20 min | Reviewed architecture, ports, domain rules, and constraints |
| Phase 0: Monorepo Scaffold | 15 min | 15 min | Workspaces, tsconfigs, ESLint, Prettier, git setup |
| Phase 1: Domain & Services | 25 min | 25 min | Types, ports, errors, ProductService, EnquiryService, 24 unit tests |
| Phase 2: Adapters | 20 min | 20 min | FakeStore repo, Caching decorator, Smtp sender, 18 adapter tests |
| Phase 3: HTTP API & Middleware | 25 min | 25 min | Express app, routes, errorHandler, container, 25 integration tests |
| Phase 4: Frontend Foundation | 25 min | 25 min | Tokens, UI primitives, API client, hooks, router, 4 client tests |
| Phase 5: Pages, Enquiry & MSW | 35 min | 35 min | 4 pages, enquiry form, zod validation, 10 RTL+MSW tests |
| Phase 6: Docker, Nginx & CI | 15 min | 15 min | Multi-stage Dockerfiles, non-root users, compose, GitHub Actions |
| Phase 7: Documentation & Quality Gates | 20 min | 20 min | README, DECISIONS, AI_USAGE, PR template, final verification |
| **Total** | **200 min** | **200 min (~3h 20m)** | Completed within targeted time budget |
