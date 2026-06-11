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

---

## [2026-06-10 19:12] Frontend Initialization & Core Infrastructure

### Shared Context
- Initialized React + TypeScript frontend application via Vite.
- Configured Tailwind CSS with the project's Dark Crypto Mode design tokens (`void`, `surface`, `border`, etc.).

### Component/Feature Decisions
- **Auth Store (`src/store/authStore.ts`)**: Built a global state using Zustand combined with the `persist` middleware to safely cache JWT tokens and onboarding flags across browser reloads.
- **API Client (`src/utils/api.ts`)**: Implemented a centralized Axios client with custom interceptors to automatically attach the Bearer token and gracefully catch 401 token expirations for programmatic login redirection.

### Human-AI Collaboration Notes
- Handled Windows-specific NPM pathing/CLI quirks by pivoting from automated initialization to explicit manual design-token and PostCSS file declarations.

---

## [2026-06-10 19:30] — Frontend: Client-Side Routing & Auth-Aware Route Guards

**Type:** Feature  
**Files Affected:**
- `apps/frontend/src/App.tsx`
- `apps/frontend/src/components/RouteGuards.tsx`

**Decision / Action:** Wired up the full client-side routing tree using `react-router-dom v7` and implemented four stateless guard components that derive redirect decisions exclusively from the Zustand auth store (`token`, `user`, `hasCompletedOnboarding`):

1. **`ProtectedRoute`** — Blocks unauthenticated access; redirects to `/login` if `token` or `user` is absent.
2. **`PublicRoute`** — Prevents already-authenticated users from accessing `/login` and `/register`; redirects them to `/dashboard` or `/onboarding` depending on their onboarding status.
3. **`OnboardingGuard`** — Prevents users who have already completed onboarding from re-entering the `/onboarding` flow; redirects them to `/dashboard`.
4. **`DashboardGuard`** — Prevents users who have not yet completed onboarding from accessing `/dashboard`; redirects them to `/onboarding`.

`App.tsx` composes these guards as nested `<Route element={<Guard />}>` wrappers, keeping route protection declarative and co-located with route definitions. Stub page components are inlined as placeholder `div`s until full page implementations are built.

**Alternatives Considered:** - *Imperative guards inside each page component*: Rejected. Declarative nested route wrappers keep protection logic centralized and prevent accidental omissions when adding new routes.

**Trade-offs:** - Stub page components are co-located in `App.tsx` temporarily. These will be extracted into their own files once full implementations begin, at which point `App.tsx` will contain only routing structure.

---

## [2026-06-10 20:12] Bug Fix: Auth Form Submission — Token Key Mismatch & 401 Interceptor Hard Reload

**Files Changed:** `apps/frontend/src/pages/Register.tsx`, `apps/frontend/src/pages/login.tsx`, `apps/frontend/src/utils/api.ts`

**Bugs Fixed:**

1. **Token key mismatch (root cause):** `auth.service.ts` returns `{ accessToken, user }` but both pages read `response.data.token` (undefined). `setAuth` stored `undefined` as the token, causing `ProtectedRoute` to immediately redirect back to `/login` after every successful auth call — making it appear as if the form did nothing and no data was written.
   - Fix: `response.data.token` → `response.data.accessToken` in both `Register.tsx` and `login.tsx`.

2. **401 interceptor hard page reload on auth pages:** `api.ts` unconditionally called `window.location.href = '/login'` on any 401. When login failed with wrong credentials, the interceptor reloaded the page before the component `catch` block could run, wiping the console and blocking the error UI.
   - Fix: Added a `publicPaths` guard — the hard redirect is skipped when `window.location.pathname` is `/login` or `/register`.

3. **Missing `console.error`:** Errors were surfaced in UI but never logged to the developer console.
   - Fix: Added `console.error` with status + response body (Axios errors) and raw error (unexpected) in both pages.

**Backend Assessment:** No changes required. `asyncHandler` + global error handler in `app.ts` already forward and log errors correctly.

---

## [2026-06-10 20:33] Frontend Routing & Onboarding Implementation

### Shared Context
- Designed and built the client-side routing hierarchy and user preference capture layer.

### Component/Feature Decisions
- **Route Guards (`src/components/RouteGuards.tsx`)**: Created declaration-based conditional wrappers (`ProtectedRoute`, `PublicRoute`, `OnboardingGuard`, `DashboardGuard`) that read live Zustand state to automatically evaluate session validity and onboarding completeness.
- **Auth UI (`src/pages/Login.tsx`, `src/pages/Register.tsx`)**: Developed standard login and sign-up interfaces wired into the central Axios interceptor layer to capture and digest backend token responses seamlessly.
- **Onboarding Interface (`src/pages/Onboarding.tsx`)**: Implemented an interactive multi-step preference matrix with granular custom selectors to feed formatted asset lists, content tracks, and investor archetypes directly into the state orchestration pipeline.

