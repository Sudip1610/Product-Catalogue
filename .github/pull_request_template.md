## Summary

<!-- One paragraph describing what this PR does -->

## Acceptance Criteria

- [ ] 5 featured products visible on the home page
- [ ] Category page shows top-rated + other products
- [ ] Text search filters products correctly
- [ ] Product detail page renders all fields
- [ ] Enquiry form validates client-side and submits successfully
- [ ] Sales inbox receives the email (visible in Mailpit at http://localhost:8025)
- [ ] Browser never calls fakestoreapi.com directly
- [ ] `docker compose up --build` starts all services within 10 minutes
- [ ] No secrets committed (`.env.example` only)

## Architecture Overview

```
Browser (React SPA)
   |  HTTP /api/v1/*
   v
Express API  --- routes → controllers → services → ports
                                                    |
              ┌─────────────────────────────────────┴──────────────────────┐
              v                                                             v
  ProductRepository (port)                                       EmailSender (port)
  FakeStoreProductRepository (adapter)                        SmtpEmailSender (adapter)
  CachingProductRepository (decorator)
              |
              v
     fakestoreapi.com
```

## Key Decisions and Trade-offs

See `DECISIONS.md` for full details.

## What Was Dropped / Not Implemented

- Pagination
- Admin UI
- Persistent enquiry storage
- CAPTCHA
- Playwright e2e tests
- Redis cache

## How to Run and Test

```bash
cp .env.example .env
docker compose up --build
# App:     http://localhost:8080
# API:     http://localhost:3001/api/v1
# Mailpit: http://localhost:8025
```

Run tests:
```bash
npm install
npm test
```

## AI Usage

See `AI_USAGE.md`. All generated code was reviewed; notable corrections documented there.

## Screenshots

<!-- Add screenshots: home, category, search, product page, enquiry modal, Mailpit email -->

## Time Spent

<!-- Fill in total hours -->
