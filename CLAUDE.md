# Stony Brook SHPE Website

Chapter website for the Society of Hispanic Professional Engineers at Stony Brook University.
The site is static (vanilla HTML/CSS/JS, GitHub Pages, no build step). The backend that will
power the member and sponsor portals lives in `backend/` (Python 3.13 + FastAPI + Supabase) -
`member-portal.html`, `sponsor-portal.html`, and the two sign-in pages
(`member-sign-in.html`, `sponsor-sign-in.html`) are still static design previews of it.

## The two rulebooks — read before working

1. **[docs/engineering-rules.md](docs/engineering-rules.md)** — process, code quality,
   backend/API/security/data standards. Governs ALL code.
2. **[docs/ui-ux-rules.md](docs/ui-ux-rules.md)** — design tokens, typography, layout,
   components, motion, breakpoints. Governs everything visual.

Before implementing or reviewing anything, read the relevant sections of both. If a change
conflicts with a rulebook, stop and raise it — either the change or the rulebook gets amended
in the same PR, never silent drift.

## Workflow: plan first, always

Never jump into implementation. For any non-trivial task, present a short plan
(Goal / Changes / Out of scope / Risks / Verification — see engineering-rules §1.1) and get
approval before writing code. Code quality is the priority, not speed.

## Facts that prevent common mistakes

- PRs target **`main`**, the published branch GitHub Pages deploys from. Feature branches
  are kebab-case. (`phase-one-local` was the published branch until August 2026 - older
  PRs and docs reference it; it is retired.)
- Nav and footer are duplicated across every root `*.html` **by design** — editing them means
  updating every page in the same commit.
- One stylesheet: `css/shpe-design.css`. One shared script: `js/shpe.js`. No per-page CSS,
  no frameworks, no build step on the frontend.
- Deprecated leftovers (Bootstrap CSS/JS, `mail.php`, `Footer/`, `js/index.js`,
  `js/animation.js`, `eboard/`) — never extend or link them (ui-ux-rules §1.2).
- Backend: `backend/` is a separate Python venv - see [docs/backend-setup.md](docs/backend-setup.md)
  for how to run it, and [docs/decisions/001-backend-stack.md](docs/decisions/001-backend-stack.md)
  for why the stack is what it is. `pytest`, `ruff`, and `mypy --strict` must be green before merge.
- Server-side enforcement for anything gated: `.portal-lock` overlays are presentation only.
- Member data (profiles, resumes) is sensitive — minimum collection, no PII in logs.
