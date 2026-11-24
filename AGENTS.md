# Agent Instructions

## Project Overview

Product Catalogue PoC – React SPA + Express API, ports-and-adapters architecture.
Data comes from fakestoreapi.com via the **backend only**; the browser never calls it directly.

## Layering Rules

- Services (`src/services/`) depend only on **ports** (`src/domain/ports.ts`).
- Only `src/container.ts` wires concrete adapters to ports.
- Controllers are thin: parse input → call service → shape response.
- Never put ranking, filtering or business logic inside adapters.
- Dependencies always point inward (domain ← services ← adapters, http).

## TypeScript

- `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`.
- Zero `any`. Use `unknown` and narrow, or define a proper type.
- Validate all external data (API responses, request bodies) with **zod**.

## Testing

- Every new behaviour needs a test.
- Use fakes (in-memory implementations of ports), not mocks of internals.
- Integration tests must not hit the real internet (mock `fetch` or use fakes).
- Frontend tests use MSW to intercept `/api/v1` calls.

## Security

- **Never call Fake Store from the frontend.**
- **Never commit secrets** – `.env` is gitignored; use `.env.example` with safe defaults.
- Escape all user input before inserting into email HTML or subject.
- Never put raw user input in email headers other than `Reply-To`.
- CORS must list explicit origins; never use `*`.

## Error Contract

Every error response: `{ error: { code: string, message: string, details?: unknown } }`
Codes: `VALIDATION_ERROR` (400), `NOT_FOUND` (404), `RATE_LIMITED` (429),
       `UPSTREAM_ERROR` (502), `EMAIL_DELIVERY_FAILED` (502), `INTERNAL_ERROR` (500).

## Commands

```bash
npm run lint       # ESLint across all workspaces
npm run typecheck  # tsc --noEmit across all workspaces
npm run test       # Vitest across all workspaces
npm run build      # Production build across all workspaces
npm run dev        # Concurrent dev servers (api + web)
```

## Conventions

- Do not add npm dependencies without asking first.
- Keep commits small; one commit per phase.
- Update `DECISIONS.md` when you make a new assumption or change an existing one.
- Fake Store category `jewelery` is spelled that way upstream; preserve the slug.
- `men's clothing` and `women's clothing` need URL-encoding when used in paths.