### Human-AI Collaboration Notes
- Maintained a strict frontend scope focus during debugging by decoupling temporary system 500 exceptions from client-side visual design validations.

---

## [2026-06-10 21:05] Frontend Asynchronous Infrastructure & Optimistic Feedback Core

### Shared Context
- Orchestrated the state-fetching and feedback registration engine for the main personalized investor dashboard shell.
- Connected the global asynchronous runtime context to the application root to enable independent card rendering.

### Component/Feature Decisions
- **Query Provider Implementation (`src/main.tsx`)**: Configured and initialized the central TanStack `QueryClient` to wrap the core application tree. Hardcoded window-refocus fetching overrides to conserve public API limits and manage component refresh frequencies.
- **Dashboard State Management Hooks (`src/hooks/useDashboard.ts`)**:
  - Engineered an atomic data loading wrapper (`useDashboardSection`) built over custom Axios resource paths with standardized 2-minute stale-time limits.
  - Implemented an advanced optimistic update routine (`useSubmitFeedback`) utilizing TanStack Query's `onMutate`, `onError`, and `onSettled` cycle hooks. The mechanism instantly manipulates local vote cache matrices, records contextual database targets (`previousVotes`), and performs immediate rollback operations upon connection failure.
  - Isolated localized client action maps via `useUserVotes` to safely pull past activity tracks dynamically.
- **Re-usable Interactive UI (`src/components/VotingButtons.tsx`)**: Developed a DRY-compliant, preference-aware interactive element block. Wired directly into the dynamic feedback hook environment to instantly toggle component states without requiring global dashboard refetches.

### Human-AI Collaboration Notes
- Safely isolated global network error cascades by building out the shared core voting architecture and state contexts before drafting individual component card content containers.

---

## [2026-06-10 21:54] Frontend Card Orchestration & Layout Resilience

### Shared Context
- Completed the implementation of the 4 preference-driven dashboard cards and integrated them into a responsive grid view.
- Handled decoupled rendering pipelines and established structural synchronization between client expectation models and live backend endpoints.

### Component/Feature Decisions
- **Decoupled Dashboard Sub-components (`src/components/dashboard/`)**:
  - **`CoinPricesCard.tsx`**: Wired into the `/dashboard/prices` route to parse live token rates for the user's specific assets.
  - **`MarketNewsCard.tsx`**: Wired into the `/dashboard/news` route to display an active feed of customized market insights.
  - **`AiInsightCard.tsx`**: Wired into the `/dashboard/insight` route to render text-based daily summaries calibrated to investor personas.
  - **`MemeCard.tsx`**: Wired into the `/dashboard/meme` route to dynamically fetch curated static media assets.
- **Layout Defensiveness & Error Boundaries (`src/components/dashboard/`)**:
  - Implemented strict runtime array and type validations (`Array.isArray()` and type matches) across all fetch-dependent components. This isolates incoming network failures (such as server 500 or 404 responses) and forces individual cards to drop back to stable custom fallbacks without unmounting the parent shell layout or causing application crashes.
- **Dashboard Grid Composition (`src/pages/Dashboard.tsx`)**: Assembled the core viewport framework using an independent asynchronous multi-column structure. Attached a secure state-clearing routine for the top navigation block to execute atomic token revocation on the global store during logout.

### Human-AI Collaboration Notes
- Safely optimized development speed by applying systematic validation wrappers directly at the local component level, rendering explicit fallback text states while preserving layout grid integrity.

---

## [2026-06-10 22:20] Dashboard Resilience, Route Fix & DB Connection Repair

### Changes Made

#### Root Cause — Prisma Never Connecting
- **`apps/backend/prisma/schema.prisma`**: Added the missing `url = env("DATABASE_URL")` line to the `datasource db` block. Without it, Prisma had no connection string and every query threw `ECONNREFUSED`.

#### API Contract Alignment (Backend ↔ Frontend)
- **`dashboard.types.ts`**: Added three frontend-facing contract types: `CoinPriceToken` (array item for `/prices`), `AiInsightResponse` (`{ id, insight }` for `/insight`), and `CryptoMemeResponse` (`{ id, imageUrl, caption? }` for `/meme`). Kept internal `CryptoPricesResponse` Record shape for CoinGecko mapping only.
- **`dashboard.mock.ts`**: Replaced loose mock objects with typed exports: `MOCK_PRICE_MAP` (internal), `MOCK_COIN_PRICES` (array of `CoinPriceToken`), `MOCK_NEWS`, `MOCK_INSIGHT`, and a `getDailyMeme()` helper that deterministically rotates a meme pool by calendar day.
- **`dashboard.service.ts`**: Rewrote `getCryptoPrices` to return `CoinPriceToken[]` (array) instead of a Record — aligning with the frontend's `Array.isArray(data)` guard. Added `getAiInsight(investorType, assets)` with full try/catch and `MOCK_INSIGHT` fallback. Added `getDailyMemeFallback()` wrapper returning a single `CryptoMemeResponse`.

