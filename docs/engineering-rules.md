# Stony Brook SHPE — Engineering Rules

**The single source of truth for how code gets planned, written, reviewed, and shipped.**
This is the engineering counterpart to [`ui-ux-rules.md`](ui-ux-rules.md) (which owns everything
visual). Every change — to the current static site or the upcoming backend — follows these rules.
If a rule and reality disagree, fix one of them in the same PR; never let them drift silently.

**Why these rules exist:** this codebase changes hands every academic year. Optimize for the
next e-board member who has never seen it. Boring, obvious, documented code beats clever code,
every time.

---

## 0. Golden rules

The non-negotiables. Everything else in this document elaborates on these.

1. **Plan before code.** No implementation starts without an approved written plan (§1).
2. **Reuse before build.** Search for an existing component, function, or pattern first;
   extend it before creating a sibling.
3. **Boring beats clever.** Choose the well-documented, mainstream solution. If a line of code
   needs a comment to explain *what* it does, rewrite the line.
4. **Every input is hostile until validated** — on the server. Client-side validation is UX,
   not security.
5. **Access control lives on the server.** CSS locks (`.portal-lock`), hidden buttons, and
   disabled links are presentation only. The server enforces who can see and do what.
6. **No secrets in the repo, ever.** The only sanctioned committed key is a
   referrer-restricted public API key (§3.4).
7. **Errors are handled or surfaced, never swallowed.** Every `fetch`, query, and file
   operation has an explicit failure path.
8. **Member data is sensitive.** Collect the minimum, never log PII, and make deletion possible (§7.3).
9. **Leave it cleaner than you found it.** Delete dead code in files you touch; never add to
   deprecated files (ui-ux-rules §1.2).
10. **If it isn't verified, it isn't done.** Every PR states how the change was tested (§9).

---

## 1. Process: plan → implement → verify

### 1.1 The plan comes first

Every non-trivial task (anything touching more than one file, any new feature, any backend
work) starts with a short written plan, agreed on **before** any code is written:

```
Goal          — one sentence: what will be true when this is done
Changes       — the files that will be created/edited and what happens in each
Out of scope  — what this deliberately does NOT do
Risks         — what could break, what's uncertain, any data/auth implications
Verification  — exactly how we'll confirm it works (commands, pages, breakpoints, tests)
```

Trivial fixes (typo, one-line style tweak) may skip the plan but not the verification.

### 1.2 Scope discipline

- Implement what the plan says. Nothing more.
- Work discovered mid-implementation (a bug, a refactor itch, a missing feature) gets **noted
  and raised**, not silently folded in. It becomes its own plan and its own PR.
- If the plan turns out to be wrong mid-flight, stop and revise the plan — don't improvise.

### 1.3 Definition of done

A change is done when **all** of these hold:

- [ ] Matches the approved plan (or the plan was explicitly revised)
- [ ] Verified per the plan's verification section, and the result is stated in the PR
- [ ] No new warnings/errors in the browser console or server logs
- [ ] Docs updated in the same PR (`docs/`, and this file or `ui-ux-rules.md` if a convention changed)
- [ ] Cross-page duplication honored: nav/footer edits applied to **every** root `*.html`
- [ ] Nothing secret, generated, or dead was committed

---

## 2. Code quality (all languages)

### 2.1 Naming

- Names say what a thing **is** or **does**, in full words: `loadUpcomingEvents`, not `loadEvts`.
- Booleans read as predicates: `isOpen`, `hasResume`, `canDownload`.
- Functions are verbs, values are nouns, collections are plural (`members`, not `memberList`).
- One name per concept across the whole stack. If the DB says `grad_year`, the API says
  `gradYear` and the UI says grad year — never a third synonym like `classOf`.
- Files: kebab-case (`events-sync.js`, `resume-routes.ts`), matching the existing repo.

### 2.2 Functions and files

- One job per function. If you describe it with "and", split it.
- Guard clauses and early returns over nested conditionals — bail out at the top
  (the `if (!toggle || !links) return` pattern in `shpe.js` is the house style).
- Guidelines, not dogma: functions under ~40 lines, files under ~400. Crossing the line is a
  prompt to consider splitting, not a build failure.
- No magic values. Numbers and strings with meaning get a named constant
  (`const MAX_RESUME_BYTES = 5 * 1024 * 1024`), mirroring how CSS uses tokens.

### 2.3 Comments

- Comments explain **why**, never what: constraints, gotchas, links to decisions.
  If the *what* needs explaining, rewrite the code.
