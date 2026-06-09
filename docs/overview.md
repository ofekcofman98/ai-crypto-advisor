# Project Overview — Moveo AI Crypto Advisor

> Cross-reference: `docs/architecture.md` (system blueprint), `docs/specs_features.md` (feature specs).

---

## Table of Contents

1. [Assignment Summary](#1-assignment-summary)
2. [Core Features at a Glance](#2-core-features-at-a-glance)
3. [User Flow Narrative](#3-user-flow-narrative)
4. [Tech Stack — Choices and Rationale](#4-tech-stack--choices-and-rationale)
5. [Design System](#5-design-system)
6. [Project Constraints and Risk Mitigation](#6-project-constraints-and-risk-mitigation)
7. [Deliverables Checklist](#7-deliverables-checklist)

---

## 1. Assignment Summary

<!-- **Client:** Moveo (internal coding assessment)   -->
**Goal:** Build and deploy a fully functional, personalized crypto investor dashboard web application.

The product has three distinct phases:

1. **Authentication** — Users register with email + name + password; login is JWT-based.
2. **Onboarding** — A first-login quiz that captures the user's crypto interests, investor archetype, and preferred content types. Answers persist to the database as user preferences.
3. **Dashboard** — A daily-refreshing, preference-driven dashboard composed of four content sections: Market News, Live Coin Prices, an AI-generated Insight of the Day, and a Fun Crypto Meme. Each section is individually voteable (👍 / 👎), with votes stored for future model improvement pipelines.

The application must be deployed and publicly accessible. The GitHub repository and database access must also be submitted as part of the assessment deliverables.

**Bonus requirement:** A theoretical write-up on how the feedback voting data would feed into a future model retraining / prompt-engineering pipeline.

---

## 2. Core Features at a Glance

| # | Feature | Scope |
|---|---|---|
| 1 | User Registration & Login | JWT access + refresh tokens, bcrypt password hashing |
| 2 | Onboarding Quiz | 3-question preference capture, saved to DB |
| 3 | Market News Section | CryptoPanic API with static-JSON fallback, filtered by user interests |
| 4 | Coin Prices Section | CoinGecko API, live prices for user's chosen assets |
| 5 | AI Insight of the Day | OpenRouter (LLM) prompt personalized to user's investor type and assets |
| 6 | Fun Crypto Meme | Randomized delivery pipeline via curated static JSON to eliminate external network dependencies |
| 7 | Feedback Voting | Per-section thumbs-up/down, optimistic UI, persisted to DB |
| 8 | AI Interaction Log | Mandatory documentation of all AI-assisted decisions (`logs/ai_interaction_log.md`) |
| 9 | (Bonus) Training Pipeline Design | Written spec: how feedback data feeds into prompt refinement and future fine-tuning |

---

## 3. User Flow Narrative

### 3.1 New User

A user arrives at the root URL and is redirected to `/login`. They click "Create an account" and land on `/register`. After submitting a valid email, display name, and password (with real-time validation feedback), a JWT access token is issued and stored in the Zustand auth store.

Because this is their first login, the backend sets a `hasCompletedOnboarding: false` flag, and the frontend redirects to `/onboarding`.

The onboarding page presents three steps in sequence:

- **Step 1:** Which crypto assets interest you? (multi-select chips: BTC, ETH, SOL, BNB, ADA, DOGE, etc.)
- **Step 2:** What type of investor are you? (single-select: HODLer, Day Trader, NFT Collector, DeFi Explorer)
- **Step 3:** What kind of content would you like to see? (multi-select: Market News, Charts, Social, Fun)

On submission, preferences are `POST`-ed to `/api/onboarding`, saved in the `preferences` table, and `hasCompletedOnboarding` is set to `true`. The user is redirected to `/dashboard`.

### 3.2 Returning User

A returning user logs in at `/login`. The backend validates credentials, returns an access token, and the frontend checks `hasCompletedOnboarding`. If `true`, the user goes directly to `/dashboard`.

On the dashboard, four cards load in parallel (using TanStack Query). Each card shows its content or a graceful skeleton/error state independently — a failure in one section never blocks the others.

When the user clicks a thumbs-up or thumbs-down button, the UI updates optimistically (the button state changes immediately), and a `POST /api/feedback` request is made in the background. If the request fails, the UI reverts and shows a subtle toast notification.

### 3.3 Session Management

When the access token (15-minute TTL) expires, the Axios response interceptor silently calls `POST /api/auth/refresh` using the HttpOnly refresh token cookie. If the refresh token is also expired, the user is redirected to `/login`.

---

## 4. Tech Stack - Choices and Rationale

### 4.1 Frontend

**React 18 + TypeScript (via Vite)**  
React is specified by the assignment. Vite is chosen over Create React App due to its substantially faster dev server and build pipeline — meaningful when iterating quickly on a timed assessment. TypeScript strict mode is non-negotiable: it catches API shape mismatches (the most common integration bug in full-stack projects) at compile time rather than runtime.

**Tailwind CSS v3**  
Tailwind enforces design consistency through a centralized config token system. Unlike CSS Modules or styled-components, Tailwind co-locates style intent with markup without runtime overhead. The custom design system tokens (colors, fonts, spacing) live entirely in `tailwind.config.ts`, making global redesigns a one-file operation. There is no light mode — this is a crypto dashboard; dark mode is the only appropriate aesthetic.

**Zustand**  
Redux is overkill for this scope. Zustand provides a minimal, boilerplate-free global store for auth state (user, access token) and onboarding status. It integrates cleanly with TanStack Query for server state.

**TanStack Query (React Query)**  
Handles all server-state concerns on the dashboard: caching (prevents redundant API calls on tab refocus), background refetch, per-section loading and error states, and optimistic mutations for feedback voting. This keeps component code declarative and eliminates manual `useEffect` data-fetching patterns.

### 4.2 Backend

**Node.js 20 LTS + Express 4 + TypeScript**  
Node.js maintains language consistency across the full stack — TypeScript types for API DTOs can be referenced from a shared location by both frontend and backend. Express is chosen for its minimalism and near-universal familiarity; no magic, no conventions to fight when structuring a modular codebase. Fastify is a valid alternative for performance, but Express's ecosystem depth is more valuable here.

**Prisma ORM**  
Prisma's schema-first approach makes `schema.prisma` the single source of truth for the database structure. Auto-generated, type-safe query builders eliminate an entire category of runtime errors (wrong column names, missing null checks). Migrations are versioned and reproducible. The introspection tooling is also useful for giving the Moveo reviewer `Access to DB` as required by the deliverables.

**PostgreSQL via Supabase**  
PostgreSQL's relational model is a natural fit: users have one preferences record and many feedback records; referential integrity is enforced at the DB level. Supabase provides a free-tier hosted PostgreSQL instance, a visual database explorer (satisfies the "Access to DB" deliverable without a separate tool), and automatic SSL. SQLite was considered for simplicity but ruled out due to concurrency limitations in a deployed context.

### 4.3 Authentication

**JWT (Access + Refresh Token Pattern)**  
- Access tokens: short-lived (15 minutes), stored in memory (Zustand), sent as `Authorization: Bearer` header.
- Refresh tokens: long-lived (7 days), stored as `HttpOnly; Secure; SameSite=Strict` cookies, never accessible to JavaScript.
- This pattern prevents XSS-based token theft (no `localStorage`) while remaining stateless.
- Token rotation: each refresh call issues a new refresh token and invalidates the old one.

**bcrypt (cost factor 12)**  
Standard practice. The cost factor of 12 provides ~250ms hashing time, rendering brute-force attacks computationally infeasible while remaining acceptable for user-facing login latency.

---

## 5. Design System

| Token | Value | Usage |
|---|---|---|
| `void` | `#0D0F14` | Page background |
| `surface` | `#161B27` | Card backgrounds |
| `border` | `#1E2738` | Dividers, card borders |
| `primary` | `#3B82F6` | Brand accent, CTAs, links |
| `secondary` | `#8B5CF6` | AI/insight accent, badges |
| `success` | `#10B981` | Price up, thumbs up confirmed |
| `danger` | `#EF4444` | Price down, thumbs down, errors |
| `warning` | `#F59E0B` | Alerts, loading states |
| `text-primary` | `#F1F5F9` | Headings, primary content |
| `text-secondary` | `#94A3B8` | Labels, metadata, captions |
| **Display font** | Inter | All UI text |
| **Mono font** | JetBrains Mono | Prices, numbers, code snippets |

The visual signature is a subtle animated gradient border on active/hovered dashboard cards — a single accent that makes the dashboard feel alive without being distracting.

---

## 6. Project Constraints and Risk Mitigation

| Risk | Mitigation |
|---|---|
| CoinGecko rate limiting (free tier: ~10–30 req/min) | 60-second in-memory cache on the backend; static fallback JSON (`data/coin-fallback.json`) |
| CryptoPanic API returning slowly or being unavailable | 5-minute cache; static `data/news-fallback.json` with 10 pre-curated articles |
| OpenRouter LLM latency or quota exhaustion | 1-hour per-user insight cache in `dashboard_cache` table; hardcoded fallback insight for common investor types |
| Render free tier cold starts (~30s) | Health-check ping strategy; frontend shows a "Dashboard loading..." skeleton during initial connection |
| External media API downtime / Reddit scrape failures | Enforce primary meme delivery from localized static `data/memes.json` manifest |
| Session expiry mid-session | Axios interceptor silently refreshes token; user never sees an unexpected logout |

---

## 7. Deliverables Checklist

- [ ] **Public GitHub Repository** — `https://github.com/<username>/moveo-crypto-advisor`
- [ ] **Deployed App URL** — `https://moveo-crypto-advisor.vercel.app`
- [ ] **AI Interaction Log** — `logs/ai_interaction_log.md` (updated throughout development)
- [ ] **Database Access** — Supabase project shared with reviewer (or connection string in submission email)
- [ ] **Bonus: Training Pipeline Design** — Section 6 of `docs/specs_features.md`
