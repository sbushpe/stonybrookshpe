# 001. Backend stack

2026-08-17 · Accepted

## Context

`member-portal.html` and `sponsor-portal.html` are static design previews. Making them real
needs accounts, authentication, and stored member profile data, with email confirmation
close behind. Engineering-rules §4.1 requires the stack to be one language, typed or
type-checked, free-tier hostable with a managed database, and boring enough that an e-board
member who has never seen the codebase can pick it up.

Two further constraints shaped the choice:

- The chapter does not want to own passwords (§6.1), and email confirmation is an
  immediate requirement, not a someday feature.
- Whatever we pick is inherited every academic year by students whose coursework is
  overwhelmingly Python.

## Decision

**Python 3.13 + FastAPI, with Supabase as the managed database, auth provider, and (later)
file storage.** The backend lives in `backend/`, isolated from the static site, which stays
vanilla HTML/CSS/JS on GitHub Pages with no build step.

Supporting choices:

- **Type checking is not optional.** §4.1's "typed or type-checked" is satisfied by type
  hints everywhere, Pydantic models at every boundary, and `mypy --strict` passing before
  merge. Python without this would not have met the rule, which is why enforcement is CI's
  job (`.github/workflows/backend-ci.yml`) rather than a line in a checklist someone reads
  once in September.
- **Sessions are backend-set httpOnly cookies.** The browser talks to FastAPI; FastAPI talks
  to Supabase Auth. The frontend never holds a token, so §6.1's "no tokens in localStorage"
  holds. This is why `supabase-js` is not used in the browser.
- **The API is deployed at `api.stonybrookshpe.org`**, a subdomain of the site's own domain.
  This is a security decision, not a cosmetic one: the site is served from
  `www.stonybrookshpe.org`, and a cookie is only same-site if the API shares that
  registrable domain. On a hosting provider's default domain the session cookie would need
  `SameSite=None`, which Safari's defaults and every browser's tracking-prevention mode
  treat with suspicion — the session would break for a slice of members and be weaker for
  everyone else. Same-site lets the cookie ship `SameSite=Lax; Secure; HttpOnly`.
- **Data access via `supabase-py`** (server-side, service-role key) rather than a direct
  Postgres connection with an ORM. It ships with the auth and storage clients we need, keeps
  connection-pool management off a student team, and leaves row level security as a second
  line of defense. Schema still lives in committed SQL migrations (§7.1).
- **Dependency floor.** Three runtime dependencies today: `fastapi`, `uvicorn`,
  `pydantic-settings`. Each addition is argued for in the PR that adds it (§2.5).
- **No lockfile, deliberately.** `requirements.txt` and `requirements-dev.txt` pin every
  direct dependency exactly. Plain pip maintains no lockfile for us — only a hand-run
  `pip freeze` dump, which rots silently and lulls people into trusting it. At this
  dependency count, exact direct pins carry the reproducibility that matters. §2.5 was
  amended to say so. If the tree ever grows enough that transitive drift bites us, moving to
  `uv` (which does maintain a real lockfile) is the answer, not a manual dump.

## Consequences

**What this buys us:** free-tier hosting with managed backups; auth, email confirmation, and
password resets we do not have to write or secure ourselves; a language the next e-board
already knows; automatic OpenAPI docs from the same type hints mypy checks.

**What it costs:** a second language in the repo, so contributors need Python installed and a
venv (documented in `backend-setup.md`); vendor coupling to Supabase for auth and storage;
type checking only helps if CI enforces it, so a green `mypy` is a merge requirement, not a
suggestion.

**What would make us revisit:** Supabase changing its free tier such that the chapter faces a
bill; needing SQL complex enough that PostgREST fights us, which would mean moving the data
layer (and only the data layer, per §4.2) to SQLAlchemy + asyncpg; or the chapter's technical
membership shifting decisively to another language.
