# Stony Brook SHPE — UI/UX Rules

**The single source of truth for how this site looks, moves, and grows.**
Every new page, section, or component must follow these rules. The canonical implementation
lives in [`css/shpe-design.css`](../css/shpe-design.css) and [`js/shpe.js`](../js/shpe.js) — if
this document and the CSS ever disagree, fix one of them, never fork a third convention.

---

## 1. Architecture

### 1.1 File structure

```
/                       ← all pages live flat at the root (index.html, events.html, …)
css/shpe-design.css     ← THE stylesheet: tokens → base → type → layout → motion → components → responsive
js/shpe.js              ← shared behavior: scroll-reveal, nav toggle, custom select, form submit
js/<feature>.js         ← page-specific behavior, one file per feature (e.g. email-contact-us.js)
media/                  ← images, organized by purpose:
  eboard-members/<yy-yy>-eboard/   ← one folder per academic year
  events/  icons/  sponsors/  testimonials/
docs/                   ← markdown docs (this file, sponsor-tiers.md, events-calendar-sync.md)
```

**Rules**

- Every page loads **exactly one stylesheet**: `css/shpe-design.css`. No per-page CSS files.
  New styles go into the appropriate `/* ===== SECTION ===== */` block of `shpe-design.css`,
  or a new block appended before the `RESPONSIVE` section.
- Every page loads `js/shpe.js` with `defer`. Page-specific scripts are separate deferred
  files — never inline `<script>` blocks with logic.
- No frameworks, no build step. Vanilla HTML + CSS + JS only. The one sanctioned external
  runtime dependency is EmailJS (contact form) loaded from CDN.
- New academic year e-board photos go in a new `media/eboard-members/<yy-yy>-eboard/` folder;
  never overwrite a previous year's folder.

### 1.2 Deprecated files — do not extend

These are leftovers from the old Bootstrap site. **Never link them from a new page, never add
to them; migrate anything still needed into `shpe-design.css` and delete:**

`css/bootstrap.css`, `css/bootstrap-social.css`, `css/carousel.css`, `css/home.css`,
`css/contact-us.css`, `css/testimonials.css`, `css/events.css`, `css/sponsor-us.css`,
`js/bootstrap.bundle.js`, `js/index.js`, `js/animation.js`, `eboard/eboard.html`, `Footer/`,
`mail.php`. (`chapter-bylaws.html` is a Google Docs export — leave it as-is, it is content,
not UI.)

---

## 2. Design tokens

All colors and easings are defined once in `:root` in `shpe-design.css`. **Always use the
custom property — never hardcode a hex value** except pure `#fff` and `rgba()` white/black
overlays on dark surfaces.

| Token | Value | Use for |
|---|---|---|
| `--shpe-navy` | `#001F5B` | Primary brand. Dark section backgrounds, headings on light, primary buttons |
| `--shpe-navy-700` | `#00174a` | Panels/photo placeholders inside navy sections |
| `--shpe-navy-900` | `#000d2e` | Footer background, deepest surfaces |
| `--shpe-orange` | `#FD652F` | **Accent only.** CTAs, eyebrows, italic accent words, hover states, focus borders |
| `--shpe-orange-300` | `#fd9472` | Orange text on navy (labels, roles, hover text on dark) |
| `--shpe-orange-100` | `#ffe3d8` | Light orange washes, decorative quote marks, frame gradients |
| `--cream` | `#faf6ef` | Warm alternate section background |
| `--bone` | `#f7f8fb` | Cool alternate section background (`.section-tinted`) |
| `--paper` | `#fff` | Default page/card background |
| `--ink-900 … --ink-100` | grays | Text hierarchy: 900 strongest → 500 muted → 300 disabled/ghost → 100 hairline borders |
| `--shpe-sky`, `--shpe-red`, `--shpe-blue` | | Reserved brand extras — use sparingly, never as new primary/accent |
| `--ease-out-expo` | `cubic-bezier(.16,1,.3,1)` | Default easing for all transitions/animations |
| `--ease-in-out` | `cubic-bezier(.65,0,.35,1)` | Symmetric motion (loops, back-and-forth) |

