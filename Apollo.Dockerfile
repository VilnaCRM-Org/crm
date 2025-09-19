FROM node:23.11.1-alpine3.21 AS builder
RUN apk add --no-cache curl
RUN corepack enable && corepack prepare pnpm@10.6.5 --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml checkNodeVersion.js ./
COPY docker docker
RUN pnpm install --frozen-lockfile

RUN pnpm exec tsc --project ./docker/apollo-server/tsconfig.server.json

## -------- Production Stage --------
FROM node:23.11.1-alpine3.21

ENV NODE_ENV=production
ENV DEV_PORT=3000
RUN corepack enable && corepack prepare pnpm@10.6.5 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --only=production \
    && pnpm add winston

COPY --from=builder /app/docker/apollo-server/out ./docker/apollo-server/out
COPY docker/apollo-server/bootstrap.mjs ./docker/apollo-server/bootstrap.mjs

USER node
CMD ["node", "./docker/apollo-server/bootstrap.mjs"]
