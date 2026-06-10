# Project Overview — Moveo AI Crypto Advisor

A full-stack Crypto Advisor web application designed for the Moveo coding assessment. The platform onboard users, aggregates real-time cryptocurrency data and market news, and leverages an LLM (AI) to generate personalized trading insights.


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

**Goal:** Build a functional, personalized crypto investor dashboard web application.

The product consists of three phases:
1. **Authentication** — Users register with email, name, and password. Login is based on a standard, secure JWT token returned directly in the response.
2. **Onboarding** — A first-login quiz that captures the user's crypto interests, investor archetype, and preferred content types. Answers persist directly to the database as user preferences.
3. **Dashboard** — A preference-driven dashboard composed of four content sections: Market News, Live Coin Prices, an AI-generated Insight of the Day, and a Fun Crypto Meme. Each section can be upvoted or downvoted.


The application must be deployed and publicly accessible. The GitHub repository and database access must also be submitted as part of the assessment deliverables.

**Bonus requirement:** A theoretical write-up on how the feedback voting data would feed into a future model retraining / prompt-engineering pipeline.

---

## 2. Core Features at a Glance

| # | Feature | Scope |
|---|---|---|
| 1 | User Registration & Login | Standard JWT authentication, bcrypt password hashing |
| 2 | Onboarding Quiz | 3-question preference capture, saved to DB |
| 3 | Market News Section | CryptoPanic API with static-JSON fallback, filtered by user interests |
| 4 | Coin Prices Section | CoinGecko API, live prices for user's chosen assets |
| 5 | AI Insight of the Day | OpenRouter (LLM) prompt personalized to user's investor type and assets |
| 6 | Fun Crypto Meme | Randomized delivery pipeline via curated static JSON |
| 7 | Feedback Voting | Per-section thumbs-up/down, persisted to DB |
| 8 | AI Interaction Log | Mandatory documentation of all AI-assisted decisions (`logs/ai_interaction_log.md`) |
| 9 | (Bonus) Training Pipeline Design | Written spec: how feedback data feeds into prompt refinement and future fine-tuning |

---

## 3. User Flow Narrative

### 3.1 New User

A user registers at `/register`. After submitting a valid email, display name, and password, a JWT token is issued and stored securely on the client side.

Because this is their first login, `hasCompletedOnboarding` is set to `false`, and the user is redirected to `/onboarding`.

The onboarding quiz captures:
* **Crypto assets** (e.g., BTC, ETH, SOL)
* **Investor type** (e.g., HODLer, Day Trader)
* **Content preferences** (e.g., Market News, Charts)

On submission, preferences are saved to the database, `hasCompletedOnboarding` becomes `true`, and the user is sent to the dashboard.

### 3.2 Returning User

A returning user logs in at `/login`. The backend validates credentials, returns an access token, and the frontend checks `hasCompletedOnboarding`. If `true`, the user goes directly to `/dashboard`.

On the dashboard, four cards load in parallel (using TanStack Query). Each card shows its content or a graceful skeleton/error state independently — a failure in one section never blocks the others.

When the user clicks a thumbs-up or thumbs-down button, the UI updates optimistically (the button state changes immediately), and a `POST /api/feedback` request is made in the background. If the request fails, the UI reverts and shows a subtle toast notification.

### 3.3 Session Management

When the access token (15-minute TTL) expires, the Axios response interceptor silently calls `POST /api/auth/refresh` using the HttpOnly refresh token cookie. If the refresh token is also expired, the user is redirected to `/login`.

---

## 4. Tech Stack - Choices and Rationale

* **Frontend:** React (Vite), TypeScript, Tailwind CSS, Zustand (State Management), TanStack Query.
* **Backend:** Node.js, Express, TypeScript, Prisma ORM.
* **Database:** PostgreSQL hosted on Supabase.
* **Authentication:** Standard JWT token expiration pattern. Passwords are encrypted safely using `bcryptjs`.

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
| External media API downtime | Enforce primary meme delivery from localized static `data/memes.json` manifest |
| Token Expiration mid-session | Handled gracefully by redirecting the user back to `/login` upon receiving a 401 response |


---

## 7. Deliverables Checklist

- [ ] **Public GitHub Repository** — `https://github.com/<username>/moveo-crypto-advisor`
- [ ] **Deployed App URL** — `https://moveo-crypto-advisor.vercel.app`
- [ ] **AI Interaction Log** — `logs/ai_interaction_log.md` (updated throughout development)
- [ ] **Database Access** — Supabase project shared with reviewer (or connection string in submission email)
- [ ] **Bonus: Training