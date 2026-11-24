# AI Usage

## Tools and Models

- **Antigravity** (Google DeepMind) with **Claude Sonnet 4.6 (Thinking)** model
- Agent instruction file: `AGENTS.md` (also `CLAUDE.md`)

## Spec

The full build spec was provided as a single structured prompt covering:
- Goal and acceptance criteria (B1)
- Architecture and layering rules (B2)
- Domain model and ports (B3)
- Service behaviour (B4)
- Adapters (B5)
- HTTP API contract (B6)
- Configuration (B7)
- Frontend behaviour (B8)
- Testing requirements (B9)
- Docker / run experience (B10)
- Quality gates (B11)

## Key Prompts

1. **Scaffold prompt** (Phase 0): "Create the monorepo from Part C: workspaces, tsconfigs (strict), ESLint, Prettier, Vitest, AGENTS.md, .env.example, .gitignore, docker-compose with mailpit only."
2. **Domain prompt** (Phase 1): "Implement domain types, ports, errors, config.ts, ProductService and EnquiryService per B3–B5, with unit tests and in-memory fakes."
3. **Adapters prompt** (Phase 2): "Implement FakeStore repository with zod validation and timeout, the caching decorator and the SMTP sender with tests."
4. **HTTP layer prompt** (Phase 3): "Implement app.ts, routes, schemas, error handler, middleware, container.ts and server.ts per B6 and B7, with Supertest integration tests."
5. **Frontend + pages prompt** (Phases 4–5): "Implement tokens.css, ui primitives, API client, hooks, router, layout, header, four pages, product card/grid, modal and EnquiryForm with RTL + MSW tests."

## AI Mistakes Caught

*(Filled in honestly during each phase review)*

1. **TBD** – recorded as issues are found during review.
2. **TBD** – recorded as issues are found during review.

## Time Split

| Activity | Actual |
|---|---|
| Planning and spec review | TBD |
| Phase 0 – Scaffold | TBD |
| Phase 1 – Domain | TBD |
| Phase 2 – Adapters | TBD |
| Phase 3 – HTTP layer | TBD |
| Phase 4 – Frontend foundation | TBD |
| Phase 5 – Pages and enquiry | TBD |
| Phase 6 – Docker and CI | TBD |
| Phase 7 – Docs and PR | TBD |
| **Total** | TBD |