- No commented-out code in commits. The one sanctioned pattern is deliberately preserved
  markup (like the sponsor tier grid) — and only when a doc in `docs/` explains why it's
  there and when it comes back.
- `TODO`s must name an owner or an issue. Anonymous TODOs are deleted.

### 2.4 Duplication

- Rule of three: tolerate two copies; on the third, extract.
- Known deliberate exception: nav and footer are duplicated across every root page by design.
  The price is the update-every-page rule (§1.3). Don't add new deliberate duplication
  without documenting it the same way.

### 2.5 Dependencies

- **Frontend:** vanilla only, no build step. The sole sanctioned runtime dependency is
  EmailJS (see ui-ux-rules §1.1). This rule stands until a plan explicitly retires it.
- **Backend:** every dependency is a liability the next e-board inherits. Before adding one:
  prefer the standard library, prefer something already in the project, and be able to say in
  the PR what it does and why hand-rolling is worse. Pin every direct dependency to an
  exact version in a committed requirements/manifest file. Where the package manager
  maintains a full-tree lockfile itself (npm, uv), commit that too. Where it does not —
  plain pip, our case — a hand-run `pip freeze` dump goes stale without anyone noticing,
  so we deliberately keep none; see
  [decisions/001-backend-stack.md](decisions/001-backend-stack.md).
- Never depend on an unmaintained package for anything security-adjacent (auth, uploads,
  sessions).

### 2.6 Async and time

- No floating promises: every promise is `await`ed, returned, or explicitly handled.
- Errors from async work propagate to a boundary that handles them (§8) — never
  `catch {}` to silence.
- Timestamps are stored and transmitted as ISO-8601 UTC. Formatting to America/New_York
  happens only at the display edge (the events code already does this — keep it that way).

---

## 3. Frontend engineering

[`ui-ux-rules.md`](ui-ux-rules.md) owns everything visual (tokens, type, layout, motion,
components, breakpoints) and the baseline JS conventions (§7 there). These rules add the
engineering layer on top:

### 3.1 Rendering remote or user data

- Any string that originated outside the repo (API response, calendar entry, form input,
  URL param) is **escaped before it touches `innerHTML`** — use a shared `escapeHtml`
  helper or build nodes with `textContent`. No exceptions, even for "our own" calendar data.
- Prefer building DOM via `createElement`/`textContent` for anything interactive;
  template-string `innerHTML` is acceptable for read-only lists of escaped values.

### 3.2 Data fetching

- Every `fetch` handles three outcomes: success, error response (check `res.ok` — a 403 is
  not a crash), and network failure. Each failure renders a designed fallback state, never a
  blank region or a console-only error (see `events-calendar-sync.md` "Failure modes").
- Show something while loading if the wait is perceptible; never layout-shift the page when
  data arrives late.

### 3.3 Behavior

- No inline event handlers (`onclick="..."`) and no inline `<script>` logic — deferred files
  only, per ui-ux-rules §1.1.
- The page must not break when JS fails to load: content and navigation work; enhancements
  (reveals, dynamic lists) degrade to static.

### 3.4 Keys and config in the browser

- The **only** credentials allowed in frontend code are public API keys locked by HTTP
  referrer + API restriction (the Google Calendar key pattern). Anything more powerful —
  service accounts, private keys, tokens — lives on the backend, full stop.
- If a feature can't be built safely with a restricted public key, it's a backend feature.

---

## 4. Backend architecture

The member portal and sponsor portal are static design previews today. Making them real means
auth, member profiles, resume upload/storage, tier-gated sponsor access, and RSVP — all of it
governed by this section.

### 4.1 Choosing the stack

The stack decision is made once, together, and recorded as an ADR (§11.2) before backend
code is written. Whatever we pick must satisfy:

- **One language across the backend.** No polyglot services for a codebase this size.
- **Typed or type-checked** (e.g. TypeScript over plain JS) — types are documentation the
  next e-board can't lose.
- **Free-tier hostable** with a managed database and managed file storage. A student org
  never babysits servers or pays surprise bills.
- **Boring and documented**: mainstream framework, huge community, answers on the first
  page of search results.

**Decided:** Python 3.13 + FastAPI + Supabase — see
[decisions/001-backend-stack.md](decisions/001-backend-stack.md). Python meets the
type-checking requirement above only because `mypy --strict` passing is a merge
requirement; setup and conventions live in [backend-setup.md](backend-setup.md).

### 4.2 Layering

Three layers, dependencies pointing one way only:

```
routes/          ← HTTP: parse + validate input, call a service, shape the response. NOTHING else.
services/        ← business logic: tiers, points, eligibility, RSVP rules. No HTTP, no SQL.
data/            ← persistence: queries, storage access. No business decisions.
```

