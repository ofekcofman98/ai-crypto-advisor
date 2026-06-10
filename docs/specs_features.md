# Feature Specifications — Moveo AI Crypto Advisor

> **Cross-reference:** Read `docs/architecture.md` first for repo structure and DB context.
> These specs act as our development blueprint. Every feature maps directly to a clean route and service handler.

---

## Table of Contents

1. [Auth Spec — Registration & Login](#1-auth-spec--registration--login)
2. [Onboarding Spec — Preference Capture](#2-onboarding-spec--preference-capture)
3. [Dashboard Spec — Four Dynamic Sections](#3-dashboard-spec--four-dynamic-sections)
   - 3.1 [Market News](#31-market-news)
   - 3.2 [Coin Prices](#32-coin-prices)
   - 3.3 [AI Insight of the Day](#33-ai-insight-of-the-day)
   - 3.4 [Fun Crypto Meme](#34-fun-crypto-meme)
   - 3.5 [Rate Limiting and Fallback Architecture](#35-rate-limiting-and-fallback-architecture)
4. [Feedback Spec — Voting System](#4-feedback-spec--voting-system)
5. [API Contract Reference](#5-api-contract-reference)
6. [Bonus Spec — Feedback-Driven Training Pipeline](#6-bonus-spec--feedback-driven-training-pipeline)

---

## 1. Auth Spec — Registration & Login

### 1.1 Scope
Standard, secure JWT authentication. The server issues a token valid for 24 hours directly in the JSON response payload upon successful registration or login. The client stores this token in local memory (Zustand store) and attaches it as a Bearer token in the `Authorization` header for protected requests.

### 1.2 Registration

**Endpoint:** `POST /api/auth/register`

**Process:**
1. Read `email`, `name`, and `password` from the request body. Return a `400 Bad Request` if any field is missing.
2. Check the `users` table for an existing email. Return `400 Bad Request` if found (with an explicit email exists message).
3. Hash the plain-text password using `bcryptjs` with a cost factor of 10.
4. Insert a new row into the `users` table, and atomically create an associated empty default row in the `preferences` table.
5. Generate a JWT token containing the new user's ID (`userId`), set to expire in 24 hours.
6. Return `201 Created` with the token and the safe user profile (`hasCompletedOnboarding: false`).

---

### 1.3 Login

**Endpoint:** `POST /api/auth/login`

**Process:**
1. Read `email` and `password` from the request body.
2. Find the user record by email. If not found, return `400 Bad Request` with a generic "Invalid email or password" message to prevent credential enumeration.
3. Compare the provided password with the stored password hash using `bcrypt.compare`. If they do not match, return the same generic `400` error.
4. Retrieve the user's `hasCompletedOnboarding` status.
5. Generate a new 24-hour JWT token.
6. Return `200 OK` with the token and user profile.

---


## 2. Onboarding Spec — Preference Capture

### 2.1 Scope
A simple onboarding questionnaire presented to users immediately after their first login if `hasCompletedOnboarding` is `false`.

### 2.2 Backend Endpoint

**Endpoint:** `POST /api/auth/preferences`  
**Auth:** Required (JWT validated via custom middleware)

**Request Body:**
```typescript
interface OnboardingDTO {
  cryptoAssets: string[];   // e.g., ['BTC', 'ETH']
  investorType: string;     // e.g., 'HODLER' or 'DAY_TRADER'
  contentTypes: string[];   // e.g., ['MARKET_NEWS', 'CHARTS']
}
```

**Process:**

Verify the request's JWT token. Extract the userId.

Update the user's row in the preferences table with the chosen options.

Update the user's row in the users table setting hasCompletedOnboarding = true.

Return 200 OK with a success message.

---

## 3. Dashboard Spec — Four Dynamic Sections

The dashboard displays four parallel, decoupled cards. On the frontend, each section fetches its data independently via separate API endpoints using TanStack Query.

## 3.1 Market News (GET /api/dashboard/news)

* Reads user preferences and fetches relevant crypto headlines from the CryptoPanic API.

* Fallback: If the API fails or is rate-limited, loads a static array from data/news-fallback.json.

## 3.2 Coin Prices (GET /api/dashboard/prices)
* Fetches live market data from the CoinGecko API for the user's selected assets.

* Fallback: If the API fails, returns static values from data/coin-fallback.json.

## 3.3 AI Insight of the Day (GET /api/dashboard/insight)
* Constructs a tailored prompt containing the user's investor type and asset choices, then calls the OpenRouter API (Mistral-7B).

* Caches generated insights on the backend database for 1 hour to manage rate limits.

* Fallback: Returns a pre-curated insight matching the user's investor profile from data/insight-fallback.json.

## 3.4 Fun Crypto Meme (GET /api/dashboard/meme)
* Randomly selects a meme container object from a localized, static data/memes.json repository. No external network request required.

---

### 3.5 Rate Limiting and Fallback Architecture

The backend uses a layered caching and fallback strategy to ensure the dashboard always renders:

```
Request arrives
  │
  ├─► Is valid in-memory cache?          YES → return cache immediately
  │
  ├─► Call external API
  │     ├─► Success                      → update cache, return fresh data
  │     └─► Failure (timeout / 4xx/5xx)
  │           ├─► Is stale cache available?  YES → return stale + { stale: true }
  │           └─► No cache               → return static fallback JSON + { fallback: true }
  │
```

**Dashboard-level independence:** Each of the four sections is fetched by a separate endpoint. On the frontend, each section is a separate TanStack Query query. A failure in one section renders that section's error/fallback UI while the other three sections continue rendering normally.

**No dashboard-level loading state:** The page shell renders immediately. Each card independently transitions through `loading → loaded | error` states.

---

## 4. Feedback Spec — Voting System

### 4.1 Scope

Allows persistent, per-item voting (Thumbs Up / Thumbs Down) across all dashboard cards.

### 4.2 Endpoint (POST /api/feedback)
* Request Body: Contains sectionType (NEWS, PRICE, AI_INSIGHT, MEME), contentId, and the vote ('UP' or 'DOWN').

* Process: Upserts the choice into the feedback table based on a unique combination of (userId, sectionType, contentId). The last submitted vote overwrite any previous selection.


---

## 5. API Contract Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Register new user |
| `POST` | `/api/auth/login` | No | Login, get tokens |
| `POST` | `/api/auth/refresh` | Cookie | Refresh access token |
| `DELETE` | `/api/auth/logout` | Cookie | Revoke refresh token |
| `POST` | `/api/onboarding` | JWT | Save user preferences |
| `GET` | `/api/onboarding` | JWT | Get current preferences |
| `GET` | `/api/dashboard/news` | JWT | Market news section |
| `GET` | `/api/dashboard/prices` | JWT | Coin prices section |
| `GET` | `/api/dashboard/insight` | JWT | AI insight section |
| `GET` | `/api/dashboard/meme` | JWT | Meme section |
| `POST` | `/api/feedback` | JWT | Submit a vote |
| `GET` | `/api/feedback/my-votes` | JWT | Get user's vote history |
| `GET` | `/api/health` | No | Deployment health check |

**Standard error response shape:**
```typescript
interface ErrorResponseDTO {
  status: 'error';
  message: string;
  errors?: Record<string, string>; // Field-level validation errors (Zod)
}
```

---

## 6. Bonus Spec — Feedback-Driven Training Pipeline

Theoretical write-up responding to the assignment's bonus question. No coding implementation required.

6.1 Data Collection Pipeline
Every row in the feedback table stores an explicit signal: the user ID, the specific content block, a snippet of the generated text, and a vote status (UP or DOWN).

6.2 Short-Term Improvement: Few-Shot Prompt Refinement
A simple automated script or database routine aggregates highly-rated insights belonging to specific investor archetypes (e.g., what items do "HODLers" consistently upvote?).

When building future LLM prompt queries, the system injects these real-world examples directly into the prompt context wrapper:

"Here are examples of market summaries users with this investment profile previously upvoted:
 - [Upvoted Example 1]
 - [Upvoted Example 2]
Please generate today's insight using a similar tone and depth."
This strategy relies entirely on in-context learning, delivering immediate content calibration without needing to execute costly model fine-tuning or weight training pipelines.