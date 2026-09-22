# Deployment Guide

Production deployment for the Module 1 platform. Full go-live hardening is
Module 14; this gets a working, secured environment running now.

---

## Target architecture

```
                     ┌──────────────┐
    Delegates  ──►   │    NGINX     │  :443  TLS termination
                     │              │        static SPA + reverse proxy
                     └──────┬───────┘
                            │ /api/*
                     ┌──────▼───────┐
                     │  Node/Express│  :5000 (localhost only)
                     └──────┬───────┘
                            │
                     ┌──────▼───────┐
                     │   MongoDB    │  :27017 (localhost only)
                     └──────────────┘
```

Neither Node nor MongoDB should be reachable from the internet — only NGINX.

---

## 1. Server preparation

Ubuntu 22.04 LTS, 2 vCPU / 4 GB RAM is comfortable for a few thousand delegates.

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx
sudo npm install -g pm2
```

### MongoDB

```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update && sudo apt install -y mongodb-org
sudo systemctl enable --now mongod
```

Confirm `/etc/mongod.conf` binds to localhost only:

```yaml
net:
  port: 27017
  bindIp: 127.0.0.1
```

**Enable authentication before go-live:**

```bash
mongosh
> use admin
> db.createUser({ user: "phAdmin", pwd: "<strong-password>",
                  roles: [{ role: "userAdminAnyDatabase", db: "admin" }] })
> use prashanth_events
> db.createUser({ user: "phEvents", pwd: "<strong-password>",
                  roles: [{ role: "readWrite", db: "prashanth_events" }] })
```

Then set `security.authorization: enabled` in `mongod.conf`, restart, and use:

```
MONGODB_URI=mongodb://phEvents:<password>@127.0.0.1:27017/prashanth_events
```

### Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable        # 5000 and 27017 stay closed
```

---

## 2. Deploy the API

```bash
sudo mkdir -p /var/www/prashanth-events
sudo chown -R $USER:$USER /var/www/prashanth-events
cd /var/www/prashanth-events

# copy or clone the repository here
cd backend
npm ci --omit=dev
cp .env.example .env
nano .env
```

Production `.env`:

```ini
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://phEvents:<password>@127.0.0.1:27017/prashanth_events
PUBLIC_SITE_URL=https://events.prashanthhospitals.com
API_BASE_URL=https://events.prashanthhospitals.com
CORS_ORIGINS=https://events.prashanthhospitals.com
RATE_LIMIT_WINDOW_MINUTES=15
RATE_LIMIT_MAX=300
```

> `PUBLIC_SITE_URL` must be the real HTTPS domain — canonical URLs and social
> share previews are generated from it.

Seed the first event, then start under PM2:

```bash
npm run seed

pm2 start src/server.js --name prashanth-api --time
pm2 save
pm2 startup        # run the command it prints
```

Verify: `curl http://127.0.0.1:5000/api/v1/health` → `"database": "connected"`.

---

## 3. Build and deploy the microsite

```bash
cd /var/www/prashanth-events/frontend-public
npm ci
```

Create `.env.production`:

```ini
VITE_API_BASE_URL=
VITE_DEFAULT_EVENT_SLUG=fertility-gynaecology-summit-2026
```

Leave `VITE_API_BASE_URL` **empty** — the SPA then calls `/api` on its own
origin and NGINX proxies it. No CORS, no mixed-content issues.

```bash
npm run build
sudo mkdir -p /var/www/prashanth-events/public
sudo cp -r dist/* /var/www/prashanth-events/public/
```

---

## 4. NGINX

```bash
sudo cp nginx/prashanth-events.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/prashanth-events.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
```

Update `server_name` and the certificate paths to your domain first.

### SSL

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d events.prashanthhospitals.com
sudo systemctl reload nginx
```

Certbot installs a renewal timer automatically. Confirm with
`sudo certbot renew --dry-run`.

---

## 5. Post-deployment checks

```bash
curl -I  https://events.prashanthhospitals.com            # 200, HSTS present
curl -s  https://events.prashanthhospitals.com/api/v1/health
curl -I  http://events.prashanthhospitals.com             # 301 to HTTPS
```

Then in a browser:

- [ ] Microsite loads and all sections render
- [ ] Deep link `/events/<slug>` works on a **hard refresh** (SPA fallback)
- [ ] Countdown shows the correct time
- [ ] Passes show correct GST-inclusive prices
- [ ] Map loads
- [ ] Share the URL in WhatsApp — the preview card shows the title, description and image
- [ ] Test on a real phone, not just a resized browser
- [ ] Check an invalid slug returns the "Event not found" page, not a blank screen

Validate the structured data at
[search.google.com/test/rich-results](https://search.google.com/test/rich-results).

---

## Updating a deployment

```bash
cd /var/www/prashanth-events
git pull

cd backend && npm ci --omit=dev && pm2 reload prashanth-api

cd ../frontend-public && npm ci && npm run build
sudo rsync -a --delete dist/ /var/www/prashanth-events/public/
```

`pm2 reload` drains in-flight requests rather than dropping them — important
once registrations and payments are live.

`index.html` is served with `no-cache` and assets are content-hashed, so
delegates never get a stale bundle after a deploy.

---

## Backups

Daily database dump, kept for 14 days:

```bash
sudo tee /usr/local/bin/backup-events.sh > /dev/null <<'EOF'
#!/bin/bash
set -euo pipefail
DIR=/var/backups/prashanth-events
mkdir -p "$DIR"
mongodump --uri="mongodb://phEvents:<password>@127.0.0.1:27017/prashanth_events" \
          --archive="$DIR/events-$(date +%F).gz" --gzip
find "$DIR" -name 'events-*.gz' -mtime +14 -delete
EOF
sudo chmod +x /usr/local/bin/backup-events.sh
echo "0 2 * * * root /usr/local/bin/backup-events.sh" | sudo tee /etc/cron.d/prashanth-backup
```

Copy backups off the server as well — a local-only backup does not survive
losing the instance. **Test a restore before go-live**, not after an incident.

---

## Monitoring

```bash
pm2 logs prashanth-api
pm2 monit
sudo tail -f /var/log/nginx/prashanth-events.error.log
```

Point an uptime monitor at `/api/v1/health` — it reports database connectivity,
so it catches a dropped Mongo connection even while NGINX still serves the page.

---

## Notes for later modules

- **Module 6 (Payments):** add `https://checkout.razorpay.com` to the CSP
  `script-src`. The webhook route is already configured with request buffering
  disabled, which signature verification requires.
- **Module 2 (CMS):** uploaded images need a persistent directory (or S3) plus a
  matching NGINX `location`. Include it in the backup job.
- **Scaling:** for a large event, run the API under `pm2 start src/server.js -i max`
  (cluster mode). The app is stateless, so this works without changes.
