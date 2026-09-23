#!/bin/bash
# Dumps the running mongo container's database to a gzipped archive.
# Run from the repo root (where docker-compose.yml lives), or cron it there:
#   0 2 * * * cd /opt/prashanth-events && ./scripts/backup-mongo.sh >> /var/log/prashanth-backup.log 2>&1
set -euo pipefail

DB_NAME="${MONGO_DB_NAME:-prashanth_events}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%F)"
ARCHIVE_PATH="$BACKUP_DIR/events-$TIMESTAMP.gz"

echo "Backing up '$DB_NAME' to $ARCHIVE_PATH ..."
docker compose exec -T mongo mongodump --db "$DB_NAME" --archive --gzip > "$ARCHIVE_PATH"

SIZE=$(du -h "$ARCHIVE_PATH" | cut -f1)
echo "Done: $ARCHIVE_PATH ($SIZE)"

echo "Pruning backups older than $RETENTION_DAYS days ..."
find "$BACKUP_DIR" -name 'events-*.gz' -mtime "+$RETENTION_DAYS" -delete -print

echo "Backup complete."