#### Route Fixes (4 routes were 404ing)
- **`dashboard.router.ts`**: Added missing `GET /insight` route (reads user prefs → calls `getAiInsight`). Renamed `/memes` → `/meme` to match frontend call. All preference DB queries wrapped in try/catch so a dead DB defaults to safe values instead of crashing the handler.
- **`feedback.router.ts`**: Added `GET /my-votes` route consumed by `useUserVotes()` hook in the frontend.
- **`feedback.service.ts`**: Added `getUserVotes(userId)` with a try/catch that returns `[]` if the DB is unreachable.

#### Bug Fix — Wrong Function Arity
- **`ai-insight.ts`**: Fixed call to `generateCryptoInsight` — was missing the required `investorType` first argument, causing a silent runtime mismatch.

### Outcome
- TypeScript compiles with zero errors (`npx tsc --noEmit` → exit 0).
- All 4 dashboard cards now have correct, resilient endpoints: `/prices`, `/news`, `/insight`, `/meme`.
- `GET /feedback/my-votes` now resolves with live data or an empty array instead of 404.
- Every external API call (CoinGecko, CryptoPanic, OpenRouter) and every DB query has a typed mock fallback returning `200 OK`.

---

## [2026-06-10 22:55] Advanced Frontend Refactoring & Architecture Optimization

### Shared Context
- Executed a major clean-code and decoupling overhaul across the layout, route validation, and form orchestration matrices.

### Component/Feature Decisions
- **Zustand Re-rendering Performance Core (`src/components/RouteGuards.tsx`)**: Refactored all application routing guards (`ProtectedRoute`, `PublicRoute`, `OnboardingGuard`, `DashboardGuard`) to abandon full-store object destructuring. Implemented clean atomic selectors (`state => state.field`) to target specific dependencies, drastically lowering redundant parent view lifecycle ticks.
- **Form Card Layout Adaptability (`src/components/ui/AuthCard.tsx`)**: Re-engineered the session box container to support custom widths via an optional `maxWidthClassName` prop (defaulting to `max-w-md` for standard forms, overridden with `max-w-2xl` for survey matrix formats). This resolved viewport structural compression bugs during user persona steps while enforcing central component style re-use.
- **Shared Input Primitives (`src/components/ui/AuthInput.tsx`)**: Extracted a completely generic, DRY-compliant icon-slotted text input element to centralize custom interaction metrics and design consistency across core entry fields.
- **Dynamic Array Option Lists (`src/components/ui/SelectionGrid.tsx`)**: Standardized custom matrix option inputs into an isolated, multi-mode selector primitive. Built support for standard string options and object variants with contextual string properties, decoupling local state configuration files from core layout styles.
- **Type Safety Enhancements (`src/components/VotingButtons.tsx`)**: Eradicated remaining `any` parameters in array methods and mapped local iterations to explicit interface entities (`UserVoteItem`), securing type safety boundaries.

### Human-AI Collaboration Notes
- Capitalized on active design intuition and structural checking (`npm run build`) to safely rollback rigid layout rules, upgrading them into responsive and adaptable design elements.

---

## [2026-06-11] fix(testing): resolve Jest global types and prisma mock imports

### Changes Made
- **`apps/backend/src/shared/database/__mocks__/prismaClient.ts`**: Removed two incorrect import statements — `import { beforeEach } from 'node:test'` and `import { jest } from 'jest'`. Jest's `jest`, `beforeEach`, `describe`, `it`, and `expect` are injected as globals by the Jest runtime; they must never be explicitly imported.
- **`apps/backend/tsconfig.json`**: Added `"types": ["jest", "node"]` to `compilerOptions` so TypeScript explicitly pulls in `@types/jest` and `@types/node` globals. Extended `typeRoots` to include `../../node_modules/@types` to correctly resolve hoisted monorepo packages.
- Ran `npm install` from monorepo root to ensure all packages (including `@types/jest`, `@types/node`, `jest-mock-extended`, `ts-jest`, `supertest`) were present.

### Verification
- `tsc --noEmit` in `apps/backend` exits with zero errors.

---

## [2026-06-11] feat(testing): add auth integration test suite

### Changes Made
- **`apps/backend/src/modules/auth/auth.spec.ts`** (new): 3 integration tests covering the two auth endpoints:
  - `POST /api/auth/register` — Happy path: `prismaMock.user.findUnique` returns `null` (no duplicate), `prismaMock.user.create` returns the new user; asserts 201 status, `accessToken` in body, and correct `user` shape.
  - `POST /api/auth/register` — Validation path: malformed payload (missing name/password, invalid email) triggers Zod; asserts 400 + `'Validation failed.'` message.
  - `POST /api/auth/login` — Happy path: `prismaMock.user.findUnique` returns user with a real bcrypt hash; asserts 200, `accessToken`, and correct email in response.

