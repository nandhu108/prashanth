# Deployment Guide

Docker is the standard way to run this platform, in every environment from a
laptop to production — the same `docker-compose.yml` that runs locally is
what runs on the server, so "works on my machine" isn't a category of bug
here. This guide covers the full stack (mongo, api, web, admin) as built
through Module 14.

---

## Target architecture

```
                     ┌──────────────┐
    Delegates  ──►   │  Caddy/NGINX │  :443  TLS termination (host-level,
                     │  (reverse    │        outside Docker — see §4)
                     │   proxy)     │
                     └──────┬───────┘
                            │
              ┌─────────────┼─────────────┬──────────────┐
              │             │             │              │
        ┌─────▼────┐  ┌─────▼────┐  ┌─────▼────┐   ┌─────▼────┐
        │   web    │  │  admin   │  │   api    │   │  mongo   │
        │ (NGINX,  │  │ (NGINX,  │  │(Node 20) │   │ (mongo:7)│
        │  SPA)    │  │  SPA)    │  │  :5000   │   │  :27017  │
        │  :80     │  │  :80     │  │(internal)│   │(internal)│
        └──────────┘  └──────────┘  └────┬─────┘   └────┬─────┘
                                          └──────────────┘
```

`api` and `mongo` are never published to the host in production (drop their
`ports:` mappings — see the prod override below); only `web` and `admin` are
reachable, and only through the host reverse proxy that terminates TLS.

---

## 1. Server preparation

Any host with Docker + Docker Compose v2 works — a 2 vCPU / 4 GB VM is
comfortable for a few thousand delegates.

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # log out/in once for this to take effect
docker compose version          # confirm v2 is available
```

### Firewall

Only 80/443 (for the reverse proxy) and SSH need to be open — everything
else stays on Docker's internal network.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80,443/tcp
sudo ufw enable
```

---

## 2. Configure and start the stack

```bash
sudo mkdir -p /opt/prashanth-events
sudo chown -R $USER:$USER /opt/prashanth-events
cd /opt/prashanth-events
git clone <this-repo> .

cp backend/.env.example backend/.env
nano backend/.env
```

Production `backend/.env` — see `backend/.env.example` for the full list;
the ones that matter for go-live:

```ini
NODE_ENV=production
MONGODB_URI=mongodb://mongo:27017/prashanth_events   # unchanged — internal service name
PUBLIC_SITE_URL=https://events.example.com
API_BASE_URL=https://events.example.com
ADMIN_SITE_URL=https://admin.events.example.com

# Generate a real secret: openssl rand -hex 32
JWT_SECRET=<generate-a-real-secret>
JWT_EXPIRES_IN=7d

ADMIN_BOOTSTRAP_EMAIL=admin@yourdomain.com
ADMIN_BOOTSTRAP_PASSWORD=<set-a-strong-one-time-password>

# Module 6 — leave blank until you have real Razorpay keys; payments
# degrade gracefully (a clear "not configured" message) until then.
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Module 8 — same dev-safe degradation without these.
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
```

> `PUBLIC_SITE_URL` must be the real HTTPS domain — canonical URLs, QR
> codes, WhatsApp ticket links and social share previews are all built
> from it.

Update `docker-compose.yml`'s `api`/`web`/`admin` `environment:` blocks (or
switch them to read from `backend/.env` via `env_file`, as `api` already
does) so `PUBLIC_SITE_URL`/`API_BASE_URL`/`ADMIN_SITE_URL`/`CORS_ORIGINS`
match your real domains instead of the `localhost` defaults meant for local
dev.

```bash
docker compose up --build -d
docker compose exec api npm run seed         # sample event — skip or edit for a real one
docker compose exec api npm run seed:admin   # bootstraps the first superadmin
```

Verify: `curl http://127.0.0.1:8080/api/v1/health` → `"database": "connected"`.

---

## 3. TLS via a host-level reverse proxy

Since `web` and `admin` are plain NGINX containers serving HTTP, put a TLS
terminator in front. **Caddy** is the simplest option — automatic
Let's Encrypt certificates, no manual certbot timers to manage.

Install Caddy on the host (not in Docker, so it can bind 80/443 directly and
survive `docker compose down`):

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy
```

`/etc/caddy/Caddyfile` — replace both domains with your real ones:

```caddyfile
events.example.com {
    reverse_proxy localhost:8080
}