**Extending the palette:** new tints follow the existing scale naming
(`--<color>-100/300/700/900`, base name = 500-equivalent). Add them to `:root`, document them
here, then use them.

**On dark (navy) surfaces**, text uses white at fixed opacities — reuse these, don't invent
new ones: `#fff` headings · `rgba(255,255,255,.8)` body · `.7` secondary/links · `.55–.65`
labels · `.3–.4` placeholders/disabled · `.08–.15` borders and ghost fills.

---

## 3. Typography

Three typefaces, loaded once via the Google Fonts `@import` in `shpe-design.css`. Never add
another font.

| Face | Role | Rules |
|---|---|---|
| **Anton** | Display / headings | Always `font-weight: 400`, always `text-transform: uppercase`, tight leading (0.82–0.98), negative tracking (−0.01em to −0.035em) |
| **Inter** | Body, UI, labels | 400–700 in running text; 600–700 for UI labels/buttons |
| **Instrument Serif** (italic) | Accent words inside headings | Always italic, weight 400, `text-transform: none`, colored `--shpe-orange` |

**Rules**

- Headings use the fluid scale classes — never invent ad-hoc `font-size` for a heading:
  `.display-xxl` (hero-scale) · `.display-xl` · `.display-l` (standard section heading) ·
  `.display-m`. All use `clamp()` — new display sizes must too.
- Every section heading gets **exactly one** accent word wrapped in
  `<em class="serif-italic">…</em>` (or `em` inside a component that styles it). One per
  heading — two or zero reads as a mistake.
- Every section heading is preceded by an `.eyebrow` label (11px, 0.16em tracking, uppercase,
  orange, 24px dash before). On navy surfaces use the on-dark eyebrow pattern
  (`--shpe-orange-300`).
- Body copy: Inter 14–19px, line-height 1.5–1.7, constrained to a readable measure
  (`max-width` in `ch` — 34–52ch depending on context). Never full-container-width paragraphs.
- Muted/secondary text: `.ink-muted` / `--ink-500` on light; `rgba(255,255,255,.7)` on dark.
- UI micro-labels (tags, stats, roles): Inter 600–700, 10–13px, uppercase, letter-spacing
  0.08–0.24em — smaller text gets wider tracking.
- Uppercase is applied **via CSS**, never typed in caps in the HTML (keeps content accessible
  and editable).
- **No em dashes in copy.** Use commas, periods, or the `·` middot separator
  (e.g. "Est. 1995 · Stony Brook University Chapter").

---

## 4. Layout & spacing

- **Container:** `.container` — max-width 1280px, 32px side padding (20px under 600px). All
  section content sits inside it; only heroes, marquees, nav, and footer are full-bleed.
- **Vertical rhythm:** `.section` = 120px top/bottom · `.section-compact` = 80px · 80px on
  mobile. Section headers get 56px bottom margin (`.section-head` / `.section-head-split`).
- **Section backgrounds alternate** down the page: paper → bone (`.section-tinted`) → cream
  (`.section-cream`) → navy. Never two identical tinted bands adjacent.
- **Section header pattern:** `.section-head-split` = heading block left, short muted
  supporting paragraph right (`.section-head-right`, max 360px). Use it for any section that
  needs context copy.
- **Grids:** CSS Grid with `repeat(n, 1fr)`. Established densities: pillars 3-up, e-board
  5-up, testimonials 3-up, sponsor tiles 3/4-up, stats 4-up. New card grids pick one of these
  and reuse the existing collapse pattern (§8).
- **Spacing scale:** stick to the values already in use — 4/6/8/10/12/14/16/20/24/28/32/40/
  48/56/60/80/100/120px. No arbitrary in-between values.
