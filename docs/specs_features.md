# Feature Specifications — Moveo AI Crypto Advisor

> **Cross-reference:** Read `docs/architecture.md` first for repo structure and DB schema context.
> These specs are the implementation contract. Every piece of code should map to a spec item here.

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

Stateless JWT authentication with short-lived access tokens and rotating refresh tokens stored in HttpOnly cookies.

### 1.2 Registration

**Endpoint:** `POST /api/auth/register`

**Request Body (validated by Zod):**
```typescript
interface RegisterDTO {
  email: string;    // valid email format, lowercase-normalized
  name: string;     // 2–50 chars, trimmed
  password: string; // min 8 chars, at least 1 uppercase, 1 number
}
```

**Process:**
1. Validate body with Zod schema. Return `400` with field-level errors on failure.
2. Check `users` table for existing email. Return `409 Conflict` if found.
3. Hash password: `bcrypt.hash(password, 12)`.
4. Insert new `users` row: `{ email, name, passwordHash }`.
5. Insert new `preferences` row with empty defaults for this `userId`.
6. Generate access token (JWT, `userId` + `email` payload, 15m TTL).
7. Generate refresh token (JWT, `userId` payload, 7d TTL). Hash it with `bcrypt`, store hash in `refresh_tokens` table.
8. Set refresh token as `HttpOnly; Secure; SameSite=Strict` cookie.
9. Return `201` with `{ accessToken, user: { id, email, name, hasCompletedOnboarding: false } }`.

**Error Responses:**
| Code | Condition |
|---|---|
| `400` | Validation failure (with Zod error details) |
| `409` | Email already registered |
| `500` | DB or hashing failure |

### 1.3 Login

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```typescript
interface LoginDTO {
  email: string;
  password: string;
}
```

**Process:**
1. Validate with Zod.
2. Find user by email. If not found, return `401` (do not reveal whether email exists — generic message).
3. `bcrypt.compare(password, user.passwordHash)`. If false, return `401`.
4. Check `preferences` table for this `userId` to determine `hasCompletedOnboarding`.
5. Generate new access + refresh tokens (same flow as registration steps 6–8).
6. Return `200` with `{ accessToken, user: { id, email, name, hasCompletedOnboarding } }`.

### 1.4 Token Refresh

**Endpoint:** `POST /api/auth/refresh`

**Process:**
1. Read refresh token from `HttpOnly` cookie.
2. Verify JWT signature. Return `401` if invalid or expired.
3. Look up token hash in `refresh_tokens`. Return `401` if not found or `revokedAt IS NOT NULL`.
4. Revoke old token (set `revokedAt = now()`).
5. Issue new access token + new refresh token (rotation).
6. Return `200` with `{ accessToken }`.

### 1.5 Logout

**Endpoint:** `DELETE /api/auth/logout`

**Process:**
1. Read refresh token from cookie.
2. Revoke it in DB.
3. Clear the cookie.
4. Return `204 No Content`.

### 1.6 Auth Middleware

```typescript
// middleware/auth.middleware.ts
// Extracts `Authorization: Bearer <token>`, verifies JWT,
// attaches `req.user: { id, email }` to the request.
// Returns 401 if missing or invalid.
```

All protected routes must use this middleware. It is **not** optional.

### 1.7 Frontend — Auth Store (Zustand)

```typescript
interface AuthStore {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginDTO) => Promise<void>;
  register: (data: RegisterDTO) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}
```

The Axios instance has two interceptors:
1. **Request interceptor:** Injects `Authorization: Bearer <accessToken>` header.
2. **Response interceptor:** On `401`, calls `refreshToken()` once, retries original request. If refresh also fails, calls `logout()` and redirects to `/login`.

---

## 2. Onboarding Spec — Preference Capture

### 2.1 Scope

A three-step wizard shown exactly once — after first login. Captures and persists user preferences that personalize all dashboard content.

### 2.2 Questions & Options

