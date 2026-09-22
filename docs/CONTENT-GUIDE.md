# Content Guide — what each field controls

For whoever sets up an event. Until the CMS lands (Module 2), these fields are
edited in `backend/src/seed/seedEvent.js`.

---

## Event basics

| Field | Appears | Notes |
|-------|---------|-------|
| `title` | Hero headline, browser tab, all share previews | Keep under ~60 characters so it doesn't wrap awkwardly on a phone |
| `tagline` | Under the headline | One line. The "why attend" hook |
| `summary` | Fallback meta description, listing cards | 1–2 sentences, under 200 characters |
| `description` | About section | Separate paragraphs with a **blank line**. Plain text |
| `highlights` | Hero chips + "What's included" card | 4–6 short items. The first 4 show in the hero |
| `category` | Hero badge | `cme`, `conference`, `workshop`, `awareness-camp`, `public-seminar` |
| `mode` | Hero badge, venue section | `in-person`, `virtual`, `hybrid`. Virtual events hide the venue and show the joining panel instead |

### Status

| Status | Effect |
|--------|--------|
| `draft` | Returns 404 publicly. Safe for work in progress |
| `published` | Live |
| `registration-closed` | Page visible, registration buttons disabled |
| `completed` / `cancelled` | Page visible with the matching state shown |

---

## Dates and capacity

`startDate` / `endDate` drive the hero date line, the countdown and the agenda
heading. Times are displayed in **Asia/Kolkata** regardless of the viewer's
timezone.

`registrationOpensAt` / `registrationClosesAt` are optional. When set, the site
automatically shows "Registration Opens Soon" or "Registration Closed" at the
right moments — nobody has to remember to flip a switch.

`capacity` of `0` means unlimited. Otherwise, once `registeredCount` reaches it,
the page switches to "Sold Out" on its own. Below 25 seats the badge turns into
a "Only N seats left" nudge.

---

## Speakers

| Field | Notes |
|-------|-------|
| `name` | Include the "Dr." prefix |
| `credentials` | e.g. `MBBS, MD (OBG), FRCOG`. Shown in small caps under the name |
| `designation` / `organization` | Role line |
| `topic` | Highlighted in a tinted box — this is what delegates scan for |
| `bio` | Clamped to 3 lines with a "Read more" toggle. Up to ~1500 characters |
| `photoUrl` | Optional. Without it, a branded initials avatar is generated |
| `isKeynote` | Adds a "Keynote" ribbon and tints the card |
| `order` | Controls display order. Lower numbers first |

**Photos:** square, at least 400×400px, face centred.

---

## Agenda

Grouped by day. A single-day event shows the date inline; multi-day events get
day tabs automatically.

| Field | Notes |
|-------|-------|
| `startTime` / `endTime` | 24-hour `"14:30"`. Displayed as `2:30 PM` |
| `title` | The session name |
| `description` | Optional one-liner |
| `speakerNames` | Free text array — must match the speaker names you typed |
| `track` | Room or hall, e.g. `Main Hall`, `Skills Lab` |
| `type` | Styles the row — see below |
| `order` | Sort order within the day |

**Types:** `keynote` (rose highlight), `panel`, `workshop` (teal), `session`
(default), and the muted ones — `break`, `registration`, `networking` — which
are deliberately de-emphasised so the clinical content stands out.

---

## Passes (ticket types)

| Field | Notes |
|-------|-------|
| `name` | e.g. `Delegate — Regular` |
| `code` | Short unique code (`REG`, `VIP`). Used in the registration URL |
| `price` | In rupees, **excluding** tax |
| `taxPercent` | e.g. `18`. The site shows both the base price and the GST-inclusive total |
| `admitsCount` | `2` for a couple/duo pass |
| `benefits` | Bulleted list. 4–6 items reads best |
| `quantityTotal` | `0` = unlimited. Otherwise drives "Only a few left" and sold-out |
| `maxPerOrder` | Cap per registration |
| `allowedParticipantTypes` | Restricts the pass, e.g. `["PG Student"]`. Shows an ID-required note |
| `isPubliclyVisible` | **`false` hides it entirely** — use for complimentary faculty passes |
| `kind` | `vip` gets the "Premium" ribbon; `couple` gets "Best value"; `free`/`complimentary` show as Free |
| `order` | Left-to-right order |

Exact remaining counts are never sent to the browser — only "Only a few left"
(at 10 or fewer) and sold-out.

---

## Venue

`mapEmbedUrl` must be a Google Maps **embed** URL:

```
https://www.google.com/maps?q=<place+name>&output=embed
```

`mapLink` is the normal Maps link behind the "Open in Maps" button.
`landmark` and `parkingInfo` are optional but reduce day-of phone calls.

---

## FAQ

Order them by how often they're actually asked — the first one opens by default.
The six seeded questions (who should attend, CME credits, how the ticket
arrives, bringing a colleague, refunds, accommodation) cover most enquiries.

---

## Announcements

Shown as a dismissible bar above the header.

| Field | Notes |
|-------|-------|
| `message` | One sentence |
| `level` | `info` (navy), `warning` (rose), `success` (green) |
| `isActive` | Switch off without deleting |
| `expiresAt` | Auto-hides itself — set it and forget it |

Only the first active announcement displays, so the top of the page never gets
cluttered.

---

## SEO and sharing

| Field | Notes |
|-------|-------|
| `metaTitle` | Under 60 characters. Falls back to `<title> | Prashanth Hospitals` |
| `metaDescription` | 150–160 characters. Falls back to `summary` |
| `keywords` | Modest relevance benefit; harmless |
| `ogImageUrl` | **Most important for WhatsApp.** 1200×630px |
| `noIndex` | `true` keeps the page out of search — useful for private/invite-only events |

The `schema.org/Event` structured data is generated automatically from the event
dates, venue and organiser, so Google can show rich event results without extra work.

### Campaign links

Tag every channel so the dashboard can attribute registrations:

| Channel | Link |
|---------|------|
| WhatsApp | `…/events/<slug>?utm_source=whatsapp&utm_campaign=<name>` |
| Instagram | `…/events/<slug>?utm_source=instagram&utm_campaign=<name>` |
| QR poster | `…/events/<slug>?src=qr-poster` |
| Email | `…/events/<slug>?utm_source=email` |

First touch wins: if someone scans the poster and later opens a WhatsApp
reminder, the poster keeps the credit.

---

## Contact

`whatsapp` should be in international format (`+919840012345`) — it becomes a
`wa.me` click-to-chat link in the FAQ section.
