# AI Interaction Log — Moveo AI Crypto Advisor

> This file documents major architectural decisions, feature implementations, and refactors throughout development.
> **Format:** Append entries chronologically.
> **Maintained by:** The developer, logging incremental architectural evolution.
---

## How to Read This Log

Each entry follows this structure:

```
## [YYYY-MM-DD HH:MM] — <Short Title>
**Type:** Architecture | Feature | Bugfix | Refactor | Integration | Schema | Documentation
**Files Affected:** list of files
**Decision / Action:** What was done and why.
**Alternatives Considered:** What else was evaluated.
**Trade-offs:** What was gained and what was sacrificed.
```

---

## [PROJECT INIT] — Initial Simple Architecture and Documentation

**Type:** Architecture | Documentation  
**Files Affected:**
- `.cursorrules`
- `docs/architecture.md`
- `docs/overview.md`
- `docs/specs_features.md`
- `logs/ai_interaction_log.md`

**Decision / Action:** Generated a clean, documentation-first suite before writing code. Chose a modular, Route-Centric approach rather than heavy multi-layered classes (Controller/Repository) to ensure maximum readability, easy debugging, and full ownership during technical reviews.

Key decisions:
1. **Monorepo structure** (`apps/frontend`, `apps/backend`) for simple local development and unified asset tracking.
2. **PostgreSQL via Supabase** to natively back user preference shapes and optimistic voting data using structured relations.
3. **Prisma ORM (v7)** as the direct data access client. Since Prisma natively provides robust, auto-generated TypeScript schemas, adding an isolated Repository layer would introduce pure bypass boilerplate with zero practical value.
4. **Standard 24-Hour JWT Authentication** over dual token-rotation cookies. Returning a standalone token in the JSON payload simplifies state tracking, is completely stateless, and avoids cross-origin cookie edge cases.

**Alternatives Considered:**
- *Full Multi-Layer Architecture (Controller -> Service -> Repository)*: Evaluated but rejected. For a project of this scope, creating passive classes that merely forward properties creates artificial bloat and reduces visual code clarity.
- *Pure localStorage tokens with strict 15m expiry*: Rejected as it forces constant logouts without a refresh loop. A standard 24h expiration provides a smoother balance for an assessment app.

**Trade-offs:** - Removing the Repository layer means the Service layer interacts directly with the Prisma client instance. While this tightly couples business logic with our chosen ORM, Prisma's clear syntax keeps methods highly legible and easily maintainable.

---

## [2026-06-10 11:30] — Auth Module - Router, Service & Schema Scaffolding

**Type:** Feature | Architecture  
**Files Affected:**
- `apps/backend/src/modules/auth/auth.router.ts`
- `apps/backend/src/modules/auth/auth.service.ts`
- `apps/backend/src/modules/auth/auth.types.ts`
- `apps/backend/src/modules/auth/auth.schema.ts`
- `apps/backend/prisma/schema.prisma`
- `apps/backend/src/shared/database/prismaClient.ts`

**Decision / Action:** Scaffolded and implemented the core Authentication module using a clean, Route-Centric architecture. To avoid unnecessary class-forwarding layers and prevent boilerplate drift, we omitted separate Controller and Repository files. Instead, data flows linearly through a highly readable, direct async chain:

1. **HTTP & Sanitization Layer (`auth.router.ts`)**: Express route definitions parse request bodies and immediately validate them against strict runtime Zod schemas (`registerSchema`, `loginSchema`). Async errors are wrapped via `asyncHandler` and safely forwarded to our global error interceptor.
2. **Business & Cryptography Layer (`auth.service.ts`)**: Functions process core business operations (`registerUser`, `loginUser`, and the internal helper `findUserByEmail`). Passwords are encrypted securely using `bcryptjs` (10 salt rounds), and tokens are minted using standard 24-hour stateless JWT configurations.
3. **Data Mutation Layer (`prismaClient.ts`)**: Database operations communicate directly with our Supabase PostgreSQL instance using the standard global Prisma Client (v7), leveraging auto-generated TypeScript mappings compiled natively to `node_modules`.

**Alternatives Considered:** - *Multi-Layer Architecture (Controller -> Service -> Repository)*: Evaluated but rejected. Since Prisma natively generates an incredibly robust, type-safe data abstraction layer, an additional explicit Repository class would function as a passive pass-through interface, adding file bloat without structural utility.

**Trade-offs:** - Combining input parsing and HTTP status mappings into the Router layer increases the endpoint specification length, but gathers payload validation, routing logic, and data orchestration contracts into a single, comprehensive source of truth for each endpoint.