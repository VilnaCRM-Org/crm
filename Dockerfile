FROM node:24.8.0-alpine3.21 AS base

ARG CURL_VERSION=8.14.1-r2

RUN apk add --no-cache \
    python3=3.12.12-r0 \
    make=4.4.1-r2 \
    g++=14.2.0-r4  \
    curl=${CURL_VERSION} && \
    npm install -g pnpm@10.6.5

WORKDIR /app

COPY package.json pnpm-lock.yaml checkNodeVersion.js ./
RUN pnpm install --frozen-lockfile


# -------- Build Stage --------
FROM base AS build

COPY . .
RUN npx craco build


# -------- Production Image --------
FROM node:24.8.0-alpine3.21  AS production

WORKDIR /app

ENV NODE_ENV=production
RUN apk add --no-cache curl=${CURL_VERSION} && \
    npm install -g serve@14.2.0

RUN mkdir -p /app && chown -R node:node /app
COPY --from=build --chown=node:node /app/build ./build
USER node

EXPOSE 3001

CMD ["serve", "-s", "build", "-l", "tcp://0.0.0.0:3001"]
