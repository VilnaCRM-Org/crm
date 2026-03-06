FROM public.ecr.aws/docker/library/node:24.8.0-alpine3.21 AS base

ARG CURL_VERSION=8.14.1-r2
ARG INSTALL_CHROMIUM=false

SHELL ["/bin/ash", "-o", "pipefail", "-c"]

RUN apk add --no-cache \
    bash=5.2.37-r0 \
    curl=${CURL_VERSION} \
    g++=14.2.0-r4 \
    make=4.4.1-r2 \
    python3=3.12.12-r0 && \
    if [ "$INSTALL_CHROMIUM" = "true" ]; then \
      apk add --no-cache \
        chromium=136.0.7103.113-r0 \
        font-freefont=20120503-r4 \
        freetype=2.13.3-r0 \
        harfbuzz=9.0.0-r1 \
        nss=3.109-r0; \
    fi && \
    curl --retry 5 --retry-delay 2 -fsSL https://bun.sh/install | bash -s "bun-v1.3.5"

ENV BUN_INSTALL=/root/.bun
ENV PATH="/root/.bun/bin:$PATH"

WORKDIR /app

COPY package.json bun.lock* check-node-version.js ./
RUN bun install --frozen-lockfile


# -------- Build Stage --------
FROM base AS build

# Ensure Bun binaries are in PATH for this stage
ENV PATH="/root/.bun/bin:${PATH}"

COPY . .
RUN bun x rsbuild build


# -------- Production Image --------
FROM public.ecr.aws/docker/library/node:24.8.0-alpine3.21  AS production

ARG CURL_VERSION=8.14.1-r2

WORKDIR /app

ENV NODE_ENV=production
RUN apk add --no-cache curl=${CURL_VERSION} && \
    npm install -g serve@14.2.0

RUN mkdir -p /app && chown -R node:node /app
COPY --from=build --chown=node:node /app/dist ./dist
USER node

EXPOSE 3001

CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:3001"]
