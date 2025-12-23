FROM public.ecr.aws/docker/library/node:24.8.0-alpine3.21 AS base

SHELL ["/bin/ash", "-o", "pipefail", "-c"]

RUN apk add --no-cache \
    bash~=5.2 \
    ca-certificates=20250911-r0 \
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
    && curl -fsSL https://bun.sh/install | bash -s "bun-v1.3.5"

ENV BUN_INSTALL=/root/.bun
ENV PATH="${BUN_INSTALL}/bin:${PATH}"

ENV DISPLAY=:99 \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    REACT_APP_MAIN_LANGUAGE=uk \
    REACT_APP_FALLBACK_LANGUAGE=en

WORKDIR /app


FROM base AS build

COPY package.json bun.lock* checkNodeVersion.js .env ./
RUN bun install


FROM base AS final

WORKDIR /app
COPY --from=build /app/node_modules ./node_modules

COPY tests/memory-leak tests/memory-leak
COPY src/config/i18nConfig.js ./src/config/i18nConfig.js
COPY src/i18n/localization.json ./src/i18n/localization.json

CMD ["sleep","infinity"]
