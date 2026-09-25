FROM public.ecr.aws/docker/library/node:24.8.0-alpine3.21@sha256:f9e76ef2f60fc2003507927805d10e10c78e269186e8111b36f13b0cbe76218c AS base

ARG BUN_VERSION=1.3.5
ARG CURL_VERSION=8.14.1-r2
ARG INSTALL_CHROMIUM=false
ARG INSTALL_PLAYWRIGHT_BROWSERS=false

SHELL ["/bin/ash", "-o", "pipefail", "-c"]

# Bun is installed from a release archive whose SHA256 the script pins (issue #139), never by
# piping the upstream install script into a shell; the script is copied first so a Bun bump
# invalidates only this layer.
COPY scripts/docker/install-bun.sh /usr/local/bin/install-bun
RUN apk add --no-cache \
    bash=5.2.37-r0 \
    curl=${CURL_VERSION} \
    g++=14.2.0-r4 \
    git=2.47.3-r0 \
    jq=1.7.1-r0 \
    make=4.4.1-r2 \
    python3=3.12.14-r0 && \
    if [ "$INSTALL_CHROMIUM" = "true" ] || [ "$INSTALL_PLAYWRIGHT_BROWSERS" = "true" ]; then \
      apk add --no-cache \
        chromium=136.0.7103.113-r0 \
        font-freefont=20120503-r4 \
        freetype=2.13.3-r0 \
        harfbuzz=9.0.0-r1 \
        nss=3.109-r0; \
    fi && \
    install-bun "${BUN_VERSION}"

ENV BUN_INSTALL=/root/.bun
ENV PATH="/root/.bun/bin:$PATH"

WORKDIR /app

COPY package.json bun.lock* check-node-version.js ./
RUN bun install --frozen-lockfile


# -------- Build Stage --------
FROM base AS build

# Ensure Bun binaries are in PATH for this stage
ENV PATH="/root/.bun/bin:${PATH}"
ARG REACT_APP_RELEASE=""
ENV REACT_APP_RELEASE=${REACT_APP_RELEASE}

# The build context carries no .env (.dockerignore, issue #142): the bundle inlines the tracked
# template's REACT_APP_* values, the same ones the committed serve.json connect-src was
# generated from, so a machine-local .env can neither drift the CSP nor leak into an image.
COPY . .
COPY .env.example .env
RUN bun x rsbuild build && \
    cp -a dist dist-production && \
    find dist-production -name '*.map' -type f -delete


# -------- Test-harness Build Stage --------
# Playwright, the visual suite and Lighthouse CI seed an authenticated session against a
# production build, so this is the one build allowed to compile in the preloaded-auth seed
# (issue #158). It is a separate stage from `build` so the deployable `production` target
# cannot be handed the seam at all, by ARG or otherwise.
FROM base AS build-test-harness

ENV PATH="/root/.bun/bin:${PATH}"
ENV ENABLE_PRELOADED_AUTH_TOKEN_SEED=true
ARG REACT_APP_LHCI_PRELOADED_AUTH_TOKEN=""
ENV REACT_APP_LHCI_PRELOADED_AUTH_TOKEN=${REACT_APP_LHCI_PRELOADED_AUTH_TOKEN}

COPY . .
COPY .env.example .env
RUN bun x rsbuild build && \
    cp -a dist dist-production && \
    find dist-production -name '*.map' -type f -delete


# -------- rust-code-analysis Stage --------
FROM public.ecr.aws/docker/library/debian:13-slim@sha256:a99cfc517144bc59b1978475ec53b46ecabec7e43635402ee5b77cc54cd1b20a AS rca

ARG RCA_VERSION=0.0.25
ARG RCA_SHA256=9ec2a217b8ff191e02dab5d5f2eee6158b63fd975c532b2c5d67c2e6c7249894
ARG DEBIAN_SNAPSHOT=20260918T000000Z
ARG TARGETARCH

SHELL ["/bin/sh", "-c"]

RUN set -eux; \
    printf 'Types: deb\nURIs: http://snapshot.debian.org/archive/%s/%s\nSuites: %s\n'\
