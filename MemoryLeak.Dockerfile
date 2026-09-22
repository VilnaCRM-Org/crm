FROM public.ecr.aws/docker/library/node:25.2.1-alpine3.21@sha256:32509199057d74a987fdd88cde00fdfd48ef52469adbd6bd11969fc701477761 AS base

ARG BUN_VERSION=1.3.5

SHELL ["/bin/ash", "-o", "pipefail", "-c"]

COPY scripts/docker/install-bun.sh /usr/local/bin/install-bun
RUN apk add --no-cache \
    bash=5.2.37-r0 \
    ca-certificates=20260909-r0 \
    chromium=136.0.7103.113-r0 \
    curl=8.14.1-r2 \
    dbus=1.14.10-r4 \
    freetype=2.13.3-r0 \
    harfbuzz=9.0.0-r1 \
    libx11=1.8.10-r0 \
    libxcomposite=0.4.6-r5 \
    libxdamage=1.1.6-r5 \
    libxext=1.3.6-r2 \
    nss=3.109-r0 \
    ttf-freefont=20120503-r4 \
    xvfb=21.1.16-r0 \
    && install-bun "${BUN_VERSION}"

ENV BUN_INSTALL=/root/.bun
ENV PATH="/root/.bun/bin:$PATH"

ENV DISPLAY=:99 \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    REACT_APP_MAIN_LANGUAGE=uk \
    REACT_APP_FALLBACK_LANGUAGE=en

WORKDIR /app


FROM base AS build

COPY package.json bun.lock* check-node-version.js ./
RUN bun install --frozen-lockfile


FROM base AS final

WORKDIR /app
COPY --from=build /app/node_modules ./node_modules

COPY tests/memory-leak tests/memory-leak
COPY src/config/i18n-config.js ./src/config/i18n-config.js
COPY src/i18n/localization.json ./src/i18n/localization.json

# The probe docker-compose.memory-leak.yml runs, carried by the image (issue #139).
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 CMD ["chromium-browser", "--version"]

CMD ["sleep","infinity"]
