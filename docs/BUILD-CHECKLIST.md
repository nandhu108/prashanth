# Build checklist — Modules 2–15

Live tracker for the full platform build-out. Checked items are done, built,
and verified (docker rebuild + `tests/verify.js` + manual/curl smoke, and
Playwright screenshots for UI-heavy modules). See
`README.md` for the module summary table and `docs/API.md` for the endpoint
reference as it grows.

## Foundation — Auth & RBAC ✅
- [x] `User` model + `bcryptjs`/`jsonwebtoken` utils + `requireAuth`/`requireRole` middleware
- [x] `POST /api/v1/admin/auth/login` (rate-limited + lockout), `GET /api/v1/admin/auth/me`
- [x] `seed/seedAdmin.js` idempotent superadmin bootstrap
- [x] `frontend-admin/` app scaffold (Vite, Router, AuthContext, ProtectedRoute, shell layout, Login page)
- [x] `frontend-admin` Dockerfile + nginx conf; `admin` service added to docker-compose.yml
- [x] `tests/verify.js` §Auth (41/41 passing)

Verified: full stack up via `docker compose up --build -d` (mongo/api/web/admin all
healthy), `npm run seed:admin` bootstraps superadmin, login → `/me` round-trips a
JWT end-to-end through NGINX on port 8082, wrong password / missing token / bad
token all correctly rejected. Playwright screenshots (desktop + mobile, incl. the
mobile nav drawer) confirm the premium split-screen login and sidebar shell with
zero console errors. Role-gated nav items (`Users & roles`, `Audit log`) only
render for `superadmin`.

## Module 2 — Event CMS ✅
- [x] Admin CRUD for Event (details, venue, theme, seo, organizer, contact)
- [x] Sub-resource CRUD: speakers, agenda days/items, sponsors, faqs, announcements
- [x] Image upload (multer → `/uploads`, static-served, 5MB limit, image-only)
- [x] `frontend-admin` Event Editor (8-tab UI: Details, Venue & Contact, Theme &
      SEO, Speakers, Agenda, Sponsors, FAQ, Announcements)
- [x] Verified in Docker + screenshots

Verified: logged in as superadmin, edited the tagline through the Details tab
and confirmed the change round-tripped to the public microsite's `/public/events/:slug`
payload live; replaced the FAQ array via the CMS and confirmed it too. Ran the
full 8-tab editor against the real seeded event (6 speakers, nested
day→session agenda, 5 sponsors) via Playwright — all tabs render real data
correctly, the nested agenda editor (days containing sessions) works, and
Save round-trips through PATCH/PUT correctly. Found and fixed one real bug
during review: `ImageUploadField` rendered a blank white box instead of the
neutral placeholder icon when a stored image URL 404s (e.g. the seed data's
placeholder `/assets/logo-prashanth.svg`) — switched from a CSS
background-image to an `<img onError>` with a broken-state fallback.
`checkin_staff` role is correctly excluded from all `/admin/events/*` routes
(manager+ only). Re-seeded after testing to restore the original demo content.

## Module 4 — Ticketing & Pass Types ✅
- [x] Admin CRUD for TicketType (create/update/delete, manager+ only)
- [x] `frontend-admin` Ticket Types page (live sold/held/available inventory)
- [x] Verified

Verified: edited the Regular pass's price live against the real seeded event
(118 sold / 0 held / 132 available correctly computed from real inventory
fields), saved, confirmed via screenshot, re-seeded to restore. Delete is
blocked server-side once `quantitySold > 0` (409 conflict) — deactivate
instead of delete once a pass has sales. `tests/verify.js` extended with
route-guard checks (52/52 passing). Zero console errors.

## Module 5 — Promo Code Management
- [ ] PromoCode model + admin CRUD
- [ ] Public `POST /api/v1/promo/validate`
- [ ] `frontend-admin` Promo Codes page
- [ ] Verified

## Module 3 — Registration Management
- [ ] Inventory hold/release service (`services/inventory.js`)
- [ ] Public `POST /api/v1/registrations`
- [ ] Admin registration list/search/filter/detail/cancel/resend
- [ ] `frontend-public` real registration form (replaces placeholder route)
- [ ] `frontend-admin` Registrations page
- [ ] Verified

## Module 6 — Payment Gateway
- [ ] Razorpay order creation, signature verify, webhook (idempotent)
- [ ] Inventory hold→sold commit on payment confirm
- [ ] `frontend-public` checkout step (Razorpay Checkout.js)
- [ ] Verified (HMAC fixtures now; real test-mode charge once keys supplied)

## Module 7 — Digital Ticket & QR
- [ ] QR token generation, `utils/ticketPdf.js` (pdfkit)
- [ ] `GET /api/v1/tickets/:qrToken` + `/pdf`
- [ ] `frontend-public` Ticket page
- [ ] Verified

## Module 8 — WhatsApp Integration
- [ ] Meta Cloud API client (dev-safe no-op without credentials)
- [ ] Send ticket confirmation on payment/free-registration confirm
- [ ] Admin manual resend endpoint
- [ ] Verified (log-based, real send once keys supplied)

## Module 9 — Event-Day Check-in
- [ ] `POST /api/v1/admin/checkin/scan`, stats endpoint
- [ ] `frontend-admin` Check-in scanner page (camera + manual)
- [ ] Verified

## Module 10 — Admin Dashboard
- [ ] Overview page (stat tiles + charts)
- [ ] Users/role management (superadmin only)
- [ ] Full nav shell polish across all admin pages
- [ ] Verified + screenshots

## Module 11 — Reports & Export
- [ ] Aggregation endpoint + CSV export utility
- [ ] `frontend-admin` Reports page
- [ ] Verified

## Module 12 — Feedback & Certificates
- [ ] Feedback model + public submit endpoint
- [ ] On-the-fly certificate PDF (`/tickets/:qrToken/certificate.pdf`)
- [ ] `frontend-public` Feedback page; `frontend-admin` Feedback page
- [ ] Verified

## Module 13 — Security & Access Control
- [ ] AuditLog model + `recordAudit()` wired into admin mutations
- [ ] Login lockout verified; CORS admin origin added
- [ ] `frontend-admin` Audit Log page
- [ ] Role matrix documented in `docs/API.md`

## Module 14 — Deployment & Go-Live
- [ ] docker-compose finalized (mongo/api/web/admin + uploads volume)
- [ ] GitHub Actions CI (`verify` + builds)
- [ ] `scripts/backup-mongo.sh`
- [ ] `docs/DEPLOYMENT.md` updated

## Module 15 — Support
- [ ] `docs/SUPPORT.md` ops runbook + staff FAQ
- [ ] `frontend-admin` Help page

## Final demo
- [ ] Full click-through: register → pay → ticket → check-in → certificate → reports, screenshots captured