| Step | Question | Input Type | Options |
|---|---|---|---|
| 1 | Which crypto assets interest you? | Multi-select chips | BTC, ETH, SOL, BNB, ADA, DOGE, MATIC, AVAX, LINK, UNI |
| 2 | What type of investor are you? | Single-select radio cards | HODLer, Day Trader, NFT Collector, DeFi Explorer |
| 3 | What content do you want? | Multi-select chips | Market News, Charts & Prices, Social Buzz, Fun Content |

**Validation:**
- Step 1: Min 1 asset required.
- Step 2: Exactly 1 type required.
- Step 3: Min 1 content type required.

### 2.3 Backend Endpoint

**Endpoint:** `POST /api/onboarding`  
**Auth:** Required (authMiddleware)

**Request Body:**
```typescript
interface OnboardingDTO {
  cryptoAssets: CryptoAsset[];   // e.g. ['BTC', 'ETH']
  investorType: InvestorType;    // 'HODLER' | 'DAY_TRADER' | 'NFT_COLLECTOR' | 'DEFI_EXPLORER'
  contentTypes: ContentType[];   // e.g. ['MARKET_NEWS', 'CHARTS']
}
```

**Process:**
1. Validate with Zod. All fields required; arrays must be non-empty.
2. Upsert `preferences` row for `req.user.id`.
3. Update `users.hasCompletedOnboarding = true`.
4. Return `200` with the saved `preferences` object.

### 2.4 Frontend — Onboarding Flow

- Route guard: if `hasCompletedOnboarding === false`, redirect to `/onboarding` after any login.
- Three-step wizard with a progress indicator (Step 1 of 3).
- Each step validates before allowing "Next."
- Final step shows a "Launch Dashboard" button that triggers the API call.
- On success: update Zustand `user.hasCompletedOnboarding = true`, redirect to `/dashboard`.
- On failure: show inline error, do not redirect.

### 2.5 Re-access

Users who have completed onboarding are blocked from `/onboarding` by the route guard (redirected to `/dashboard`). A future "Settings" page can expose preference editing via `PATCH /api/onboarding`.

---

## 3. Dashboard Spec — Four Dynamic Sections

### 3.1 Market News

**Data source:** CryptoPanic API  
**Endpoint (backend):** `GET /api/dashboard/news`  
**Auth:** Required

**Backend process:**
1. Read user `preferences.cryptoAssets` and `preferences.contentTypes`.
2. If `MARKET_NEWS` is not in `contentTypes`, return empty array (section will be hidden or show "not selected" state).
3. Call CryptoPanic: `GET https://cryptopanic.com/api/v1/posts/?auth_token=<KEY>&currencies=<BTC,ETH,...>&kind=news`.
4. Transform response to `NewsItemDTO[]`:
```typescript
interface NewsItemDTO {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string; // ISO 8601
  sentiment: 'positive' | 'negative' | 'neutral';
}
```
5. Return top 5 items.
6. Cache in-memory for 5 minutes (use a simple `Map<cacheKey, { data, expiresAt }>` in the news lib client).

**Fallback trigger:** CryptoPanic returns non-200, times out (>5s), or is rate-limited (429).  
**Fallback behavior:** Load `data/news-fallback.json` — a static array of 10 pre-written news items. Log the fallback activation to Pino.

**Frontend:**
- Renders a `NewsCard` component inside a `DashboardSection` wrapper.
- Each item shows title, source, relative timestamp ("2h ago"), and a sentiment badge.
- Section header shows "Market News" + a live/cached indicator dot.
- Vote buttons (👍 / 👎) below each item's title.

---

### 3.2 Coin Prices

**Data source:** CoinGecko API  
**Endpoint (backend):** `GET /api/dashboard/prices`  
**Auth:** Required