### Verification
- Tests run successfully as part of the full suite (`npm run test` → 10 tests, 0 failures).

---

## [2026-06-11] feat(testing): add onboarding integration test suite

### Changes Made
- **`apps/backend/src/modules/Onboarding/onboarding.spec.ts`** (new): 7 integration tests covering `POST /api/onboarding` — happy path with `prismaMock.preference.update`, two 401 paths (missing/invalid JWT), and four 400 Zod-validation paths (empty body, empty array, invalid `InvestorType` enum, invalid `ContentType` enum).
- **`apps/backend/src/modules/auth/auth.spec.ts`**: Added `jest.mock('../../shared/database/prismaClient')` and switched to deriving `prismaMock` from the mocked module import (`prisma as DeepMockProxy<PrismaClient>`) instead of a direct `__mocks__/` path import.
- **`apps/backend/jest.config.ts`**: Added `transform` with `isolatedModules: true` to suppress ts-jest TS151002 warning for Node16 module kind.
- **Root cause discovered**: Importing `prismaMock` directly from `__mocks__/prismaClient.ts` creates a separate Jest module-registry instance from the one services receive through `jest.mock`. The fix is to import `prisma` from the mocked module path itself (same registry entry) and cast to `DeepMockProxy<PrismaClient>`.

### Verification
- `npm run test` → **2 suites, 10 tests, 0 failures**.

---

## [2026-06-11] feat(testing): add dashboard integration test suite

### Changes Made
- **`apps/backend/src/modules/dashboard/dashboard.spec.ts`** (new): 9 integration tests across 4 routes. Each route has a Happy Path (service mock returns live data) and a Resiliency Path (service mock throws, router falls back to static JSON with 200 OK). Additional authentication guard test loops all 4 routes to verify 401 on missing token.
- **`apps/backend/jest.config.ts`**: Removed deprecated `isolatedModules` from `ts-jest` transform options (now belongs in tsconfig per ts-jest v30 migration).
- **`apps/backend/tsconfig.json`**: Added `"isolatedModules": true` per ts-jest v30 recommendation.

### Verification
- `npm run test --testPathPatterns=dashboard.spec` → **1 suite, 9 tests, 0 failures**, zero warnings.

---

## [2026-06-11] feat(testing): add feedback integration test suite

### Changes Made
- **`apps/backend/src/modules/feedback/feedback.spec.ts`** (new): 9 integration tests across both feedback endpoints.
  - `POST /api/feedback`: 2 happy paths (UP vote creates record; DOWN vote overwrites via upsert), 2 guard paths (missing/invalid JWT → 401), 3 Zod validation paths (invalid `VoteType`, missing `sectionType`, empty `contentId` → 400).
  - `GET /api/feedback/my-votes`: happy path (returns ordered vote list, asserts `findMany` called with correct `userId`), resiliency path (`findMany` throws → service catches and returns `[]` with 200).

### Verification
- `npm run test --testPathPatterns=feedback.spec` → **1 suite, 9 tests, 0 failures**.

### [2026-06-11] — Backend Test Pipeline Validation Complete

---

- **What was implemented:** Comprehensive integration test suites for all core backend modules (`auth`, `onboarding`, `dashboard`, `feedback`) totaling 28 deterministic tests with 100% success rate.
- **Architectural Decisions:**
  1. **Dual-Layered Mocking Strategy:** Isolated DB layers via typed `prismaMock` (`jest-mock-extended`) and external services (CoinGecko, CryptoPanic, OpenRouter) via Jest automated service mocks to eliminate operational flakiness.
  2. **Resiliency Validation:** Hardened code quality by explicitly testing failure boundaries. Verified that downstream API/DB timeouts trigger local static JSON or fallback array injection under a safe `200 OK` network contract.
  3. **Data Integrity:** Tested multi-path Zod validation boundaries for complex schemas, guaranteeing that corrupted client-side objects, empty arrays, or prohibited Enum values are stopped at the gateway with clear `400 Bad Request` messages.
- **Status:** 4 suites, 28 tests, 0 failures. Backend ready for deployment staging.

---

### [2026-06-11] — Frontend Fractal / Component-Driven Architecture Refactor

---

