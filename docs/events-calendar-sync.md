# Syncing the Events List with the Google Calendar

## Current state

The Events page (`events.html`) shows two things:

1. **A "Full Calendar" iframe** (line ~120) — a Google Calendar **embed**. This is just a webpage Google hosts that displays the public calendar. It does **not** expose event data to our JS. No API key is involved.
2. **A list of upcoming event cards** above the calendar — currently commented out. These were hardcoded sample data.

The goal of this doc is to replace the commented-out sample list with the next ~4 upcoming events pulled live from the same Google Calendar that the iframe shows, so the eboard only has to update one place (the calendar).

## Why this needs a real API key

The iframe and the Calendar **API** are two different Google products:

| | Iframe embed | Calendar API v3 |
|---|---|---|
| Purpose | Display a calendar UI on a webpage | Read/write event data as JSON |
| Auth required | None (calendar must be public) | API key (or OAuth for private data) |
| Used by | Our `<iframe>` today | The future events list sync |

So although the calendar is already public, an API key still has to be created before our JS can fetch events.

## Calendar identifiers

- **Calendar ID (raw):** `th896657cd2kgadh54h10ses3c@group.calendar.google.com`
- **Calendar ID (base64, used in the iframe `src`):** `dGg4OTY2NTdjZDJrZ2FkaDU0aDEwc2VzM2NAZ3JvdXAuY2FsZW5kYXIuZ29vZ2xlLmNvbQ`
- **Public "Add to calendar" link:** the `Sync Calendar` button in `events.html`

The API uses the **raw** form (URL-encode the `@` to `%40`).

## Step 1 — Create the API key

1. Go to https://console.cloud.google.com → create or pick a project (free).
2. **APIs & Services → Library** → search "Google Calendar API" → **Enable**.
3. **APIs & Services → Credentials** → **Create credentials → API key**.
4. Click the new key → **Edit API key**, and lock it down:
   - **Application restrictions:** HTTP referrers. Add the production domain(s) the site is served from, e.g. `https://sbushpe.github.io/*`, `https://www.stonybrookshpe.org/*`, plus `http://localhost:*/*` for local testing.
   - **API restrictions:** "Restrict key" → select **Google Calendar API** only.
5. Save the key string somewhere durable. It is OK to commit a properly-restricted key to a public repo — the referrer restriction is what keeps it from being abused.

## Step 2 — The fetch URL

```
https://www.googleapis.com/calendar/v3/calendars/{CALENDAR_ID}/events?key={API_KEY}&timeMin={NOW_ISO}&singleEvents=true&orderBy=startTime&maxResults=4
```

For our calendar, `{CALENDAR_ID}` is `th896657cd2kgadh54h10ses3c%40group.calendar.google.com`.

`singleEvents=true` expands recurring events into individual instances; `orderBy=startTime` requires it.

Sample response (trimmed):

```json
{
  "items": [
    {
      "summary": "General Body Meeting",
      "location": "Javits 110",
      "start": { "dateTime": "2026-05-04T20:00:00-04:00" },
      "end":   { "dateTime": "2026-05-04T21:00:00-04:00" },
      "description": "..."
    }
  ]
}
```

For all-day events, `start.date` (no time) appears instead of `start.dateTime`.

## Step 3 — Wire it into the markup

The existing CSS classes to reuse for each card:

```html
<div class="event-row reveal reveal-N">
  <div class="event-date">
    <div class="event-m">OCT</div>
    <div class="event-d">28</div>
  </div>
  <div class="event-body">
    <div class="event-title">{summary}</div>
    <div class="event-where">{location} · {time}</div>
  </div>
  <div class="event-tag">{tag}</div>
  <a class="event-rsvp" href="contact-us.html">RSVP <span>→</span></a>
</div>
```

Container: `<div class="events-list" id="events-list">` already exists on `events.html`.

Suggested structure for the future `js/events-sync.js`:

```js
const CALENDAR_ID = "th896657cd2kgadh54h10ses3c%40group.calendar.google.com";
const API_KEY     = "<paste from step 1>";

async function loadEvents() {
  const now = new Date().toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events`
            + `?key=${API_KEY}&timeMin=${now}&singleEvents=true&orderBy=startTime&maxResults=4`;

  const res  = await fetch(url);
  const data = await res.json();

  const list = document.getElementById("events-list");
  list.innerHTML = data.items.map(renderEventRow).join("");
}

function renderEventRow(ev, i) {
  const start = new Date(ev.start.dateTime || ev.start.date);
  const month = start.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day   = String(start.getDate()).padStart(2, "0");
  const time  = ev.start.dateTime
    ? start.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" })
    : "All day";

  // Pull the tag from the calendar entry. Easiest convention: prefix the event
  // title in Google Calendar with `[Tag]` (e.g. "[GBM] General Body Meeting"),
  // or store it in the event's `description` as `tag: GBM`.
  const tag = parseTag(ev.summary) ?? "Event";

  return `
    <div class="event-row reveal reveal-${(i % 4) + 1}">
      <div class="event-date">
        <div class="event-m">${month}</div>
        <div class="event-d">${day}</div>
      </div>
      <div class="event-body">
        <div class="event-title">${escapeHtml(stripTag(ev.summary))}</div>
        <div class="event-where">${escapeHtml(ev.location ?? "TBA")} · ${time}</div>
      </div>
      <div class="event-tag">${escapeHtml(tag)}</div>
      <a class="event-rsvp" href="contact-us.html">RSVP <span>→</span></a>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", loadEvents);
```

Then add `<script src="js/events-sync.js" defer></script>` to `events.html` and remove the commented-out sample rows.

## Step 4 — Theming notes

- The new rows reuse the **same** `event-row`, `event-date`, `event-body`, `event-tag`, and `event-rsvp` classes already styled in `css/events.css` and `css/shpe-design.css`, so no CSS changes are needed for layout.
- The `reveal reveal-1..4` classes drive the scroll-in animation; cycling them per card (`(i % 4) + 1`) keeps the staggered effect.
- If we ever want category-specific colors for the `event-tag` (GBM vs. Outreach vs. Social), add modifier classes in CSS (e.g. `.event-tag.event-tag-gbm`) and select them in `parseTag` based on the prefix.

## Conventions for the eboard updating the calendar

For the JS to render clean cards, the calendar entries should follow a small convention:

- **Title:** start with a bracketed tag, then the event name. Example: `[GBM] General Body Meeting`, `[Professional] Resume Workshop with Lockheed Martin`, `[Social] Familia Dinner`, `[Outreach] Noche de Ciencias`.
- **Location:** put the actual room/building in the calendar entry's location field, not in the description. The card uses this directly.
- **Time:** the card shows the start time; it comes from the event's start time automatically.

If a tag is missing, the card falls back to "Event".

## Failure modes to handle in the JS

- **API key invalid / quota exceeded** → `fetch` returns 403. The script should hide the `#events-list` container or show a small "Check our calendar below" message rather than leaving an empty list.
- **No upcoming events** → render a single placeholder row pointing at the calendar.
- **Network offline** → same fallback as above.

## TL;DR for whoever picks this up

1. Get the API key (step 1).
2. Create `js/events-sync.js` from the snippet above with the key pasted in.
3. In `events.html`, delete the commented-out sample rows inside `#events-list` and add the `<script src="js/events-sync.js" defer>`.
4. Tell the eboard to prefix calendar titles with `[Tag]`.
