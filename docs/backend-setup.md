# Backend setup

The API that will power the member and sponsor portals. Python 3.13 + FastAPI, with
Supabase as the database and auth provider — see
[decisions/001-backend-stack.md](decisions/001-backend-stack.md) for why.

Everything below runs from the `backend/` directory. The static site is unaffected: it
still opens with Live Server and has no build step.

## First-time setup

You need **Python 3.13** (3.14 is newer than some of our dependencies' wheels).

```bash
cd backend
py -3.13 -m venv .venv                      # Windows;  python3.13 -m venv .venv on macOS/Linux
.venv/Scripts/python -m pip install -r requirements-dev.txt
cp .env.example .env                        # fill in any blanks
```

Two env files, doing different jobs: **`.env.example` is committed** and documents which
variables exist, with secrets left blank — it is how the next e-board learns what to set.
**`.env` is your real values and is gitignored**, because that is where the Supabase
service-role key ends up. They look identical right now only because nothing secret exists
yet. Adding a variable means adding it to both, and only one of them gets committed.

## Running it

```bash
.venv/Scripts/python -m uvicorn app.main:app --reload
```

Then http://127.0.0.1:8000/api/v1/health should return:

```json
{ "data": { "status": "ok", "environment": "development", "version": "0.1.0" } }
```

Interactive docs are at http://127.0.0.1:8000/docs in development. They are disabled when
`APP_ENV=production` — the docs page describes the whole attack surface.

## Before every PR

All three must be green (§9 and §12 of the engineering rules):

```bash
.venv/Scripts/python -m pytest       # tests
.venv/Scripts/python -m ruff check . # lint
.venv/Scripts/python -m mypy app tests   # types — strict mode, see decisions/001
```

`ruff format .` fixes formatting.

`.github/workflows/backend-ci.yml` runs these same commands on every PR that touches
`backend/`, so a red check is the same failure you would have seen locally. CI needs no
secrets: the test suite supplies its own environment in `tests/conftest.py`.

## How the code is laid out

Dependencies point one way only (engineering-rules §4.2): routes → services → data.

```
backend/
├─ app/
│  ├─ main.py                app factory: middleware, error handlers, router mounting
│  ├─ core/                  cross-cutting; imports from no other layer
│  │  ├─ config.py           the ONLY module that reads the environment
│  │  ├─ errors.py           ApiError + the boundary handlers that build the envelope
│  │  ├─ logging.py          JSON logs, request id per request
│  │  └─ security_headers.py nosniff / CSP / HSTS on every response
│  ├─ api/v1/                the routes layer: validate input, call a service, respond
│  │  ├─ router.py           every v1 route reaches the app through here
│  │  └─ health.py           one module per resource; auth.py and members.py land here
│  ├─ services/              business logic — no HTTP objects, no SQL (empty for now)
│  └─ data/                  queries and storage access — no business decisions (empty for now)
└─ tests/
```

## Conventions worth knowing before you write a route

- **Every response uses the envelope** (§5): `{"data": …}` on success,
  `{"error": {"code": …, "message": …}}` on failure. `message` is shown to a user as-is;
  `code` is stable and machine-checkable.
- **Never build an error response by hand.** Raise `ApiError(status, code, message)` and let
  `core/errors.py` shape it. Internals stay server-side — the boundary is what guarantees a
  stack trace never reaches a browser.
- **Invalid input is 400, not 422.** FastAPI's default validation error is remapped.
- **Config comes from `get_settings()`.** Nothing else reads `os.environ`. A missing required
  variable stops the process at boot with a message naming the variable.
- **Logs carry no PII** (§7.3): log a member's id, never their name, email, or major. Query
  strings are deliberately not logged for the same reason.
- **New routes are private by default.** `/api/v1/health` is public on purpose and says so in
  a comment; anything else gets an auth dependency when the auth slice lands.

## Dependencies

Two files. Every direct dependency is pinned to an exact version; edit the file, then
reinstall. There is no lockfile of the full tree on purpose — see §2.5 and
[decisions/001-backend-stack.md](decisions/001-backend-stack.md).

| File | What it is | Who installs it |
|---|---|---|
| `requirements.txt` | the 3 runtime dependencies | the deployed server |
| `requirements-dev.txt` | the above plus pytest / ruff / mypy | you, and CI |

## Not built yet

Slice 1 is the skeleton only. Still to come, each as its own plan and PR: Supabase project
and SQL migrations, signup/login with httpOnly session cookies, email confirmation, member
profiles, then sponsor tier gating. The resume book is deliberately further out.

`SUPABASE_*` variables appear in `.env.example` as commented lines so the contract is
visible, but nothing reads them yet.