- **Radius scale:** `999px` pills (buttons, tags, nav links) · `50%` circles (dots, avatars,
  badges) · `10–18px` cards and images · `24px` large feature panels (CTA card, form card) ·
  `4px` subtle frames. Nothing else.
- **Hairlines:** 1px `var(--ink-100)` on light, `rgba(255,255,255,.08–.15)` on dark. Used for
  list dividers, grid gutters (pillars), and section rules.
- **Shadows** are reserved for elevation on hover and hero/feature imagery. Follow the house
  formula: large offset-Y, large blur, negative spread, tinted —
  e.g. `0 20px 40px -16px rgba(0,31,89,.15)`, `0 12px 30px -8px rgba(242,101,52,.5)`.
  No flat `box-shadow: 0 0 …` glows on light surfaces.

---

## 5. Components

Reuse before you build. If a new need is 80% an existing component, extend it with a modifier
class instead of creating a sibling.

### 5.1 Naming conventions

- Global chrome is prefixed `shpe-` (`.shpe-nav`, `.shpe-hero`, `.shpe-footer`,
  `.shpe-marquee`).
- Components use a flat kebab-case family: `.component` → `.component-part` →
  `.component-part-sub` (e.g. `.eboard-card` / `.eboard-role`, `.sponsor-tier-head`).