**Backend process:**
1. Read `preferences.cryptoAssets` for the user.
2. Map asset symbols to CoinGecko IDs (a static map in `lib/coinGecko.ts`, e.g. `BTC → bitcoin`).
3. Call: `GET https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,...&vs_currencies=usd&include_24hr_change=true`.
4. Transform to `CoinPriceDTO[]`:
```typescript
interface CoinPriceDTO {
  id: string;         // 'bitcoin'
  symbol: string;     // 'BTC'
  name: string;       // 'Bitcoin'
  price: number;      // USD
  change24h: number;  // percent, can be negative
}
```
5. Cache in-memory for 60 seconds.

**Fallback trigger:** Non-200 response or timeout.  
**Fallback behavior:** Return the most recent cached data if available (stale-while-error); if no cache exists, return static `data/coin-fallback.json` with zeroed change values and a `stale: true` flag.

**Frontend:**
- Renders a `CoinPriceCard` per asset in a responsive grid (2-up on desktop).
- Price formatted with `Intl.NumberFormat` (USD, 2 decimal places).
- `change24h` colored green (`text-success`) if positive, red (`text-danger`) if negative.
- Price value rendered in `font-mono` (JetBrains Mono).
- Vote buttons below each coin card.

---

### 3.3 AI Insight of the Day

**Data source:** OpenRouter API (LLM inference)  
**Endpoint (backend):** `GET /api/dashboard/insight`  
**Auth:** Required

**Backend process:**
1. Check `dashboard_cache` for an unexpired entry: `WHERE userId = ? AND cacheKey = 'ai_insight' AND expiresAt > NOW()`.
2. If cache hit: return cached insight immediately (no LLM call).
3. If cache miss: build a personalized prompt:
```
You are a concise crypto market analyst. The user is a {investorType} 
interested in {cryptoAssets}. In 2-3 sentences, give a sharp, 
actionable market insight for today. Do not give financial advice.
Be specific and data-informed. Avoid generic platitudes.
```
4. Call OpenRouter: `POST https://openrouter.ai/api/v1/chat/completions` with `model: "mistralai/mistral-7b-instruct"` (free tier).
5. Extract text from `response.choices[0].message.content`.
6. Save to `dashboard_cache` with `expiresAt = NOW() + 1 hour`.
7. Return `{ insight: string, generatedAt: string, cached: boolean }`.

**Fallback trigger:** OpenRouter non-200, quota exhaustion, or >8s timeout.  
**Fallback behavior:** Load a hardcoded insight from `data/insight-fallback.json`, keyed by `investorType`:
```json
{
  "HODLER": "Long-term fundamentals remain strong. Dollar-cost averaging continues to be a proven strategy for volatile periods.",
  "DAY_TRADER": "Monitor key support and resistance levels closely today. Volume patterns will indicate the next directional move.",
  ...
}
```

**Frontend:**
- Renders an `AIInsightCard` with a purple/secondary accent (`border-secondary/40`).
- Shows a typewriter-style animation for the insight text on first load (CSS animation, no JS library).
- Displays "Generated by AI · Updated hourly" footer.
- A single vote pair (👍 / 👎) for the entire insight, not per sentence.

---

### 3.4 Fun Crypto Meme

**Data source:** Local static curated JSON repository
**Endpoint (backend):** `GET /api/dashboard/meme`  
**Auth:** Required

**Backend process:**
1. Read the localized `data/memes.json` resource manifest.
2. Randomly select one entry per request (do not seed by user ID — pure random).
3. Return `MemeDTO`:
```typescript
interface MemeDTO {
  id: string;
  imageUrl: string;
  caption: string;
  source: string;
}
```
4. No caching needed — random selection is the desired behavior.

**Fallback:** `memes.json` is bundled in the repo — it always exists. No network dependency. No fallback needed.

