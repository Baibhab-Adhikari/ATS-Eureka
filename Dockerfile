# ── Stage 1: Build the React frontend ────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /app/client

# Install dependencies first (cache layer)
COPY client/package.json client/package-lock.json* ./
RUN npm ci

# Copy source and build
COPY client/ ./
RUN npm run build


# ── Stage 2: Python runtime ─────────────────────────────────────────
FROM python:3.11-slim AS runtime

WORKDIR /app

# Install system dependencies for PDF generation (xhtml2pdf)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libcairo2 \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY pyproject.toml uv.lock* ./
RUN pip install --no-cache-dir uv && \
    uv pip install --system --no-cache -r pyproject.toml

# Copy backend source code
COPY . .

# Copy pre-built React frontend from Stage 1
COPY --from=frontend-build /app/client/dist ./client/dist

# App Runner expects the container to listen on port 8000
EXPOSE 8000

# Run with uvicorn in production mode
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]