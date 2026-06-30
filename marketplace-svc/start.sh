#!/bin/sh
set -e
alembic upgrade head

ROW_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM categories" 2>/dev/null || echo "0")
if [ "$ROW_COUNT" = "0" ]; then
  echo "Seeding database..."
  psql "$DATABASE_URL" -f /app/seed.sql
  echo "Seed complete."
fi

exec uvicorn src.main:app --host 0.0.0.0 --port "${PORT:-8000}"
