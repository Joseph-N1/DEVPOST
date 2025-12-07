# ============================================
# MULTI-STAGE BUILD: Production-optimized backend
# ============================================
# Stage 1: Builder - compiles dependencies
FROM python:3.11-slim AS builder

ENV PYTHONUNBUFFERED=1

WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and build wheels
COPY requirements_dev.txt ./requirements.txt
RUN pip install --user --no-cache-dir \
    --default-timeout=300 --retries=5 \
    -r requirements.txt

# ============================================
# Stage 2: Runtime - minimal image
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1
ENV PATH=/root/.local/bin:$PATH

WORKDIR /app

# Install only runtime dependencies (no gcc, no build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy pre-built wheels from builder stage
COPY --from=builder /root/.local /root/.local

# Copy application code
COPY . /app

# Make entrypoint script executable
RUN chmod +x /app/entrypoint.sh && \
    mkdir -p /app/data/uploads && \
    chmod -R 755 /app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

# Use entrypoint script to run migrations and start server
CMD ["/app/entrypoint.sh"]

# Use entrypoint script to run migrations and start server
CMD ["/app/entrypoint.sh"]
