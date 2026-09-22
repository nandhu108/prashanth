# Delivery Roadmap

Modules are delivered one at a time. Each builds on what is already running, so
nothing is thrown away between stages.

---

## ✅ Module 1 — Platform foundation + Premium Event Microsite

**Delivered.**

| Scope item | Delivered |
|------------------------------|-----------|
| Branded landing page | ✅ Hero, countdown, brand theming |
| Responsive design | ✅ Verified at 390px and 1380px |
| Event info, speakers, agenda, venue, map | ✅ All sections |
| SEO & social sharing | ✅ Meta, OG/Twitter, JSON-LD, share sheet |

Plus the platform foundation everything else needs: data models, API envelope,
error handling, security middleware, campaign attribution, deployment config.

**Data models:** `Event` (with speakers, agenda, sponsors, FAQs, announcements,
venue, SEO, theme), `TicketType` (pricing, tax, allocation, sales window).

---

## Module 2 — Event CMS

Admin UI to manage everything the microsite renders, with no developer involved.

- Admin authentication (JWT) and the `Admin` user model
- Event create/edit/publish with live preview
- Manage speakers, agenda days and items, sponsors, FAQs
- Announcement banners with scheduling
- Image upload for speaker photos, sponsor logos, hero and OG images
- Draft → published → closed lifecycle

**Depends on:** Module 1 models.
**Unblocks:** everything else — content must be editable before a real event runs.

---

## Module 3 — Registration Management

- Public registration form (name, mobile, email, hospital/organisation, type)
- Configurable custom fields per event
- Participant categorisation (Consultant / PG Student / Allied / Guest)
- Duplicate detection on mobile + email
- Capacity enforcement against `Event.capacity`
- Campaign source persisted from Module 1's attribution
- Admin list, search, filter and manual entry

**Depends on:** Modules 1–2.

---

## Module 4 — Ticketing & Pass Types

- Admin CRUD for pass types (the model already exists)
- Inventory holds during checkout so two people cannot take the last seat
- Per-pass rules: min/max per order, participant-type restriction, sales window
- Couple/duo passes issuing multiple attendee records
- Complimentary pass issuance

**Depends on:** Modules 1–3.

---

## Module 5 — Promo Code Management

- Fixed and percentage discounts
- Usage limits (total and per-person), validity window
- Pass-specific and category-specific rules
- Admin creation and redemption reporting

**Depends on:** Module 4.

---

## Module 6 — Payment Gateway

- Razorpay order creation and checkout
- UPI, cards, net banking
- Signature-verified webhooks (NGINX route already reserved)
- Payment records, reconciliation, idempotent retry handling
- Refund support

**Depends on:** Modules 3–5. **Security-critical.**

---

## Module 7 — Digital Ticket & QR

- Unique, signed QR payload per attendee (tamper-resistant)
- Branded ticket with registration ID and ticket number
- PDF/image download
- Regeneration and revocation

**Depends on:** Modules 3–4, 6.

---

## Module 8 — WhatsApp Integration

- WhatsApp Business API (Meta) integration
- Registration confirmation with the QR ticket
- Automated reminders (T-7, T-1, event morning)
- Agenda and announcement broadcasts
- Post-event feedback and certificate delivery
- Delivery status tracking and retry

**Depends on:** Module 7. Needs an approved Meta Business account and message templates.

---

## Module 9 — Event-Day Check-in

- Mobile/tablet QR scanner (camera-based, works on a plain browser)
- Real-time validation against the signed payload
- Duplicate check-in prevention
- Offline-tolerant queue for patchy venue Wi-Fi
- Live attendance counter

**Depends on:** Module 7.

---

## Module 10 — Admin Dashboard

- Real-time registration, payment and check-in analytics
- Campaign source attribution (fed by Module 1's tracking)
- Pass-wise and category-wise breakdowns
- Revenue and reconciliation summary

**Depends on:** Modules 3, 6, 9.

---

## Module 11 — Reports & Export

- Registration, payment and attendance reports
- Excel/CSV export
- Payment reconciliation report
- Scheduled report delivery

**Depends on:** Module 10.

---

## Module 12 — Feedback & Certificates

- Custom feedback forms with ratings
- Certificate generation from a branded template
- WhatsApp/email delivery
- Feedback analytics; data retained for future campaigns

**Depends on:** Modules 8–9 (certificates require verified attendance).

---

## Module 13 — Security & Access Control

- Role-based access (Super Admin / Event Manager / Check-in Staff / Viewer)
- Audit logs on every admin action
- API hardening and data protection review
- Webhook signature enforcement
- Backup and monitoring

Runs as a hardening pass once the surface area is complete.

---

## Module 14 — Deployment & Go-Live

- Cloud provisioning, NGINX + SSL + domain (configs delivered in Module 1)
- Production environment configuration
- Load testing against expected delegate volume
- Staged rollout and go-live checklist

---

## Module 15 — Support

- 3 months premium support
- Bug fixes and issue resolution
- Guidance for running future events

---

## Third-party accounts to arrange

These need lead time — worth starting before the module that consumes them:

| Service | Needed by | Lead time |
|-------------------------|-----------|--------------------|
| Razorpay merchant account | Module 6 | 3–7 days (KYC) |
| WhatsApp Business API (Meta) | Module 8 | 1–3 weeks (verification + template approval) |
| Cloud hosting (AWS/equivalent) | Module 14 | Immediate |
| Domain + SSL | Module 14 | 1–2 days |
| Transactional email provider | Module 8 | 1 day |
| Google Maps API key | Live now | Immediate |

**The WhatsApp Business API is the longest pole.** Business verification and
message-template approval can take weeks, so it is worth starting that process
now rather than at Module 8.

---

## Out of scope

As agreed: marketing campaign execution, content writing and creative design,
WhatsApp/payment gateway transaction charges, event hardware (devices, tablets),
on-site event staff, event photography and video production.
