FROM public.ecr.aws/docker/library/node:24.8.0-alpine3.21 AS base

ARG CURL_VERSION=8.14.1-r2

SHELL ["/bin/ash", "-o", "pipefail", "-c"]

RUN apk add --no-cache \
    bash=5.2.37-r0 \
    curl=${CURL_VERSION} \
    g++=14.2.0-r4 \
    make=4.4.1-r2 \
    python3=3.12.12-r0 && \
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

COPY . .
RUN bun x craco build


# -------- Production Image --------
FROM public.ecr.aws/docker/library/node:24.8.0-alpine3.21  AS production

ARG CURL_VERSION=8.14.1-r2

WORKDIR /app

ENV NODE_ENV=production
RUN apk add --no-cache curl=${CURL_VERSION} && \
    npm install -g serve@14.2.0

RUN mkdir -p /app && chown -R node:node /app
COPY --from=build --chown=node:node /app/build ./build
USER node

EXPOSE 3001

CMD ["serve", "-s", "build", "-l", "tcp://0.0.0.0:3001"]
