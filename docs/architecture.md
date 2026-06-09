# Architecture Blueprint — Moveo AI Crypto Advisor
> **Master Table of Contents | Read this file first every session.**
> Last updated: see `logs/ai_interaction_log.md`

---

## Table of Contents

1. [Project Summary](#1-project-summary)
2. [Repository Structure](#2-repository-structure)
3. [Documentation Index](#3-documentation-index)
4. [High-Level Architecture Diagram](#4-high-level-architecture-diagram)
5. [Technology Stack Decisions](#5-technology-stack-decisions)
6. [Data Flow Overview](#6-data-flow-overview)
7. [Database Schema Summary](#7-database-schema-summary)
8. [External API Dependency Map](#8-external-api-dependency-map)
9. [Environment Variables Reference](#9-environment-variables-reference)
10. [Deployment Architecture](#10-deployment-architecture)

---

## 1. Project Summary

A personalized crypto investor dashboard. Users register, complete an onboarding quiz (interests, investor type, content preferences), and receive a daily AI-curated dashboard of four sections: Market News, Coin Prices, AI Insight, and a Crypto Meme. Every section supports thumbs-up/down voting; votes are persisted for future model improvement pipelines.

**Assigned by:** Moveo  
**Stack:** React 18 + TypeScript (Vite) · Node.js · PostgreSQL (via Supabase) · Tailwind CSS  
**Deployment:** Frontend → Vercel · Backend → Render · DB → Supabase (hosted PostgreSQL)

---

## 2. Repository Structure

```
moveo-crypto-advisor/
├── .cursorrules                   ← Enforced development standards and code-quality rules
├── .env.example                   ← Required env vars (no secrets)
├── .gitignore
├── README.md
│
├── apps/
│   ├── frontend/                  ← React + Vite + TypeScript + Tailwind
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── api/               ← All HTTP calls (never in components)
│   │   │   ├── components/
│   │   │   │   ├── ui/            ← Design-system primitives
│   │   │   │   └── features/      ← Feature compound components
│   │   │   ├── hooks/             ← Custom React hooks
│   │   │   ├── pages/             ← Route-level thin wrappers
│   │   │   ├── store/             ← Zustand state slices
│   │   │   ├── types/             ← TypeScript types (mirrors backend DTOs)
│   │   │   └── utils/             ← Pure utility functions
│   │   ├── tailwind.config.ts
│   │   └── vite.config.ts
│   │
│   └── backend/                   ← Node.js + Express + TypeScript
│       ├── src/
│       │   ├── config/            ← Env validation, DB client, constants
│       │   ├── modules/
│       │   │   ├── auth/          ← Register, Login, JWT, Refresh
│       │   │   ├── onboarding/    ← Preference save/retrieve
│       │   │   ├── dashboard/     ← Aggregates all 4 data sources
│       │   │   ├── feedback/      ← Vote storage and retrieval
│       │   │   └── user/          ← User profile
│       │   ├── middleware/        ← authMiddleware, errorHandler, rateLimiter
│       │   ├── lib/               ← External API clients
│       │   │   ├── coinGecko.ts
│       │   │   ├── cryptoPanic.ts
│       │   │   ├── openRouter.ts
│       │   │   └── memeProvider.ts
│       │   └── app.ts
│       └── prisma/
│           └── schema.prisma      ← Single source of truth for DB schema
│
├── docs/
│   ├── architecture.md            ← THIS FILE (Master ToC)
│   ├── overview.md                ← Project overview + tech stack rationale
│   └── specs_features.md          ← Detailed feature specs
│
└── logs/
    └── ai_interaction_log.md      ← Mandatory AI session log
```

---

## 3. Documentation Index

| File | Purpose | When to read |
|---|---|---|
| `docs/architecture.md` | **This file.** Master blueprint, repo map, schema summary, deployment. | Start of every session |
| `docs/overview.md` | Assignment summary, tech stack rationale, user flow narrative | Initial context, README writing |
| `docs/specs_features.md` | Detailed specs for Auth, Onboarding, Dashboard, Feedback, Bonus | Before implementing any feature |
| `logs/ai_interaction_log.md` | Continuous log of AI decisions and reasoning | After every major action; auditing |
| `.cursorrules` | Cursor IDE enforcement rules | Automatically loaded by Cursor |
| `apps/backend/prisma/schema.prisma` | Single source of truth for all DB tables | Before any DB query or migration |

---

## 4. High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                        BROWSER                           │
│                                                          │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────┐  │
│  │ Auth Pages │  │  Onboarding │  │ Dashboard Page   │  │
│  │ /login     │  │  /onboarding│  │ /dashboard       │  │
│  │ /register  │  └──────┬──────┘  └────────┬─────────┘  │
│  └─────┬──────┘         │                  │            │
│        │          Zustand Store             │            │
│        └──────────────────────────────────►│            │
└────────────────────────────┬───────────────┘────────────┘
                             │ HTTPS / REST API
                             ▼
┌──────────────────────────────────────────────────────────┐
│              BACKEND  (Express + TypeScript)             │
│                                                          │
│  POST /api/auth/register    POST /api/auth/login         │
│  POST /api/auth/refresh     DELETE /api/auth/logout      │
│  POST /api/onboarding                                    │
│  GET  /api/dashboard                                     │
│  POST /api/feedback                                      │
│                                                          │
│  ┌───────────┐  ┌────────────┐  ┌─────────────────────┐ │
│  │Auth Module│  │ Onboarding │  │  Dashboard Module   │ │
│  └─────┬─────┘  └─────┬──────┘  └──────────┬──────────┘ │
│        │              │                    │             │
│        └──────────────┴────────────────────┘             │
│                       │ Prisma ORM                       │
└───────────────────────┬──────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│           SUPABASE (PostgreSQL)                          │
│  users · preferences · feedback · dashboard_cache        │
└──────────────────────────────────────────────────────────┘
                        │
     ┌──────────────────┼─────────────────────┐
     ▼                  ▼                     ▼
┌──────────┐    ┌───────────────┐    ┌────────────────┐
│CoinGecko │    │  CryptoPanic  │    │  OpenRouter    │
│ API      │    │  API          │    │  (LLM API)     │
└──────────┘    └───────────────┘    └────────────────┘
```

---

## 5. Technology Stack Decisions

| Layer | Choice | Rationale |
|---|---|---|
| **Frontend Framework** | React 18 + Vite | Specified by assignment; Vite for fast HMR and build |
| **Frontend Language** | TypeScript (strict) | Type safety across the stack; catches API shape mismatches at compile time |
| **Styling** | Tailwind CSS v3 | Utility-first, enforces design system via config tokens, zero CSS-in-JS runtime |
| **State Management** | Zustand | Lightweight, no boilerplate; sufficient for auth state + dashboard cache |
| **Frontend Data Fetching** | TanStack Query (React Query) | Caching, background refetch, loading/error states; reduces dashboard latency |
| **Backend Runtime** | Node.js 20 LTS | Consistent TypeScript across stack; vast ecosystem |
| **Backend Framework** | Express 4 | Minimal, well-understood, easy to structure modularly |
| **ORM** | Prisma | Type-safe DB queries auto-generated from schema; migrations via `prisma migrate` |
| **Database** | PostgreSQL (Supabase free tier) | Relational model suits user/preference/feedback relations; Supabase provides auth, hosting, and REST fallback |
| **Auth** | JWT (access + refresh) + bcrypt | Stateless, scales well; refresh token pattern avoids re-login loops |
| **Input Validation** | Zod | Runtime schema validation that also generates TypeScript types — single source of truth |
| **HTTP Client (FE)** | Axios | Interceptors for token injection and refresh; better error handling than raw `fetch` |
| **Logging (BE)** | Pino | Structured JSON logs; low overhead; pairs well with log aggregation on Render |
| **Testing** | Jest + Supertest (BE) · Vitest + RTL (FE) | Standard in the Israeli/global market for full-stack TypeScript projects |

---

## 6. Data Flow Overview

### 6.1 First-Time User Flow
```
Register → Verify → Onboarding Quiz → Save Preferences → Dashboard
```

### 6.2 Returning User Flow
```
Login → Load Preferences → Dashboard (parallel API calls) → Vote → Log Vote
```

### 6.3 Dashboard Data Aggregation (Backend)
```
GET /api/dashboard
  ├── fetchCoinPrices()     → CoinGecko API  (cached 60s in-memory)
  ├── fetchMarketNews()     → CryptoPanic API (cached 5min in-memory)
  ├── generateAIInsight()   → OpenRouter API  (cached 1h per user in DB)
  └── fetchMeme()           → Static JSON asset data (randomized per dispatch)
  └── Merge + return unified DashboardResponseDTO
```

### 6.4 Feedback Flow
```
User clicks 👍/👎 on a section card
  → POST /api/feedback { sectionType, contentId, vote, userId }
  → Optimistic UI update (no page reload)
  → Stored in `feedback` table
  → (Bonus) Offline pipeline reads feedback → retrains recommendation prompt
```

---

## 7. Database Schema Summary

> Full schema in `apps/backend/prisma/schema.prisma`. This is a summary for navigation.

| Table | Key Columns | Notes |
|---|---|---|
| `users` | id, email, name, passwordHash, createdAt | Unique email; no plain-text passwords ever |
| `preferences` | id, userId, cryptoAssets[], investorType, contentTypes[], updatedAt | One-to-one with users; array columns use Prisma `String[]` mapped to `text[]` |
| `feedback` | id, userId, sectionType, contentId, contentSnippet, vote, createdAt | `sectionType` is an enum: NEWS, PRICE, AI_INSIGHT, MEME |
| `dashboard_cache` | id, userId, cacheKey, data (JSON), expiresAt | Per-user AI insight cache; prevents redundant LLM calls |
| `refresh_tokens` | id, userId, tokenHash, expiresAt, revokedAt | Enables token rotation and logout-all-devices |

---

## 8. External API Dependency Map

| API | Purpose | Free Tier Limit | Fallback Strategy |
|---|---|---|---|
| **CoinGecko** | Coin prices + market data | 10–30 calls/min (demo key) | 60-second in-memory cache; static price snapshot JSON if 429 |
| **CryptoPanic** | Crypto market news | 1 req/sec (free) | 5-minute cache; static curated news JSON fallback |
| **OpenRouter** | AI Insight of the Day | ~$1 free credit; rate limited | 1-hour DB cache per user; hardcoded insight fallback |
| **Static Meme Engine** | Contextual crypto memes | Boundless local asset execution | Curated local `memes.json` repository with 20+ static assets |

All external API clients live in `apps/backend/src/lib/`. Each client:
- Has configurable timeout (default 5s)
- Throws typed `ExternalAPIError` on failure
- Is injected into the dashboard service (not called directly from controllers)

---

## 9. Environment Variables Reference

> Copy `.env.example` to `.env`. Never commit `.env`.

```
# Server
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://...

# JWT
JWT_ACCESS_SECRET=<min-32-char-random-string>
JWT_REFRESH_SECRET=<min-32-char-random-string>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# External APIs
COINGECKO_API_KEY=<optional-demo-key>
CRYPTOPANIC_API_KEY=<free-tier-key>
OPENROUTER_API_KEY=<free-tier-key>

# Frontend
VITE_API_BASE_URL=http://localhost:4000
```

---

## 10. Deployment Architecture

```
                 ┌─────────────────┐
  User Browser ──► Vercel (FE CDN) │  → React SPA (static build)
                 └────────┬────────┘
                          │ API calls
                 ┌────────▼────────┐
                 │ Render.com (BE) │  → Node.js/Express container
                 └────────┬────────┘
                          │ Prisma
                 ┌────────▼────────┐
                 │ Supabase (DB)   │  → Hosted PostgreSQL
                 └─────────────────┘
```

**CI/CD:** GitHub Actions → on push to `main`:
1. Run `lint + type-check + tests`
2. On pass: auto-deploy frontend to Vercel, backend to Render

**Estimated cold-start latency (Render free tier):** ~30s. Mitigate with a `/api/health` ping on Vercel deploy completion.
