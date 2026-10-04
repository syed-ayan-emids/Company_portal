# emids Portal — single-container build: serves the FastAPI API,
# the built React SPA, and bootstraps the MySQL schema on start.

FROM node:20-alpine AS web
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.13-slim
WORKDIR /app/backend
RUN apt-get update \
    && apt-get install -y --no-install-recommends default-mysql-client \
    && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ /app/backend/
COPY --from=web /app/frontend/dist /app/frontend/dist

EXPOSE 8000
CMD ["sh", "-c", "python seed_full.py && python portal_setup.py && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