- **What was implemented:** Migrated all 11 frontend components from flat `.tsx` files into self-contained fractal folders (`ComponentName/ComponentName.tsx` + `index.ts` barrel). Created a `SelectionGrid.spec.tsx` test suite covering string options, object options, selection state, and `accentColor` styling. Also bootstrapped the Vitest test setup file (`src/test/setup.ts`).
- **Architectural Decisions:**
  1. **Barrel `index.ts` files:** Every component folder exposes a single `index.ts` so all existing page-level import paths (`../components/ui/AuthInput`, etc.) resolve automatically through TypeScript/Vite directory resolution — zero import-path churn in consumer files.
  2. **Depth-corrected inter-component imports:** Dashboard card components (`AiInsightCard`, `CoinPricesCard`, `MarketNewsCard`, `MemeCard`) were moved one level deeper; their `useDashboard`, `VotingButtons`, and `Card` imports were updated from `../../` to `../../../` / `../../` accordingly.
  3. **Named re-exports for `RouteGuards`:** Because `RouteGuards` exports four named guards (not a default), its `index.ts` uses `export { ... } from './RouteGuards'` rather than `export { default }`, keeping the `App.tsx` destructured import intact.
- **Status:** `tsc --noEmit` exits 0. All 11 components migrated, originals deleted, TS server clean and green.

---

### [2026-06-11] — Frontend Component Test: SelectionGrid

- **What was implemented:** Unit and structural tests for the polymorphic `SelectionGrid.tsx` component using Vitest and React Testing Library.
- **Architectural Decisions:** 1. Tested code paths for both input contracts (simple `string[]` arrays and detailed `{ id, name, desc }` object configurations) to preserve structural polymorphism.
  2. Leveraged native string matching and DOM sub-tree traversal (`querySelector('svg')`) to implicitly verify conditional rendering of UI indicators (Lucide icons).
  3. Asserted strict CSS class injection to validate real-time dynamic theme compilation (`accentColor`) against Tailwind v4 configurations.
- **Status:** 9 tests passed, 0 failures.

---


### [2026-06-11] — Frontend Integration Test: Route Guards & Authentication Routing

- **What was implemented:** Behavioral integration tests for the security matrix in `RouteGuards.tsx` (`ProtectedRoute`, `OnboardingGuard`, `DashboardGuard`, and `PublicRoute`).
- **Architectural Decisions:**
  1. Driven in-memory store variations explicitly via `useAuthStore.setState()`, maintaining native TypeScript type-safety while completely avoiding fragile module-level overrides.
  2. Integrated `localStorage.clear()` globally across test hooks to suppress automatic `persist` hydration leaks.
  3. Built an isolated execution pipeline utilizing React Router's `<MemoryRouter>` with embedded semantic target strings to mathematically verify redirect operations.
- **Status:** 11 tests passed, 0 failures.

---

### [2026-06-11] — Frontend Component Test: VotingButtons

- **What was implemented:** Behavioral unit testing for the `VotingButtons.tsx` feedback micro-interaction component using Vitest.
- **Architectural Decisions:** 1. Implemented data layer decoupling by mocking custom TanStack Query hooks (`useUserVotes` and `useSubmitFeedback`) directly via `vi.mock`.
  2. Verified active/inactive visual states by checking CSS class composition (`border-success`, `border-danger`) depending on mocked backend responses.
  3. Asserted mutation triggers using Vitest spy references (`vi.fn()`) to ensure the user interaction accurately dispatches the expected payload.
- **Status:** 29 tests passed, 0 failures.

---

### [2026-06-11] — Frontend Component Test: AiInsightCard

- **What was implemented:** Isolated layout and state testing for `AiInsightCard.tsx` using Vitest.
- **Architectural Decisions:**
  1. Isolated component boundaries by mocking downstream child dependencies (`VotingButtons`) and container definitions (`Card`) if needed, focusing testing strictly on structural data mapping.
  2. Spied on custom data hooks (`useDashboardSection`) to explicitly mock the asynchronous three-state loop (`isLoading`, `isError`, and successful data delivery).
  3. Validated runtime contract validation by asserting that corrupt or missing `data.insight` structures trigger the core container's fallback resiliency mode.
- **Status:** 40 tests passed, 0 failures.

---

### [2026-06-11] — Frontend Component Test: Card Container

- **What was implemented:** Comprehensive unit and conditional state testing for the generic `Card.tsx` component, totaling 14 tests.
- **Architectural Decisions:** 1. Handled SVG DOM anomalies where `svgElement.className` outputs an `SVGAnimatedString` by migrating assertions to strict `getAttribute('class')` validation for dynamic theme color states (`text-primary`, `text-secondary`, `text-warning`).
  2. Enforced structural isolation by ensuring that loading and error pipelines mathematically suppress the rendering of container header text and children nodes.
- **Status:** Complete. 14 tests passed, 0 failures.

---

### [2026-06-11] — Frontend Component Test: CardGrid Wrapper

- **What was implemented:** Structural layout and grid distribution testing for `CardGrid.tsx` (4 tests).
- **Architectural Decisions:** 1. Validated layout grid compile states by enforcing structural assertions on specific Tailwind CSS responsiveness classes (`grid`, `md:grid-cols-2`).
  2. Verified children tree composition integrity by asserting exact DOM direct descendant constraints (`.children.length`).
