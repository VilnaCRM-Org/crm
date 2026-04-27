FROM public.ecr.aws/docker/library/node:24.8.0-alpine3.21 AS base

ARG CURL_VERSION=8.14.1-r2
ARG INSTALL_CHROMIUM=false

SHELL ["/bin/ash", "-o", "pipefail", "-c"]

RUN apk add --no-cache \
    bash=5.2.37-r0 \
    curl=${CURL_VERSION} \
    g++=14.2.0-r4 \
    jq=1.7.1-r0 \
    make=4.4.1-r2 \
    python3=3.12.13-r0 && \
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

COPY package.json bun.lock* checkNodeVersion.js ./
RUN bun install --frozen-lockfile


# -------- Build Stage --------
FROM base AS build

# Ensure Bun binaries are in PATH for this stage
ENV PATH="/root/.bun/bin:${PATH}"

ARG REACT_APP_LHCI_PRELOADED_AUTH_TOKEN=""
ENV REACT_APP_LHCI_PRELOADED_AUTH_TOKEN=${REACT_APP_LHCI_PRELOADED_AUTH_TOKEN}

COPY . .
RUN bun x rsbuild build


# -------- rust-code-analysis Stage --------
FROM public.ecr.aws/docker/library/debian:12-slim AS rca

ARG RCA_VERSION=0.0.25
ARG RCA_SHA256=9ec2a217b8ff191e02dab5d5f2eee6158b63fd975c532b2c5d67c2e6c7249894

SHELL ["/bin/sh", "-c"]

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ca-certificates \
      jq \
      make \
      tar \
      unzip && \
    rm -rf /var/lib/apt/lists/*

ADD \
    https://github.com/mozilla/rust-code-analysis/releases/download/v${RCA_VERSION}/rust-code-analysis-linux-cli-x86_64.tar.gz \
    /tmp/rca.tar.gz

RUN printf '%s  %s\n' "${RCA_SHA256}" "/tmp/rca.tar.gz" | sha256sum -c - && \
    tar -xz -C /usr/local/bin -f /tmp/rca.tar.gz && \
    chmod +x /usr/local/bin/rust-code-analysis-cli && \
    /usr/local/bin/rust-code-analysis-cli --version && \
    rm /tmp/rca.tar.gz

ENV RCA_BIN=/usr/local/bin/rust-code-analysis-cli

WORKDIR /app


# -------- Production Image --------
FROM public.ecr.aws/docker/library/node:24.8.0-alpine3.21  AS production

ARG CURL_VERSION=8.14.1-r2

WORKDIR /app

ENV NODE_ENV=production
RUN apk add --no-cache curl=${CURL_VERSION} && \
    npm install -g serve@14.2.0

RUN mkdir -p /app && chown -R node:node /app
COPY --chown=node:node serve.json ./serve.json
COPY --from=build --chown=node:node /app/dist ./dist
USER node

EXPOSE 3001

CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:3001", "-c", "/app/serve.json"]
