# AI Interaction Log — Moveo AI Crypto Advisor

> This file is a mandatory deliverable for the Moveo coding assessment.
> It documents every major architectural decision, feature implementation, bug fix,
> and AI-assisted action throughout the development of this project.
>
> **Format:** Append entries chronologically. Never edit past entries.
> **Maintained by:** The developer, logging incremental architectural evolution chronologically.

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

## [PROJECT INIT] — Initial Architecture and Documentation

**Type:** Architecture | Documentation  
**Files Affected:**
- `.cursorrules`
- `docs/architecture.md`
- `docs/overview.md`
- `docs/specs_features.md`
- `logs/ai_interaction_log.md`

**Decision / Action:**  
Generated the complete project documentation suite before writing a single line of application code. This follows the "documentation-first" approach where architecture decisions are explicit and written before implementation. The goal is to eliminate ambiguity, reduce context-switching costs during development, and ensure a rigid, transparent development baseline across all future engineering iterations.

Key architectural decisions made at this stage:

1. **Monorepo with `apps/frontend` and `apps/backend`** — keeps frontend and backend in one repository for simplified CI/CD and easier cross-referencing of shared types. Chose this over a polyrepo due to project scope (single developer, single deployment pipeline).

2. **PostgreSQL via Supabase over SQLite or MongoDB** — relational model is the correct choice here. Users have a one-to-one relationship with preferences, and a one-to-many relationship with feedback votes. Foreign key constraints matter. Supabase was chosen over raw PostgreSQL hosting because it provides a built-in GUI for the "Access to DB" deliverable requirement and has a reliable free tier.

3. **Prisma ORM over raw SQL or Knex** — auto-generated TypeScript types from the schema eliminate an entire class of runtime errors. The `schema.prisma` file becomes the single source of truth for DB structure, which is exactly what a team of reviewers needs when auditing the submission.

4. **TanStack Query over SWR or raw `useEffect`** — the dashboard requires four parallel, independent API calls, each with its own loading/error/stale state. TanStack Query's `useQuery` handles this precisely without custom orchestration. The built-in caching also prevents redundant API calls when the user navigates away and returns to the dashboard.

5. **JWT access + HttpOnly refresh cookie over pure localStorage JWT** — storing tokens in `localStorage` is a well-known XSS vulnerability. The access token in memory (Zustand) + refresh token in HttpOnly cookie is the production-standard pattern. Slightly more complex to implement (interceptor for auto-refresh), but non-negotiable for any auth implementation that will be reviewed by security-aware engineers.

6. **Fallback-first external API strategy** — CryptoPanic and CoinGecko have rate limits that will be hit during demo/review. Designing fallbacks as first-class features (not afterthoughts) prevents the dashboard from showing empty sections during the Moveo review session, which would be a poor impression regardless of code quality.

**Alternatives Considered:**

- *Next.js full-stack* instead of separate React + Express — rejected because the assignment explicitly says React/Angular for frontend and "any framework" for backend, implying they want to see a proper API layer, not server-side rendering. A Next.js API routes approach would obscure the backend architecture.
- *MongoDB* — rejected because the data model is fundamentally relational. Using a document DB for clearly relational data is a poor architectural choice that reviewers would notice.
- *Redux Toolkit* instead of Zustand — rejected due to boilerplate overhead. For an app with one user slice and one UI preferences slice, Redux is genuinely overengineered.

**Trade-offs:**  
- Supabase dependency means the DB is not self-hosted. For a production system, this is a vendor lock-in risk. For an assessment, the operational simplicity and reviewer accessibility outweigh the theoretical autonomy of self-hosting.
- Monorepo requires a workspace setup (npm workspaces or Turborepo). Adds ~30 minutes of initial setup but saves significantly on DX throughout development.

---