- **Status:** Complete. 4 tests passed, 0 failures.

---

### [2026-06-11] — Frontend Component Test: MemeCard

- **What was implemented:** Full unit test suite for `MemeCard.tsx` in `MemeCard.spec.tsx` (12 tests across 5 describe blocks).
- **Architectural Decisions:**
  1. Mocked `../../../hooks/useDashboard` (`useDashboardSection`) to isolate hook boundary and control all data/loading/error states.
  2. Mocked `../../VotingButtons` to a sentinel `<div data-testid="mock-voting-buttons" />` to enforce component isolation.
  3. Test Case 1 (Loading): asserts `"Loading content..."` text from `Card`, absence of title and VotingButtons.
  4. Test Case 2 (Error / Invalid Image): covers three sub-cases — `error` object, `imageUrl` not a string, and `data: null` — all asserting the fallback message `"Could not fetch todays meme. Static backup loaded."`.
  5. Test Case 3 (Happy Path): asserts `<img>` presence, correct `src` and `alt` attributes, VotingButtons sentinel visibility, and absence of loading/error states.
- **Status:** Complete. 74 tests passed across 7 test files, 0 failures.

---

### [2026-06-11] — Frontend Component Test: CoinPricesCard

- **What was implemented:** Full unit test suite for `CoinPricesCard.tsx` in `CoinPricesCard.spec.tsx` (18 tests across 6 describe blocks).
- **Architectural Decisions:**
  1. Mocked `../../../hooks/useDashboard` (`useDashboardSection`) and `../../VotingButtons` following the same isolation pattern as `AiInsightCard` and `MemeCard`.
  2. Test Case 1 (Loading): asserts `"Loading content..."` from `Card`, absence of title and VotingButtons.
  3. Test Case 2 (Error): three sub-cases — `error` object, `data: null`, and non-array `data` — all asserting fallback message `"Live prices temporarily unavailable. Displaying data fallback."`.
  4. Test Case 3 (Empty array): asserts `"No assets selected."`, profile hint text, card title, and VotingButtons sentinel are all present.
  5. Test Case 4 (Happy path): two-token fixture (BTC positive, ETH negative); asserts uppercase symbols, price formatting via `.toLocaleString()`, `text-success` / `text-danger` CSS classes on the change element, VotingButtons sentinel, and absence of loading/error states.
- **Status:** Complete. 92 tests passed across 8 test files, 0 failures.

---

### [2026-06-11] — Frontend Component Test: MarketNewsCard

- **What was implemented:** Full unit test suite for `MarketNewsCard.tsx` in `MarketNewsCard.spec.tsx` (16 tests across 6 describe blocks).
- **Architectural Decisions:**
  1. Mocked `../../../hooks/useDashboard` and `../../VotingButtons` following the established isolation pattern.
  2. Test Case 1 (Loading): asserts `"Loading content..."` from `Card`, absence of title and VotingButtons.
  3. Test Case 2 (Error): three sub-cases — `error` object, `data: null`, non-array `data` — all asserting fallback message `"Market news currently unavailable. Displaying static fallback feed."`.
  4. Test Case 3 (Happy path): single-item fixture; asserts headline text, `<a>` `href`, `target="_blank"`, `rel="noopener noreferrer"` (security), source title, sentiment badge, VotingButtons sentinel, and absence of loading/error states.
  5. Anchor security attributes (`target` + `rel`) tested explicitly via `getByRole('link')` to mirror real browser security constraints.
- **Status:** Complete. 108 tests passed across 9 test files, 0 failures.

---

### [2026-06-11] — Frontend Component Test: AuthCard

- **What was implemented:** Full unit test suite for `AuthCard.tsx` in `AuthCard.spec.tsx` (10 tests across 3 describe blocks).
- **Architectural Decisions:**
  1. No hook or child mocks required — `AuthCard` is a pure presentational component with no external dependencies.
  2. Test Case 1 (Basic Rendering): asserts title via `getByRole('heading')`, subtitle via `getByText`, and absence of any `.text-danger` element when `error={null}`.
  3. Test Case 2 (Error State): asserts error text presence, `text-danger` class, and `bg-danger/10` class directly on the error container element.
  4. Test Case 3 (Children Composition): asserts child form renders and is nested inside `.bg-surface` container via `toContainElement`; asserts custom `maxWidthClassName="max-w-lg"` compiles into the surface container's class list; asserts `max-w-md` default when prop is omitted.
- **Status:** Complete. 118 tests passed across 10 test files, 0 failures.

---

### [2026-06-11] — Frontend Component Test: AuthInput