**Frontend:**
- Renders a `MemeCard` with the image, caption below, and a "source" label.
- Image loads lazily (`loading="lazy"`).
- A "Refresh Meme 🔄" button calls the endpoint again (via React Query's `refetch()`).
- Vote buttons (👍 / 👎) below the meme.

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

Persistent, per-section, per-content-item voting. Optimistic UI — no page reload. One vote per user per content item (last vote wins, not cumulative).

### 4.2 Backend Endpoint

**Endpoint:** `POST /api/feedback`  
**Auth:** Required

**Request Body:**
```typescript
interface FeedbackDTO {
  sectionType: 'NEWS' | 'PRICE' | 'AI_INSIGHT' | 'MEME';
  contentId: string;      // Article URL hash, coin id, cache id, meme id
  contentSnippet: string; // Title / coin name / first 100 chars of insight
  vote: 'UP' | 'DOWN';
}
```

**Process:**
1. Validate with Zod.
2. Upsert into `feedback` table: unique on `(userId, sectionType, contentId)`. If row exists, update `vote` and `createdAt`.
3. Return `201` with the saved feedback row.

**Note on upsert:** We want the last vote, not a history of all votes. This is intentional — it mirrors how content recommendation systems work (your current preference, not a cumulative score).

### 4.3 Frontend — Vote Component

```typescript
interface VoteButtonsProps {
  sectionType: FeedbackDTO['sectionType'];
  contentId: string;
  contentSnippet: string;
}
```

**Behavior:**
1. User clicks 👍 or 👎.
2. Local state updates immediately (optimistic): the clicked button highlights, the other dims.
3. `POST /api/feedback` fires in background.
4. On success: no UI change needed (already updated).
5. On failure: revert local state to pre-click state + show a 3-second toast: "Vote could not be saved. Try again."

**Previously voted state:**
- On dashboard load, fetch `GET /api/feedback/my-votes` to retrieve all votes for the current user.
- Pre-populate vote button states so returning users see their previous votes.

### 4.4 Feedback Retrieval (for pre-population)

**Endpoint:** `GET /api/feedback/my-votes`  
**Auth:** Required

**Response:**
```typescript
interface MyVotesResponseDTO {
  votes: {
    sectionType: string;
    contentId: string;
    vote: 'UP' | 'DOWN';
  }[];
}
```

Frontend transforms this into a `Map<contentId, 'UP' | 'DOWN'>` for O(1) vote-state lookups.

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

> **This section is theoretical.** No implementation is required. It answers the assignment's bonus question: how does the feedback data stored in the DB feed into future model improvements?

### 6.1 What We're Collecting and Why

Every row in the `feedback` table contains:
- `userId` — enables personalization (individual user preferences)
- `sectionType` — identifies which type of content (news vs. price vs. AI insight vs. meme)
- `contentId` — identifies the specific item
- `contentSnippet` — the first 100 characters of the actual content shown to the user
- `vote` — `UP` or `DOWN`
- `createdAt` — temporal signal (preferences change over time)

This schema is intentionally designed to support **two improvement pathways**: prompt refinement (short-term, no training required) and fine-tuning (long-term, requires labeled dataset).

---

### 6.2 Pathway 1 — Few-Shot Prompt Refinement (Short-Term, Low Cost)

**Concept:** Use the `feedback` table to dynamically improve the AI Insight prompt by including examples of what a specific user (or their investor archetype cohort) has rated positively in the past.

**Pipeline:**

```
Nightly batch job (cron):
  1. Query feedback table:
     SELECT contentSnippet, vote
     FROM feedback
     WHERE sectionType = 'AI_INSIGHT'
       AND userId = <userId>
       AND createdAt > NOW() - INTERVAL '30 days'
     ORDER BY createdAt DESC
     LIMIT 10

  2. Split into positives (vote = 'UP') and negatives (vote = 'DOWN')

  3. Build dynamic few-shot prompt prefix:
     "Examples of insights this user found valuable:
      - [positive_snippet_1]
      - [positive_snippet_2]
      Examples of insights this user rated as unhelpful:
      - [negative_snippet_1]
      Now generate today's insight."

  4. Store this user-specific prompt prefix in dashboard_cache
     with key 'ai_insight_prompt_prefix' and TTL of 24h

  5. Insight generation reads this prefix before constructing the full prompt
```

**Benefit:** Zero model retraining. Meaningfully personalizes outputs using actual preference signals. Implementable in a weekend.

**Limitation:** Relies on the base LLM's in-context learning. Works best when few-shot examples are semantically consistent.

---

### 6.3 Pathway 2 — Preference-Weighted Content Filtering (News & Memes)

**Concept:** For the News and Meme sections, use aggregate `UP`/`DOWN` vote ratios to build a content scoring model. Content items similar to highly-voted items are ranked higher.

**Pipeline:**

```
Nightly batch job:
  1. For each content type (NEWS, MEME), compute:
     score = (upvotes - downvotes) / total_votes  [Wilson score lower bound preferred]

  2. For NEWS: cluster articles by keyword (TF-IDF on contentSnippet)
     High-scoring clusters → keywords to prioritize in CryptoPanic query filters

  3. For MEMES: tag memes with topics (bitcoin, bear market, to-the-moon, etc.)
     High-scoring tags → weight random selection toward preferred tags

  4. Write scoring output to a `content_scores` table:
     { contentType, keyword/tag, score, computedAt }

  5. Dashboard service reads these scores to bias content selection
```

---

### 6.4 Pathway 3 — Fine-Tuning Dataset Generation (Long-Term)

Once the application accumulates sufficient votes (target: 500+ `AI_INSIGHT` votes per user cohort), the `feedback` table can be used to generate a **supervised fine-tuning (SFT) dataset**:

**Schema of generated training pairs:**
```jsonl
{
  "prompt": "User is a HODLer interested in BTC, ETH. Generate a market insight.",
  "completion": "<contentSnippet of UP-voted insight>",
  "label": "positive"
}
{
  "prompt": "User is a HODLer interested in BTC, ETH. Generate a market insight.",
  "completion": "<contentSnippet of DOWN-voted insight>",
  "label": "negative"
}
```

These pairs can be used for:
- **Reinforcement Learning from Human Feedback (RLHF):** Training a reward model that predicts vote outcome, then using PPO/DPO to fine-tune the LLM toward higher-scoring outputs.
- **Direct Preference Optimization (DPO):** Pairing positive and negative completions for the same prompt and fine-tuning with the DPO loss directly.

**Infrastructure required (not implemented here):**
- A data export pipeline from PostgreSQL → S3 or Hugging Face Dataset
- A compute environment for fine-tuning (Hugging Face Accelerate + LoRA for parameter-efficient fine-tuning on the Mistral-7B base model)
- An evaluation harness that measures improvement on a held-out feedback validation set before deploying the new model version

---

### 6.5 DB Schema for Feedback Pipeline

The current `feedback` table is already pipeline-ready. The following additional table enables the nightly batch job to be incremental rather than full-scan:

```sql
-- Tracks which feedback rows have been processed by the training pipeline
CREATE TABLE feedback_pipeline_checkpoints (
  id           SERIAL PRIMARY KEY,
  pipeline_type VARCHAR(50) NOT NULL,  -- 'prompt_refinement' | 'content_scoring' | 'sft_export'
  last_processed_feedback_id INTEGER NOT NULL,
  processed_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
```

This ensures the nightly job only processes new feedback rows since the last run, making it O(new rows) rather than O(all rows) as the dataset grows.

---

### 6.6 Summary of Training Architecture

```
Users vote on dashboard content
         │
         ▼
  feedback table (PostgreSQL)
         │
   ┌─────┼─────────────────────────────────────────┐
   │     │                                         │
   ▼     ▼                                         ▼
Few-Shot   Content Scoring               SFT Dataset Export
Prompt     (News pipeline ranking)       (after 500+ votes)
Prefix     Nightly cron → DB             → Hugging Face /
Nightly    content_scores table            S3 JSONL file
cron →                                      │
dashboard_cache                             ▼
prompt_prefix                       Fine-tune Mistral-7B
                                    with LoRA + DPO
                                           │
                                           ▼
                                   New model version deployed
                                   to OpenRouter / self-hosted
```