- State is always an `.is-*` class toggled by JS or modifiers: `.is-active`, `.is-open`,
  `.is-visible`, `.is-selected`, `.is-reverse`. Never style state via inline `style`
  mutations (the one legacy exception is the form success state — don't copy it).

### 5.2 Buttons

All buttons are pills (`border-radius: 999px`), Inter 700 14px, `14px 26px` padding, with a
`.btn-arrow` span that nudges 4px right on hover. Hover always lifts `translateY(-2px)`.

| Class | Surface | Use |
|---|---|---|
| `.btn-primary` | light | Primary action (navy → orange on hover) |
| `.btn-outline` | light | Secondary action |
| `.btn-primary-on-dark` | navy | Primary action (orange → white on hover) |
| `.btn-ghost-on-dark` | navy | Secondary action |
| `.btn-text` | light | Tertiary/inline link with underline |

One primary button per view region. Pair primary + ghost/outline for dual CTAs, in that order.
CTA labels are short and action-first, optionally with the `→` arrow ("Join the Familia →").

### 5.3 Page skeleton

Every page is: **nav → hero or page-header → alternating sections → (optional marquee) →
footer.**

- `.shpe-nav`: sticky, translucent navy with blur. Copy it verbatim from `index.html`; the
  only per-page change is which link gets `.is-active`. Contact Us is always the
  `.shpe-nav-cta` pill, never a plain link.
- The full `.shpe-hero` (grid overlay + glow + animated title) is **home-page only**. Inner
  pages use `.page-header` (navy band + glow + eyebrow + h1 + `.page-header-sub`), or a light
  hero like `.contact-hero` / `.events-hero-section` when the page starts on white.
- `.shpe-marquee` (orange scrolling values strip) is a rhythm device, max twice per page.
- Footer: copy verbatim from `index.html` (brand lockup, nav links, legal line +
  `.social-chips.on-dark`). Nav and footer are duplicated across pages by design — when
  editing them, update **every** `*.html` at the root in the same commit.

### 5.4 Cards & list patterns (reuse these before inventing)

- **`.pillar-card`** — flat cells separated by hairlines, ghost number, orange underline
  sweeps in on hover. For value/feature triads.
- **`.feature-row`** — 2-col text+media with `.feature-media-frame` (gradient mat + orange/
  navy corner brackets). Alternate direction with `.is-reverse`.
- **`.eboard-card`** — 3:4.2 portrait, gradient overlay, meta bottom-left, LinkedIn chip
  reveals on hover. For any people grid.
- **`.testimonial-card`** — white card, hairline border, giant serif `“` watermark, lifts
  −4px with navy border on hover. For quotes.
- **`.sponsor-tile`** — logos grayscale at rest, full color on hover.
- **`.event-row`** — table-like row grid; on hover a navy panel wipes in from the left
  (`::before` width 0→100%) and all inner text flips to on-dark colors. For any dated list.
- **`.contact-social-link`** — oversized Anton link rows with the same orange wipe-fill
  hover. For link lists that deserve drama.
- **`.portal-stat`** — white tile: micro-label + Anton number (`sup` for units/denominators),
  lifts on hover. For dashboard stats on light surfaces (portal pages). Sits in
  `.portal-stat-grid` (4-up); add `.portal-stat-grid-3` for a three-tile row so it fills
  the width instead of leaving a dead column. Both drop to 2-up, then 1-up, on narrow.
- **`.book-row`** — resume-book row (avatar, name + major, class, tag, download link) with
  the same navy wipe-fill hover as `.event-row`. Wrap ghost rows in `.portal-lock` +
  `.portal-lock-overlay` for tier-gated states.
- **`.chart-card` / `.bar-list`** — CSS-only horizontal bar chart: navy fills on a
  navy-tinted track, values right-aligned in ink tokens, bar widths via an inline `--w`
  custom property. Bars grow in when the card's `.reveal` becomes visible; static
  under reduced motion.
- **`.portal-*` controls** — `.portal-dropzone` + `.portal-file` (resume upload), `.portal-toggle` (opt-in switch, `.is-on`),
  `.portal-tag` / `.tier-badge` (status pills), `.portal-id-chip` (signed-in identity on
  navy), `.portal-filters` (filter pills), `.portal-checks` (benefit checklist),
  `.portal-note` (orange-rule footnote). Introduced by `member-portal.html` and
  `sponsor-portal.html`; those two pages are design previews and are deliberately **not**
  linked from the nav/footer until the portals are real.

### 5.5 Forms

Follow the contact form exactly: navy `.contact-form-card` (24px radius, corner glow),
uppercase micro-labels, **underline-only inputs** (transparent bg, 1px bottom border, orange
on focus, no boxes), custom animated select (`.contact-custom-select` with `.is-open` panel),
and a full-width orange pill submit. New form controls extend this family in
`shpe-design.css` + `shpe.js` — never drop in a native-styled or third-party widget.

---

## 6. Motion

- **Easing:** `var(--ease-out-expo)` for everything entering or reacting; `--ease-in-out`
  only for symmetric loops. Never `ease`, `linear` (except marquee/spin loops), or new
  beziers.
- **Durations:** 200–300ms color/hover feedback · 300–500ms transforms and wipes ·
  700–900ms entrances · seconds-scale only for ambient loops (marquee 30s, badge spin 20s,
  pulse 2s).
- **Scroll entrance:** add `.reveal` (+ `.reveal-1…-4` for 80ms stagger steps) to anything
  that should rise in on scroll; `js/shpe.js`'s IntersectionObserver adds `.is-visible` once,
  then unobserves. Never re-animate on re-scroll. Hero content instead uses the `rise-in` /
  `scale-in` keyframes with staggered `animation-delay`s since it's above the fold.
- **House hover vocabulary** — pick from these, don't invent new physics:
  lift (`translateY(-2px)` buttons / −3 chips / −4 cards / −6 eboard) · orange wipe-fill
  (`::before`/`::after` scaleX or width 0→100%, origin left) · arrow nudge
  (`translateX(4px)` or `translate(3px,-3px)` for external ↗) · image zoom
  (`scale(1.05)` inside `overflow: hidden`) · grayscale→color (logos).
- **Reduced motion:** new animation work must sit behind
  `@media (prefers-reduced-motion: reduce)` — disable marquee auto-scroll, reveals (show
  content immediately), and ambient loops. (The current CSS predates this rule; add the
  guard when you next touch those blocks.)

---

## 7. JavaScript

- Vanilla ES2017+, wrapped in an IIFE with `'use strict'` (see `shpe.js`). No jQuery, no
  frameworks, no build tooling.
- Scripts are `defer`red and guard for `document.readyState` before wiring up.
- JS communicates with CSS **only by toggling `.is-*` classes** and reading/writing
  `aria-*` attributes. Keep styling in the stylesheet.
- Behavior must be resilient to absent markup: query for the element, bail early if it's not
  on this page (`if (!toggle || !links) return` pattern).
- Prefer `IntersectionObserver` / `ResizeObserver` / `matchMedia` over scroll/resize
  listeners.

---

## 8. Responsive rules

Desktop-first with `max-width` queries at the established breakpoints — don't add new ones
without reason:

| Breakpoint | What changes |
|---|---|
| `1100px` | e-board grid 5 → 3 columns |
| `1000px` | hero and contact split → 1 column; sponsor stats 4 → 2 |
| `900px` | the big collapse: card grids → 1–2 col, feature rows stack (text first), nav links → hamburger (`.shpe-nav-toggle` + `.is-open`), event rows drop tag/RSVP columns |
| `600px` | container padding 32 → 20px, sections 120 → 80px, remaining grids → 1 col, footer stacks |

- Type never needs media queries — fluid sizing is `clamp(min, vw, max)` at the declaration.
- In stacked feature rows, **text always comes before media**.
- When a grid collapses, remove the borders that no longer make sense (see
  `.pillar-card { border-right: none }`).
- Images: the base reset already gives `max-width: 100%; height: auto; display: block`.
  Portrait/card imagery uses `aspect-ratio` + `object-fit: cover` — never fixed px heights.

---

## 9. Accessibility & content

- Semantic structure: `<nav>`, `<section>`, `<footer>`, `<blockquote>` for quotes, one `<h1>`
  per page, `h2` for sections.
- Every meaningful `<img>` gets real `alt` text; decorative images get `alt=""`.
- Icon-only links require `aria-label` (see social chips, LinkedIn chips). Toggles maintain
  `aria-expanded` in JS.
- External links: `target="_blank" rel="noopener"`, always.
- Interactive targets are ≥ 32px (44px preferred — social chips are 44×44).
- Focus states exist for form fields (orange border). Any new interactive component needs a
  visible focus treatment, not `outline: none` alone.
- Every page `<head>` includes: `charset`, `viewport`, `description` meta, a
  `<title>` in the form `Page Name — Stony Brook SHPE` (home is just `Stony Brook SHPE`),
  and the `media/icon.PNG` favicon.
- Voice: proud, warm, direct. First person plural ("we", "our familia"). Spanish terms
  (familia) are used naturally, unitalicized. Stats are concrete ("120+ Active Members").

---

## 10. Adding things — checklists

**New page**

1. Copy an existing inner page (e.g. `events.html`) — keep the head block, nav, footer, and
   script include intact.
2. Set the `<title>`, meta description, and move `.is-active` to the right nav link.
3. Open with `.page-header` (or a light hero) + eyebrow + display heading with one serif
   accent word.
4. Build the body from existing sections/components; alternate section backgrounds; sprinkle
   `.reveal` staggering.
5. Add the page link to the nav and footer of **all** other root pages.
6. Check 1280px, ~1000px, ~900px (hamburger), and ~375px widths.

**New component**

1. Confirm no existing component covers it (§5.4).
2. Name it per §5.1, build it from tokens (§2) and scales (§3, §4) only.
3. Add a `/* ===== NAME ===== */` block in `shpe-design.css` before the RESPONSIVE section;
   put its collapse rules in the existing breakpoint blocks.
4. Give it the house hover/entrance behavior (§6) including the reduced-motion guard.
5. If it needs JS, extend `shpe.js` following §7.
6. Document it in this file under §5.4.
