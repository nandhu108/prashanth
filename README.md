# Prashanth Hospitals — Fertility & Gynaecology Event Management Platform

A complete digital platform for running Fertility & Gynaecology events: a premium
public microsite, registration and ticketing, payments, WhatsApp delivery,
event-day QR check-in, and an admin dashboard.

This repository is being delivered **module by module**. This is the state after
**Module 1**.

---

## Delivered so far

### ✅ Module 1 — Platform foundation + Premium Event Microsite

**Backend foundation**

- Express 4 API with a single `{ success, data }` response envelope
- MongoDB/Mongoose data layer: `Event` and `TicketType`
- Security: helmet, CORS allow-list, rate limiting, graceful shutdown
- Central error handling that never leaks internals in production
- Public serializer that keeps internal inventory counts off the wire
- Realistic seed data for a full CME summit

**Premium Event Microsite**

- Branded hero with live countdown, key facts and registration state
- About, speakers, agenda timeline, pass selection, venue + map, sponsors, FAQ
- SEO: meta tags, Open Graph / Twitter cards, `schema.org/Event` JSON-LD
- Campaign source capture (WhatsApp / Instagram / QR poster / direct)
- Share sheet with WhatsApp-first sharing
- Fully responsive, keyboard accessible, print-friendly agenda



### Upcoming modules


| #   | Module                    | Status   |
| --- | ------------------------- | -------- |
| 1   | Premium Event Microsite   | **Done** |
| 2   | Event CMS                 | **Done** |
| 3   | Registration Management   | **Done** |
| 4   | Ticketing & Pass Types    | **Done** |
| 5   | Promo Code Management     | **Done** |
| 6   | Payment Gateway           | **Done** |
| 7   | Digital Ticket & QR       | **Done** |
| 8   | WhatsApp Integration      | **Done** |
| 9   | Event-Day Check-in        | **Done** |
| 10  | Admin Dashboard           | **Done** |
| 11  | Reports & Export          | **Done** |
| 12  | Feedback & Certificates   | **Done** |
| 13  | Security & Access Control | **Done** |
| 14  | Deployment & Go-Live      | Next     |
| 15  | Support                   | Planned  |


---



## Tech stack


| Layer      | Technology                             |
| ---------- | -------------------------------------- |
| Frontend   | React 18, Vite, React Router           |
| Backend    | Node.js 18+, Express 4                 |
| Database   | MongoDB 7 (Mongoose 8)                 |
| Web server | NGINX (reverse proxy + static SPA)     |
| Styling    | CSS custom properties, no UI framework |


---



## Quick start



### Prerequisites

- Node.js 18 or newer
- MongoDB 7 running locally (or a connection string)



### 1. Backend

```bash
cd backend
cp .env.example .env          # edit MONGODB_URI if needed
npm install
npm run seed                  # loads the sample summit + 5 pass types
npm run dev                   # http://localhost:5000
```

Check it: `curl http://localhost:5000/api/v1/health`

### 2. Microsite

```bash
cd frontend-public
cp .env.example .env
npm install
npm run dev                   # http://localhost:5173
```

The dev server proxies `/api` to `localhost:5000`, so no CORS setup is needed.

Open **[http://localhost:5173](http://localhost:5173)** — the seeded summit loads at the root, and also at
`/events/fertility-gynaecology-summit-2026`.

### No MongoDB yet?

Front-end work does not need a database:

```bash
cd backend && npm run mock    # serves the real seed payload on :5000
```



### Docker

```bash
cp backend/.env.example backend/.env
docker compose up --build
docker compose exec api npm run seed
# microsite: http://localhost:8080
```

---



## Verifying the build

```bash
cd backend && npm run verify
```

Runs 35 checks over the models, virtuals, public serializer and HTTP layer —
including that internal inventory counts and non-public passes never reach the
browser. No database required.

```bash
cd frontend-public && npm run build
```

---



## Project layout

```
prashanth-events/
├── backend/
│   ├── src/
│   │   ├── config/          env + database connection
│   │   ├── models/          Event, TicketType
│   │   ├── controllers/     public event endpoints
│   │   ├── services/        public serializer (what leaves the API)
│   │   ├── routes/          API mounting, health check
│   │   ├── middleware/      error handling
│   │   ├── utils/           logger, ApiError, response envelope
│   │   ├── seed/            sample event data
│   │   └── dev/             mock API for DB-free frontend work
│   └── tests/verify.js      verification suite
│
├── frontend-public/
│   └── src/
│       ├── sections/        Hero, About, Speakers, Agenda, Tickets, Venue…
│       ├── components/      header, footer, sticky CTA, share sheet, UI kit
│       ├── lib/             api client, formatting, SEO, campaign tracking
│       ├── pages/           EventMicrosite
│       └── styles/          design tokens + global styles
│
├── nginx/                   production server config
├── docs/                    API reference, roadmap
└── docker-compose.yml
```

---



## Documentation

- `[docs/API.md](docs/API.md)` — endpoint reference
- `[docs/CONTENT-GUIDE.md](docs/CONTENT-GUIDE.md)` — what each microsite field controls
- `[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)` — production deployment
- `[docs/ROADMAP.md](docs/ROADMAP.md)` — module-by-module delivery plan

---

© Prashanth Hospitals. All rights reserved.