- **What was implemented:** Full unit test suite for `AuthInput.tsx` in `AuthInput.spec.tsx` (9 tests across 3 describe blocks). Installed `@testing-library/user-event` as a new dev dependency to support realistic DOM interaction simulation.
- **Architectural Decisions:**
  1. No hook or child mocks required — `AuthInput` is a pure presentational component with `InputHTMLAttributes` spread directly onto the native `<input>`.
  2. Test Case 1 (Basic Rendering): label text via `getByText`; icon sentinel via `getByTestId` with parent `absolute` class assertion; `<input>` via `getByRole('textbox')`.
  3. Test Case 2 (Attribute Spreading): queries via `getByPlaceholderText` (required for `type="email"` which does not have ARIA role `textbox`); asserts forwarded `type`, `placeholder`, and `disabled` attributes using `toHaveAttribute` and `toBeDisabled`.
  4. Test Case 3 (User Interaction): `userEvent.type` simulates realistic keystrokes; asserts final `.value` via `toHaveValue('crypto')`; asserts `onChange` fires once per character (6 calls for `"crypto"`); asserts `onChange` is never called when `disabled={true}`.
- **Status:** Complete. 127 tests passed across 11 test files, 0 failures.

---

## [2026-06-11] Register Integration Test Suite
- **Date:** 2026-06-11
- **File:** `apps/frontend/src/pages/Register.spec.tsx`
- **Feature:** Full registration pipeline — form rendering, happy-path API call, and error-handling.
- **Architectural Decisions:**
  1. `vi.hoisted` used to define `mockSetAuth` and `mockApiPost` before module evaluation so they are available inside both `vi.mock` factory closures.
  2. `../utils/api` mocked as a plain object `{ default: { post: mockApiPost } }` — no real Axios instance is constructed during tests.
  3. `../store/authStore` mocked as a selector-passthrough (`useAuthStore: vi.fn((selector) => selector({ setAuth: mockSetAuth }))`). Generic `<T>` syntax avoided in `.tsx` to prevent OXC from treating it as JSX.
  4. `MemoryRouter` wraps every render to satisfy the `<Link to="/login">` inside the component.
  5. `vi.setConfig({ testTimeout: 15_000 })` at file scope compensates for sequential `maxWorkers: 1` environment boot time on Windows paths with spaces.
  6. Button queried via `getByRole('button')` (no name constraint) — avoids expensive ARIA accessible-name tree traversal through Lucide SVG children; `toHaveTextContent('Create Account')` separately asserts the label. `getByText` was ruled out because the AuthCard `<h1>` shares the same "Create Account" string.
  7. Axios error crafted with `Object.assign(new Error(...), { isAxiosError: true, response: { data: { message } } })` — satisfies `axios.isAxiosError()` without importing internal Axios constructors.
- **Test Cases:** 6 tests — 4 initial-form, 1 successful-flow, 1 failure-handling.
- **Status:** Complete. 133 tests passed across 12 test files, 0 failures.

---

## [2026-06-11] — Pages Fractal Refactor + Login Test Suite

- **Date:** 2026-06-11
- **Feature:** Structural refactor of `pages/` to Fractal Component layout + `Login.spec.tsx` integration suite
- **Files Changed:**
  - Created `pages/Register/Register.tsx`, `pages/Register/Register.spec.tsx`, `pages/Register/index.ts`
  - Created `pages/Login/Login.tsx`, `pages/Login/Login.spec.tsx`, `pages/Login/index.ts`
  - Created `pages/Dashboard/Dashboard.tsx`, `pages/Dashboard/index.ts`
  - Created `pages/Onboarding/Onboarding.tsx`, `pages/Onboarding/index.ts`
  - Deleted flat-file originals: `Register.tsx`, `Register.spec.tsx`, `Login.tsx`, `Dashboard.tsx`, `Onboarding.tsx`
- **Key Decisions:**
  1. All four pages promoted from flat files to dedicated sub-folders with `index.ts` barrel files — `App.tsx` imports (`./pages/Login`, etc.) remain unchanged since Node/TypeScript resolves directories to their `index` file automatically.
  2. All internal relative imports within moved files updated from `../` to `../../` depth to reflect the new nesting level.
  3. `Register.spec.tsx` mock paths updated from `../utils/api` → `../../utils/api` and `../store/authStore` → `../../store/authStore` to match the new location.
  4. `Login.spec.tsx` built as a structural mirror of `Register.spec.tsx` applying all proven patterns: `vi.hoisted` for clean mock hoisting, `vi.mock('../../utils/api')`, selector-style `useAuthStore` mock, `MemoryRouter` wrapper, `getByRole('button')` + `toHaveTextContent` split, `vi.setConfig({ testTimeout: 15_000 })`.
  5. Three test scenarios: initial render (email input, password input, "Sign In" button), successful login (POST `/auth/login` payload + `setAuth` call verified), failure handling (Axios 401 error surfaces "Invalid credentials" in DOM).
- **Test Results:** 138 tests passed across 13 test files, 0 failures.

---

## [2026-06-11] — Onboarding Integration Test Suite