- No business logic in route handlers; no SQL outside the data layer; no HTTP objects
  (req/res) passed below the route layer.
- Cross-cutting pieces (config, logging, auth middleware, validation schemas) get their own
  modules; nothing reaches into another layer's internals.

### 4.3 Configuration

- All config comes from environment variables, read **once** at startup in a single config
  module. The rest of the code imports config values; nothing else touches `process.env`.
- Startup **fails fast and loudly** if a required variable is missing — no defaulting to
  empty strings, no discovering it at 2 a.m. on the first request.
- A committed `.env.example` lists every variable with a placeholder and a one-line comment.
  The real `.env` is gitignored before the first secret exists.

---

## 5. API design

- All endpoints live under `/api/v1/…`. Version bumps are a deliberate, documented event.
- Resources are plural nouns; actions are HTTP verbs:
  `GET /api/v1/events` · `POST /api/v1/rsvps` · `GET /api/v1/members/me` ·
  `PUT /api/v1/members/me/resume`. No verbs in paths (`/getEvents` is banned).
- JSON in, JSON out. Responses use one envelope everywhere:

```json
{ "data": { … } }
{ "error": { "code": "RESUME_TOO_LARGE", "message": "Resumes must be under 5 MB." } }
```

- `message` is safe to show a user verbatim; `code` is stable and machine-checkable. Internal
  details (stack traces, query text, file paths) never leave the server.
- Status codes mean what they say: `200/201` success, `400` invalid input, `401` not signed
  in, `403` signed in but not allowed (sponsor tier too low), `404` doesn't exist **or**
  caller may not know it exists, `429` rate limited, `500` our bug.
- List endpoints paginate from day one (`?limit=&offset=` or cursor) — even if today's data
  fits on one page.

---

## 6. Security

### 6.1 Authentication & authorization

- Auth is enforced by **server middleware on every protected route** — allowlist thinking:
  a route is private unless explicitly marked public, not the reverse.
- Roles are explicit and few: `member`, `sponsor` (with a tier), `admin` (e-board). Every
  protected endpoint states which roles reach it.
- Tier gating (resume book access, download limits) is checked in the service layer per
  request. The `.portal-lock` overlay is theater; the server is the bouncer.
- Prefer not owning passwords at all (SBU email magic links or Google OAuth). If we ever
  store passwords: bcrypt/argon2, never anything homemade, never reversible.
- Sessions: httpOnly, Secure, SameSite cookies — no tokens in `localStorage`.
- Rate-limit auth and upload endpoints. Failed logins are logged (without the password).

### 6.2 Baseline checklist (every backend PR)

- [ ] All input validated server-side against an allowlist schema — types, lengths, formats
- [ ] Database access is parameterized/ORM only — string-built queries are banned
- [ ] Output reaching HTML is escaped (§3.1); API responses set correct `Content-Type`
- [ ] CORS locked to our origins (production domain + localhost dev), not `*`
- [ ] HTTPS only; security headers on (CSP, `X-Content-Type-Options`, `Referrer-Policy`)
- [ ] No secrets, tokens, or PII in logs, error messages, or client responses
- [ ] New dependencies audited (known CVEs, maintenance) before merging

### 6.3 File uploads (resumes)

- Allowlist: PDF only. Enforce size cap (5 MB) and verify content type server-side by
  sniffing bytes, not trusting the extension or the client's `Content-Type`.
- Stored under a **server-generated random name** in **private** storage — never in the web
  root, never publicly listable, original filename kept only as display metadata.
- Downloads go through an authorization check that issues a **short-lived signed URL** (or
  streams through the server). A resume URL must be worthless to share.

---

## 7. Data

### 7.1 Schema and migrations

- Schema changes are migration files in the repo — ordered, reviewed, and run identically in
  every environment. No hand-edited production schemas, ever.
- Migrations are additive by default. Destructive ones (drop/rename) require a stated
  backup/rollback step in the PR.
- Every table gets `id` (server-generated, non-guessable if exposed in URLs),
  `created_at`, `updated_at`. Booleans have defaults; foreign keys are real constraints.

### 7.2 Queries

- Parameterized always (§6.2). N+1 loops get fixed when found, not "later".
- The database is the source of truth for invariants it can express (uniqueness, FKs,
  not-null) — don't enforce in app code what a constraint can guarantee.

### 7.3 Member PII

Member profiles and resumes are real students' personal data. Treat them accordingly:

- **Minimum collection:** every stored field must serve a live feature. "Might be useful"
  is not a reason.
