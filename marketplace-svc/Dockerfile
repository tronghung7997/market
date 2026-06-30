FROM python:3.13-slim

RUN apt-get update && apt-get install -y --no-install-recommends postgresql-client && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY marketplace-svc/pyproject.toml .
RUN pip install --no-cache-dir -e .

COPY marketplace-svc/alembic.ini .
COPY marketplace-svc/alembic/ ./alembic/
COPY marketplace-svc/src/ ./src/
COPY marketplace-svc/start.sh .
COPY db/marketplace-seed.sql ./seed.sql
RUN chmod +x start.sh

CMD ["./start.sh"]
