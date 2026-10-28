# syntax=docker/dockerfile:1
FROM python:3.12-slim AS builder

ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc \
        libc6-dev \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt \
 && pip install --no-cache-dir --prefix=/install "gunicorn==21.2.0"

FROM python:3.12-slim

RUN groupadd --gid 1000 appuser \
 && useradd --uid 1000 --gid 1000 --create-home appuser

RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /install /usr/local

WORKDIR /app

COPY --chown=appuser:appuser manage.py ./
COPY --chown=appuser:appuser ecommerce ./ecommerce
COPY --chown=appuser:appuser users ./users
COPY --chown=appuser:appuser vendors ./vendors
COPY --chown=appuser:appuser products ./products
COPY --chown=appuser:appuser orders ./orders
COPY --chown=appuser:appuser customer ./customer

ENV PORT=8080 \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DJANGO_SETTINGS_MODULE=ecommerce.settings

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8080/healthz', timeout=4).status==200 else 1)" || exit 1

CMD ["gunicorn", "ecommerce.wsgi:application", "--bind", "0.0.0.0:8080", "--workers", "3", "--timeout", "60", "--access-logfile", "-", "--error-logfile", "-"]
