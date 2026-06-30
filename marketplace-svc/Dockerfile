FROM python:3.13-slim

RUN apt-get update && apt-get install -y --no-install-recommends postgresql-client && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY pyproject.toml .
RUN pip install --no-cache-dir -e .

COPY alembic.ini .
COPY alembic/ ./alembic/
COPY src/ ./src/
COPY start.sh .
COPY seed.sql ./seed.sql
RUN chmod +x start.sh

CMD ["./start.sh"]