'Components: main\nSigned-By: /usr/share/keyrings/debian-archive-keyring.pgp\n'\
'Check-Valid-Until: no\n\n' \
      debian "${DEBIAN_SNAPSHOT}" "trixie trixie-updates" \
      debian-security "${DEBIAN_SNAPSHOT}" trixie-security \
      > /etc/apt/sources.list.d/debian.sources; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
      ca-certificates=20250419 \
      jq=1.7.1-6+deb13u3 \
      make=4.4.1-2 \
      tar=1.35+dfsg-3.1 \
      unzip=6.0-29+deb13u1; \
    if [ "${TARGETARCH}" = "amd64" ]; then \
      apt-get install -y --no-install-recommends curl=8.14.1-2+deb13u5; \
    else \
      apt-get install -y --no-install-recommends \
        build-essential=12.12 \
        cargo=1.85.1+dfsg1-1+deb13u1; \
    fi; \
    rm -rf /var/lib/apt/lists/*; \
    if [ "${TARGETARCH}" = "amd64" ]; then \
      rca_tarball_url="https://github.com/mozilla/rust-code-analysis/releases/download/"\
"v${RCA_VERSION}/rust-code-analysis-linux-cli-x86_64.tar.gz"; \
      curl --retry 5 --retry-delay 2 -fsSL "$rca_tarball_url" -o /tmp/rca.tar.gz; \
      printf '%s  %s\n' "${RCA_SHA256}" "/tmp/rca.tar.gz" > /tmp/rca.tar.gz.sha256; \
      sha256sum -c /tmp/rca.tar.gz.sha256; \
      tar -xz -C /usr/local/bin -f /tmp/rca.tar.gz; \
    else \
      cargo install --locked --version "${RCA_VERSION}" rust-code-analysis-cli --root /usr/local; \
    fi; \
    chmod +x /usr/local/bin/rust-code-analysis-cli; \
    /usr/local/bin/rust-code-analysis-cli --version; \
    rm -f /tmp/rca.tar.gz /tmp/rca.tar.gz.sha256

ENV RCA_BIN=/usr/local/bin/rust-code-analysis-cli

WORKDIR /app


FROM public.ecr.aws/docker/library/node:24.8.0-alpine3.21@sha256:f9e76ef2f60fc2003507927805d10e10c78e269186e8111b36f13b0cbe76218c AS serve-tools

RUN npm install -g serve@14.2.6


# -------- Static Server Stage --------
FROM public.ecr.aws/docker/library/alpine:3.21@sha256:ce64758a109eb420d874a118f87920e625e12d3634e03b4a5573fd9f6e5d3507 AS serve-base

ARG CURL_VERSION=8.14.1-r2
ARG LIBSTDCPP_VERSION=14.2.0-r4

WORKDIR /app

ENV NODE_ENV=production
ENV NO_UPDATE_CHECK=1
RUN apk add --no-cache \
    curl=${CURL_VERSION} \
    libgcc=${LIBSTDCPP_VERSION} \
    libstdc++=${LIBSTDCPP_VERSION} && \
    addgroup -g 1000 node && \
    adduser -u 1000 -G node -s /bin/sh -D node && \
    mkdir -p /app && chown -R node:node /app
COPY --from=serve-tools /usr/local/bin/node /usr/local/bin/node
COPY --from=serve-tools /usr/local/lib/node_modules/serve /usr/local/lib/node_modules/serve
RUN ln -s ../lib/node_modules/serve/build/main.js /usr/local/bin/serve
# Runtime configuration renderer (issue #145): rewrites the inline app-config block in the built
# HTML shell from APP_CONFIG_* variables at container start, so one image serves any environment.
# Copied before the bundle so a code change does not invalidate this layer, and vice versa.
COPY --chown=node:node scripts/docker-entrypoint.sh scripts/render-app-config.js scripts/render-security-headers.js scripts/security-headers.js ./scripts/
COPY --chown=node:node config/security-headers.json serve.json ./config/
ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]
COPY --chown=node:node serve.json ./serve.json

EXPOSE 3001

# The same probe docker-compose.test.yml runs, carried by the image so an orchestrator outside
# compose restarts a container whose server stopped answering (issue #139).
HEALTHCHECK --interval=10s --timeout=5s --start-period=45s --retries=3 CMD ["curl", "-fsS", "-o", "/dev/null", "http://127.0.0.1:3001/"]

CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:3001", "-c", "/app/serve.json"]


# -------- Production Image --------
FROM serve-base AS production

COPY --from=build --chown=node:node /app/dist-production ./dist
USER node


# -------- Test-harness Image --------
FROM serve-base AS test-harness

COPY --from=build-test-harness --chown=node:node /app/dist-production ./dist
USER node
