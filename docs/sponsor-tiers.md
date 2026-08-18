# Sponsor Tier Grid (disabled — single-logo mode)

## Current state

`sponsor-us.html` previously rendered three tier rows (Gold / Silver / Bronze),
each filled mostly with `Sponsor slot available` placeholders because USG is
our only active sponsor right now. That looked thin, so the page was switched
to show a single centered USG logo under the "Thank you to the companies
backing us" heading.

The full tier markup is preserved in `sponsor-us.html` as an HTML comment
right below the active single-logo block.

## When to re-enable the tier grid

Bring it back once we have **at least 3 real logos total**, ideally with at
least one in each visible tier. Below that threshold the tier headers
(`Gold Partner`, `Silver Sponsor`, `Bronze Friend`) outweigh the actual
content and the grid feels empty.

If we only have, say, 4–5 sponsors all in one tier, consider showing a
single-tier strip (just the one `sponsor-tier` block) instead of the full
three-tier layout.

## How to re-enable

In [sponsor-us.html](../sponsor-us.html), inside the `<!-- SPONSOR TIERS -->`
section:

1. **Delete** the active single-logo block:

   ```html
   <div class="sponsor-grid" style="grid-template-columns: minmax(220px, 320px); justify-content: center; margin-top: 40px;">
     <div class="sponsor-tile">
       <img src="media/sponsors/usg-logo.webp" alt="USG">
     </div>
   </div>
   ```

2. **Un-comment** the three `<div class="sponsor-tier">` blocks below it.

3. Replace each `<div class="sponsor-ph">Sponsor slot available</div>` with a
   real `<img>` once the sponsor logo is added (see "Adding a new sponsor
   logo" below). Leave any remaining placeholders in place — they signal that
   the tier still has room.

## Tier structure (for reference)

The tier grid uses these existing classes from `css/shpe-design.css`:

| Class | Purpose |
|---|---|
| `.sponsor-tier` | Wrapper for one tier (header + grid) |
| `.sponsor-tier-head` | Container for the tier label |
| `.sponsor-tier-label` | The "Gold Partner" / "Silver Sponsor" / "Bronze Friend" text |
| `.sponsor-grid` | Grid container for tiles |
| `.sponsor-grid-3` | 3-column grid (used for Gold) |
| `.sponsor-grid-4` | 4-column grid (used for Silver, Bronze) |
| `.sponsor-tile` | Individual logo card with hover effect |
| `.sponsor-ph` | "Sponsor slot available" placeholder card |
| `.sponsor-ph-accent` | Orange "available" emphasis text |

The tier price points (shown on the benefits table further down the page) come
from page 8 of `media/proposal/26-27-proposal.pdf`:

- **Community Partner** — $100–$249
- **Bronze** — $250
- **Silver** — $750
- **Gold** — $1,500+
- **Platinum** — $2,500+

Tiers are cumulative in the proposal — each level is described as "All
&lt;previous tier&gt; benefits, plus…" — so in the benefits matrix a benefit is
checked from the tier it unlocks at all the way across to Platinum. Cells below
that point use `.sponsor-benefit-dash` rather than being left empty.

### Adding or removing a tier

The matrix is sized from CSS custom properties, so a new tier is a markup-only
change — **do not edit the grid CSS**:

1. Bump `--tiers` in the inline style on `.sponsor-benefits` in
   [sponsor-us.html](../sponsor-us.html) to the new tier count.
2. Add a `.sponsor-benefit-h` header cell (name + a `.sponsor-benefit-price`
   span) in the correct left-to-right price order.
3. Add one `.sponsor-benefit-cell` to **every** benefit row, in the same
   position. Each row must end up with `--tiers` + 1 cells or the grid shifts.

`grid-template-columns` and the table's `min-width` are both derived from
`--tiers` and `--tier-col`, so column widths and the mobile scroll threshold
update on their own. Verified by adding a test 6th tier: 7 columns and a
1092px min-width, with no stylesheet change.

The benefit-name cells carry an explicit `.is-label` class rather than relying
on an `:nth-child` position rule, so they keep working at any tier count.

Note the logo grid above still uses only three tier labels (`Gold Partner`,
`Silver Sponsor`, `Bronze Friend`) and predates the 5-tier structure. If the
grid is ever re-enabled, add `Platinum` and `Community Partner` rows so it
matches the benefits table.

If those change, also update `<!-- BENEFITS TABLE -->` in `sponsor-us.html`
and the proposal PDF in `media/proposal/`.

## Adding a new sponsor logo

1. Drop the logo file in `media/sponsors/`. Prefer `.webp` or `.svg`. If you
   only have a `.png`, that works — keep it under ~150 KB.
2. Use a transparent background. The tile has a light card background and
   any white box around the logo will show.
3. In the appropriate tier's `.sponsor-grid`, replace one `.sponsor-ph` cell
   with:

   ```html
   <div class="sponsor-tile">
     <img src="media/sponsors/{filename}" alt="{Sponsor name}">
   </div>
   ```

   The `.sponsor-tile img` style applies a subtle grayscale-on-rest /
   full-color-on-hover treatment automatically.
4. If the tier fills up, copy a tile and add another column class — e.g.
   bump `sponsor-grid-3` to `sponsor-grid-4` only if you also update the
   responsive breakpoints in `css/shpe-design.css` (`@media` blocks at
   lines ~1611 and ~1646). The current breakpoints already collapse 3 and 4
   column grids to 2 and 1 column at smaller screens.

## Removing the tier system entirely

If the eboard ever decides to drop tiered sponsorships and just show a flat
list of partners, the markup simplifies to:

```html
<div class="sponsor-grid sponsor-grid-4">
  <div class="sponsor-tile"><img src="..." alt="..."></div>
  <div class="sponsor-tile"><img src="..." alt="..."></div>
  ...
</div>
```

In that case, also remove the **Benefits by tier** section below the grid,
since it would no longer match the offering.