admin.events.example.com {
    reverse_proxy localhost:8082
}
```

```bash
sudo systemctl reload caddy
```

That's it — Caddy issues and renews certificates automatically the first
time each domain is requested. Point both domains' DNS `A` records at the
server before reloading.

**Alternative — NGINX + certbot:** if you'd rather use the host NGINX config
already in this repo (`nginx/prashanth-events.conf`), point its
`proxy_pass` at `http://127.0.0.1:8080` (and add an equivalent server block
proxying to `:8082` for admin), then run
`sudo certbot --nginx -d events.example.com -d admin.events.example.com`.

---

## 4. Lock down the compose file for production

The default `docker-compose.yml` publishes `mongo:27017` to the host for
local convenience — **remove that in production** along with any direct
public exposure of `api`. Either edit the file directly or layer an
override:

```yaml
# docker-compose.prod.yml
services:
  mongo:
    ports: []   # no longer published to the host
```

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

`api` already has no `ports:` mapping (only `expose: ['5000']`, internal to
the compose network) — nothing to change there.

---

## 5. Post-deployment checks

```bash
curl -I  https://events.example.com                  # 200, HSTS present (Caddy sets this by default)
curl -s  https://events.example.com/api/v1/health
curl -I  https://admin.events.example.com
```

Then in a browser:

- [ ] Microsite loads and all sections render; deep link `/events/<slug>` works on a hard refresh
- [ ] Admin login works at the admin domain; superadmin can reach every nav item
- [ ] A `checkin_staff` test account is correctly restricted to Check-in only
- [ ] Registration → (test-mode) payment → ticket → certificate flow works end to end
- [ ] Share the microsite URL in WhatsApp — the preview card shows title/description/image
- [ ] Check an invalid slug returns "Event not found", not a blank screen
- [ ] Test on a real phone, not just a resized browser window

Validate structured data at
[search.google.com/test/rich-results](https://search.google.com/test/rich-results).

---

## Updating a deployment

```bash
cd /opt/prashanth-events
git pull
docker compose up --build -d   # rebuilds only what changed; healthchecks gate the swap
```

No manual `rsync` or `pm2 reload` — Compose recreates each container from
its fresh image and the built-in healthchecks (`api`'s `/health`, `mongo`'s
`ping`) keep the old container up until the new one is actually ready.

---

## Backups

`scripts/backup-mongo.sh` wraps `docker compose exec mongo mongodump` —
run it directly or on a cron:

```bash
echo "0 2 * * * cd /opt/prashanth-events && ./scripts/backup-mongo.sh >> /var/log/prashanth-backup.log 2>&1" | sudo tee /etc/cron.d/prashanth-backup
```

Copy backups off the server too — a local-only backup does not survive
losing the instance. **Test a restore before go-live**, not after an
incident:

```bash
gunzip -c backups/events-2026-11-01.gz | docker compose exec -T mongo mongorestore --archive
```

The `uploads_data` Docker volume (event/speaker/sponsor images from the
CMS) needs its own backup too — `docker run --rm -v prashanth-events_uploads_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/uploads-$(date +%F).tar.gz -C /data .`

---

## Monitoring

```bash
docker compose logs -f api
docker compose ps               # healthcheck status for every service
```

Point an uptime monitor at `https://events.example.com/api/v1/health` — it
reports database connectivity, so it catches a dropped Mongo connection
even while the reverse proxy still serves the static page.

---

## Notes on third-party integrations

- **Payments (Module 6):** the app runs fully without Razorpay keys — order
  creation returns a clear "not configured" message instead of erroring.
  Once you have real keys, also register the webhook URL
  (`https://events.example.com/api/v1/payments/webhook`) in the Razorpay
  dashboard and set `RAZORPAY_WEBHOOK_SECRET` to match.
- **WhatsApp (Module 8):** same dev-safe degradation. Sends are logged, not
  sent, until `WHATSAPP_PHONE_NUMBER_ID`/`WHATSAPP_ACCESS_TOKEN` are set.
- **Uploads (Module 2):** stored in the `uploads_data` Docker volume, served
  by the `api` container at `/uploads` and proxied by `web`/`admin`'s NGINX
  configs. Back it up alongside the database (see above).
- **Scaling:** the API is stateless (all state is in Mongo), so for a large
  event you can run more than one `api` replica behind the reverse proxy
  without any code changes — `docker compose up -d --scale api=3` plus a
  reverse-proxy upstream pointing at all three.
