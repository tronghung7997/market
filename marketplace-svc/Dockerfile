FROM python:3.13-slim

WORKDIR /app

COPY pyproject.toml .
RUN pip install --no-cache-dir -e .

COPY alembic.ini .
COPY alembic/ ./alembic/
COPY src/ ./src/
COPY start.sh .
RUN chmod +x start.sh

CMD ["./start.sh"]