- **No PII in logs** — log the member's id, never name/email/major (§8).
- **Deletion is a feature:** a member who graduates or asks gets their profile and resume
  actually deleted, and the code path for that exists from day one.
- Resume-book visibility is opt-in (the portal toggle), enforced server-side: a member with
  the toggle off never appears in any sponsor-facing response, regardless of tier.
- Backups are automatic (managed DB requirement, §4.1) and restore is tested once, not assumed.

---

## 8. Errors & logging

- One central error handler at the boundary (route layer). It logs the full detail
  server-side and returns the safe envelope (§5) to the client. Handlers/services throw or
  return typed errors; they don't build HTTP responses.
- Logs are structured (JSON: timestamp, level, request id, route, message) so they're
  greppable. `console.log` debugging is removed before commit.
- Log levels mean something: `error` = a person should look, `warn` = degraded but working,
  `info` = notable lifecycle events. No `error`-level noise — alarm fatigue kills real alarms.
- User-facing messages are calm and generic; logs carry the specifics. Never show a stack
  trace, query, or path to a browser.

---

## 9. Testing & verification

Pragmatic pyramid — this is a small team, so tests go where bugs are expensive:

- **Backend endpoints:** every endpoint gets automated tests for at minimum — the happy
  path, rejected invalid input, and rejected unauthorized/wrong-role access. The auth-failure
  test is not optional; it's the one guarding student data.
- **Business logic** (tier rules, points, eligibility): unit-tested pure functions —
  extracting logic from handlers (§4.2) is what makes this cheap.
- **Frontend:** manual verification against the ui-ux-rules checklist — 1280px / ~1000px /
  ~900px (hamburger) / ~375px, console clean, JS-disabled degradation sane (§3.3).
- Tests run green before merge. A red test is fixed or the change is reverted — never
  skipped/commented to get a merge through.
- Every PR description ends with **"Verified:"** and the actual steps taken. "It works" is
  not a verification.

---

## 10. Git & collaboration

- Branch per change, kebab-case, named for the change: `member-sponsor-portals`,
  `resume-upload-api`. PRs target **`main`**, the published branch GitHub Pages deploys
  from. (`phase-one-local` held that role until August 2026 and is retired - anything
  still naming it is out of date.)
- Commits are small and single-purpose, imperative mood: "Add resume upload validation",
  not "misc fixes" / "wip".
- One concern per PR. A feature PR does not also reformat files or upgrade dependencies.
- Never committed: secrets/`.env`, `node_modules`, build output, editor droppings
  (`.DS_Store`), database files, uploaded resumes. Grow `.gitignore` in the same PR that
  introduces a new artifact type.
- When the backend lands, add a `.gitattributes` normalizing line endings to LF — we develop
  on Windows and deploy to Linux; don't let CRLF churn pollute diffs.
- History is honest: no force-pushing shared branches, no amending public commits.

---

## 11. Documentation & decisions

### 11.1 Docs

- `docs/` is the operational brain. Any feature with setup steps, conventions, or a
  re-enable path gets a doc (`events-calendar-sync.md` and `sponsor-tiers.md` are the model).
- Docs update **in the same PR** as the change they describe — a stale doc is worse than
  no doc.
- The rulebooks stay authoritative: design conventions live in `ui-ux-rules.md`, engineering
  conventions live here. New conventions get added to the right book, not invented in a
  random doc.

### 11.2 Architecture Decision Records

Significant choices (backend stack, auth approach, hosting, database) get a tiny ADR in
`docs/decisions/NNN-title.md` so future e-boards know **why**, not just what:

```markdown
# NNN. Title (e.g. 001. Backend stack)
Date · Status (accepted/superseded by NNN)

## Context      — the situation and constraints
## Decision     — what we chose
## Consequences — what this buys us, what it costs, what would make us revisit
```

Superseding a decision means a new ADR pointing back, never editing history.

---

## 12. Pre-merge checklist (copy into the PR)

```markdown
- [ ] Followed the approved plan; scope creep raised separately
- [ ] Golden rules hold (plan/reuse/validation/server-side auth/no secrets/no swallowed errors)
- [ ] Security checklist passed (§6.2) — backend PRs
- [ ] Tests green; endpoint has happy/invalid/unauthorized coverage — backend PRs
- [ ] Frontend checked at 1280 / 1000 / 900 / 375 px, console clean — frontend PRs
- [ ] Nav/footer changes propagated to every root page — if applicable
- [ ] Docs/ADRs updated in this PR
- [ ] Verified: <the actual steps taken>
```
