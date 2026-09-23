#!/bin/sh
set -e

# Hosted persistent disks (e.g. Render) mount root-owned, but the app runs as
# the unprivileged "node" user. Fix ownership of the upload dir, then drop
# privileges. When already non-root (plain `docker run --user`), just exec.
if [ "$(id -u)" = "0" ]; then
  UPLOADS="${UPLOAD_DIR:-/app/uploads}"
  mkdir -p "$UPLOADS"
  chown -R node:node "$UPLOADS"
  exec su-exec node "$@"
fi

exec "$@"
