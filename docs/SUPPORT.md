# Support runbook

Common operational tasks and troubleshooting for whoever is running events
day-to-day, plus escalation guidance for problems that need a developer.

---

## Everyday tasks

### Find a specific attendee

**Admin → Registrations** → search box matches name, email, phone or
registration code. Filter by status (confirmed / pending payment /
cancelled) if you know it.

### Check someone in without scanning a QR code

**Admin → Check-in** → paste their registration code (or the QR token from
their ticket email/WhatsApp) into the manual-entry box instead of using the
camera. Works identically to a scan.

### Resend someone's ticket

**Admin → Registrations** → find them → expand the row → **Resend ticket
(WhatsApp)**. Requires `WHATSAPP_PHONE_NUMBER_ID`/`WHATSAPP_ACCESS_TOKEN` to
be configured (see below) — if not, the ticket link itself
(`https://<your-domain>/tickets/<qrToken>`) can be copied from **Admin →
Registrations** and sent manually by email or SMS. `qrToken` isn't shown in
the UI directly; the "Download PDF ticket" / "View ticket" links on the
attendee's own confirmation page carry it.

### Cancel a registration

**Admin → Registrations** → expand the row → **Cancel registration**. This
correctly releases whatever inventory it was holding (a pass reservation if
still pending payment, or a confirmed sale + event seat) — never cancel by
editing the database directly, or the pass/event capacity counts will drift.

### Manage who can access the admin dashboard

**Admin → Users & roles** (superadmin only). Three roles:

| Role | Can do |
|-----------------|--------------------------------------------------------|
| `superadmin` | Everything, including managing other users |
| `manager` | Everything except Users & Roles / Audit Log |
| `checkin_staff` | Only the Check-in scanner — nothing else, by design |

Use `checkin_staff` for event-day volunteers who shouldn't see attendee
payment details or be able to edit the event.

### Reset a user's password

**Admin → Users & roles** → the 🔑 icon on their row → enter a new password
(min. 8 characters). They'll need to be told the new password out of band —
there's no self-service "forgot password" flow yet.

**Locked out of the only superadmin account?** There's no in-app recovery
for that — it requires server access:

```bash
cd /opt/prashanth-events   # or wherever the repo is checked out
docker compose exec api npm run seed:admin
```

This is idempotent and **never overwrites an existing account's password**
— it only creates one if `ADMIN_BOOTSTRAP_EMAIL` doesn't already exist. To
actually reset a forgotten password from the server, drop into `mongosh`:

```bash
docker compose exec mongo mongosh prashanth_events
> db.users.updateOne({ email: "admin@yourdomain.com" }, { $set: { failedLoginAttempts: 0, lockedUntil: null } })
```

That clears a lockout; for a genuinely forgotten password, delete the user
document and re-run `npm run seed:admin` to recreate it from
`ADMIN_BOOTSTRAP_EMAIL`/`ADMIN_BOOTSTRAP_PASSWORD` in `backend/.env`.

---

## Restarting / redeploying

```bash
docker compose restart          # quick restart, keeps data
docker compose up --build -d    # rebuild after a code change, keeps data
docker compose ps               # check every service's health status
docker compose logs -f api      # tail the API's logs
```

Nothing here touches the `mongo_data` or `uploads_data` volumes — event
content, registrations and uploaded images all survive a restart or rebuild.

## Restoring from a backup

See [`docs/DEPLOYMENT.md`](DEPLOYMENT.md#backups) — `scripts/backup-mongo.sh`
creates the archives, and that section covers restoring one. **Practice a
restore before you need it**, not during an incident.

---

## Troubleshooting

**"Online payments are not configured yet" on the registration page** — this
is expected until `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` are set in
`backend/.env`. The registration itself still succeeds (`pending_payment`
status); the attendee sees a message that the team will follow up, and staff
can complete the payment offline and confirm it manually if needed (see
"manually confirming a payment" below), or just wait until real keys are
added — nothing is lost.

**WhatsApp tickets aren't sending** — check `WHATSAPP_PHONE_NUMBER_ID`/
`WHATSAPP_ACCESS_TOKEN` are set in `backend/.env`. Without them the platform
deliberately no-ops (logs a warning, never sends) rather than failing the
registration — check `docker compose logs api | grep WhatsApp` for the exact
reason if they *are* set and it's still not sending (commonly: the access
token expired, or the recipient is outside your WhatsApp Business account's
messaging window and needs an approved template, not a plain-text send).

**A payment succeeded in Razorpay but the registration is still
"pending_payment"** — Razorpay's webhook is the source of truth and can lag
a few seconds behind the checkout popup closing. If it's been longer than a
minute, check `docker compose logs api | grep webhook` for a signature or
processing error, and confirm the webhook URL registered in the Razorpay
dashboard matches `https://<your-domain>/api/v1/payments/webhook` with the
right `RAZORPAY_WEBHOOK_SECRET`.

**Admin login works locally but not on the deployed domain (CORS error)** —
`CORS_ORIGINS` in `backend/.env` (or the `environment:` block in
`docker-compose.yml`) must list the *exact* admin origin, e.g.
`https://admin.events.example.com` — no trailing slash, matching scheme.

**"This pass just sold out" but the numbers don't look right** — check
**Admin → Ticket Types** for the pass's sold/held counts. A `held` count
that isn't dropping usually means abandoned checkouts are still within their
`TICKET_HOLD_MINUTES` window (default 15) — they'll release automatically;
lower `TICKET_HOLD_MINUTES` in `backend/.env` if that's too generous for a
high-demand event.

**Uploaded images (speaker photos, sponsor logos) show broken after a
redeploy** — confirm the `uploads_data` Docker volume wasn't accidentally
removed (`docker compose down -v` deletes volumes; plain `docker compose
down` does not). Restore from the uploads backup if it was.

---

## When to escalate to a developer

- Anything that looks like it needs a database migration or schema change
- Data inconsistency that survives the troubleshooting steps above (e.g. an
  event's `registeredCount` visibly disagreeing with its actual confirmed
  registrations)
- Suspected security issue (unexpected admin account, unfamiliar audit log
  entries in **Admin → Audit Log**)
- Anything requiring a code change — new fields, new roles, new integrations
