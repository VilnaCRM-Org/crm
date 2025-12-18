FROM public.ecr.aws/docker/library/node:24.8.0-alpine3.21 AS base

ARG CURL_VERSION=8.14.1-r2

RUN apk add --no-cache \
    bash \
    python3=3.12.12-r0 \
    make=4.4.1-r2 \
    g++=14.2.0-r4  \
    curl=${CURL_VERSION} && \
    curl -fsSL https://bun.sh/install | bash -s "bun-v1.3.4"

ENV BUN_INSTALL=/root/.bun
ENV PATH="${BUN_INSTALL}/bin:${PATH}"

WORKDIR /app

COPY package.json bun.lock* checkNodeVersion.js ./
RUN bun install --frozen-lockfile


# -------- Build Stage --------
FROM base AS build

COPY . .
RUN bunx craco build


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
