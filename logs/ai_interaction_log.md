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

---

## [2026-06-10 12:14] — Onboarding Module + Auth Middleware

**Type:** Feature

**Files Affected:** `apps/backend/src/modules/onboarding/onboarding.types.ts`, `apps/backend/src/modules/onboarding/onboarding.schema.ts`, `apps/backend/src/modules/onboarding/onboarding.router.ts`, `apps/backend/src/middleware/authMiddleware.ts`, `apps/backend/src/@types/express/index.d.ts`, `apps/backend/src/app.ts`

**Decision / Action:**
Implemented the Onboarding module following the same Route-Centric pattern established by the Auth module. The single `POST /api/onboarding` endpoint is protected by a new `authMiddleware` that verifies the Bearer JWT and attaches `req.user` to the request. The route validates the incoming body against a Zod schema (enforcing `InvestorType` and `ContentType` as Prisma native enums, and requiring at least one item in both arrays), then executes a single atomic Prisma nested write: `prisma.preference.update` with a nested `user.update` that flips `hasCompletedOnboarding` to `true` in the same database round-trip. A global Express `Request` type augmentation (`src/@types/express/index.d.ts`) was added so `req.user` is fully typed across the application without casting.

**Alternatives Considered:** Using `prisma.$transaction([...])` for the two-table update. Rejected in favour of Prisma's nested write syntax, which is cleaner, achieves the same atomicity guarantee, and avoids the boilerplate of constructing an explicit transaction array.

**Trade-offs:** The non-null assertion `req.user!.id` inside the route handler is safe here because the route is always preceded by `authMiddleware` (applied via `router.use`), which guarantees `req.user` is set before any handler runs. A stricter alternative would be a helper that throws an `AppError` instead of asserting, but that adds indirection without meaningful safety gain in this context.

---

## [2026-06-10 15:15] — Feature: Resilient Dashboard API & AI Insights Integration

**Type:** Feature | Integration | Schema  
**Files Affected:**
- `apps/backend/src/modules/dashboard/dashboard.router.ts`
- `apps/backend/src/modules/dashboard/dashboard.service.ts`
- `apps/backend/src/modules/dashboard/dashboard.mock.ts`
- `apps/backend/src/modules/dashboard/dashboard.types.ts`
- `apps/backend/src/modules/dashboard/ai.service.ts`
- `apps/backend/src/app.ts`

**Decision / Action:** Implemented the complete core Dashboard data aggregation layer under the protected `/api/dashboard` sub-router. Engineered multi-source asynchronous adapters linking CoinGecko (market prices, expanded to 6 core assets) and CryptoPanic (filtered hot news headlines). Eliminated all occurrences of the `any` type by introducing strong raw payload definitions (`CryptoPanicRawPost`) and type-safe output boundaries (`CryptoPricesResponse`). Integrated an abstract OpenRouter AI execution service leveraging `google/gemini-2.5-flash` to process user-preference state vectors (Investor Type + Asset tokens) alongside current spot pricing to output stateless 3-sentence action summaries. Built resilient catch-all static memory fallbacks across all dynamic integrations to guarantee continuous uptime under external vendor throttling.

**Alternatives Considered:** - *Relying on interactive prompt schemas inside core routers*: Rejected to isolate third-party transport latency away from network routes. Separating pure AI text synthesis into `ai.service.ts` ensures isolated mock coverage and loose database coupling.

**Trade-offs:** - Hardcoding asset ticker mappings within the localized domain layer introduces a tiny tech debt footprint (marked with a TODO), but removes early over-engineering by avoiding dynamic asset configuration database lookups during MVP review cycles.

---

## [2026-06-10 17:00] — Feature: Generalized Feedback Module & AI Training Hooks

**Type:** Feature | Database
**Files Affected:**
- `apps/backend/src/modules/feedback/feedback.router.ts`
- `apps/backend/src/modules/feedback/feedback.types.ts`
- `apps/backend/src/modules/feedback/feedback.schema.ts`
- `apps/backend/src/modules/feedback/feedback.service.ts`

**Decision / Action:** Finalized the feedback module to handle universal upvotes/downvotes across all dashboard sections (`NEWS`, `PRICE`, `AI_INSIGHT`, `MEME`). Aligned the routing logic with the optimized Prisma schema utilizing a compound unique constraint (`userId_sectionType_contentId`) for atomic `upsert` operations. Integrated the `contentSnippet` field as a payload parameter to fulfill the bonus requirement, laying the architectural groundwork for future LLM training loops (allowing analysts to correlate negative feedback with specific context snippets).

**Alternatives Considered:** - *Creating separate endpoints for each section type (e.g., `/api/feedback/news`)*: Rejected. A single generic endpoint with robust Zod enum validation scales better and reduces frontend integration complexity.

**Trade-offs:** - Storing `contentSnippet` directly in the feedback table introduces slight data duplication (denormalization) if the content is static, but heavily optimizes future analytical queries for model fine-tuning without requiring complex JOINs to external content tables.