- **Date:** 2026-06-11
- **Feature:** `Onboarding.spec.tsx` — full integration coverage for the onboarding page
- **Files Changed:**
  - Created `pages/Onboarding/Onboarding.spec.tsx`
- **Key Decisions:**
  1. `vi.hoisted` builds `mockUpdateOnboardingStatus` and `mockApiPost` before any module evaluation, making them available inside `vi.mock` factory closures without hoisting issues.
  2. `useAuthStore` mocked as a selector-passthrough: factory receives the selector function and calls it with `{ updateOnboardingStatus: mockUpdateOnboardingStatus }` — mirrors the Login/Register pattern exactly.
  3. Submit button queried via `getByRole('button', { name: /generate my custom dashboard/i })` — the regex is case-insensitive and avoids brittle exact-string coupling; also avoids expensive SVG ARIA traversal since the button text is a plain string (no icon sibling when not loading).
  4. Test Case 2 proves the toggle-deselect filter by clicking BTC→ETH→BTC and then submitting; the inspected payload `{ cryptoAssets: ['ETH'] }` is the ground-truth evidence that the array filter ran correctly.
  5. `axios` itself is not mocked — `api.post` is the only call surface touched by the component, so a direct `vi.mock('../../utils/api')` is sufficient and avoids the internal Axios module graph.
- **Test Cases:** 3 tests — 1 validation lock, 1 toggle deselection, 1 happy path.
- **Test Results:** 141 tests passed across 14 test files, 0 failures.

---

## [2026-06-11] — Dashboard Integration Test Suite

- **Date:** 2026-06-11
- **Feature:** `Dashboard.spec.tsx` — full integration coverage for the dashboard page
- **Files Changed:**
  - Created `pages/Dashboard/Dashboard.spec.tsx`
- **Key Decisions:**
  1. `Dashboard` calls `useAuthStore()` **without a selector** (destructures `{ user, logout }` directly), so the mock returns the state object directly rather than invoking a selector function — a distinct pattern from Login/Register/Onboarding which use selector-style hooks.
  2. `vi.hoisted` declares `mockLogout` before module evaluation so it is safely captured inside the `vi.mock` factory closure.
  3. `CardGrid` mocked as a transparent `children` pass-through so the four card stubs still render inside it without needing the real layout implementation.
  4. All four smart child cards (`CoinPricesCard`, `MarketNewsCard`, `AiInsightCard`, `MemeCard`) replaced with `data-testid` stub elements — eliminates every downstream API hook, TanStack Query provider requirement, and Lucide SVG traversal.
  5. Logout button located via `getByTitle('Sign Out')` — the most precise DOM anchor since the `title` attribute is the semantic source of truth; more stable than relying on the CSS-hidden "Logout" span text whose visibility depends on viewport media queries not evaluated by jsdom.
- **Test Cases:** 4 tests — 2 session-binding, 1 sub-component mounting, 1 session exit.
- **Test Results:** 145 tests passed across 15 test files, 0 failures.

---

## Entry 16 — Dashboard Header Extraction, Onboarding Constants, Confirm Guard

- **Date:** 2026-06-11
- **Feature:** Production-grade refactor: DashboardHeader component, onboarding constants module, window.confirm logout guard
- **Files Changed:**
  - Created `pages/Dashboard/components/DashboardHeader.tsx`
  - Updated `pages/Dashboard/Dashboard.tsx` (uses DashboardHeader, cleaned up header markup)
  - Created `pages/Onboarding/onboarding.constants.ts` (typed exports for ASSET_OPTIONS, INVESTOR_TYPES, CONTENT_OPTIONS)
  - Updated `pages/Onboarding/Onboarding.tsx` (imports constants, minor formatting cleanup)
  - Updated `pages/Dashboard/Dashboard.spec.tsx` (window.confirm spy + cancel-path test + vi.restoreAllMocks)
- **Key Decisions:**
  1. `DashboardHeader` receives `userName: string | undefined` and `onLogout: () => void` as props — the confirm guard lives inside the component so `Dashboard` stays clean and the boundary is testable in isolation if needed.
  2. `window.confirm` is called inside `DashboardHeader.handleLogout`; `onLogout` is only invoked when the user confirms, making the prop a pure action with no dialog side-effects.
  3. `onboarding.constants.ts` exports typed interfaces (`InvestorType`, `ContentOption`) alongside the `as const` asset array — gives downstream consumers full TypeScript narrowing.
  4. Dashboard spec: added a second exit-flow test ("cancels dialog → logout NOT called") to cover the false branch of the confirm guard. `vi.restoreAllMocks()` added to `beforeEach` to fully reset `window.confirm` spies between tests — without it, vitest reuses the same spy object across tests and accumulated call counts cause false failures.
- **Test Results:** 146 tests passed across 15 test files, 0 failures.

---

