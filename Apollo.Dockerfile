FROM public.ecr.aws/docker/library/node:24.8.0-alpine3.21 AS builder

RUN apk add --no-cache bash curl=8.14.1-r2 && \
    curl -fsSL https://bun.sh/install | bash -s "bun-v1.3.5"

ENV BUN_INSTALL=/root/.bun
ENV PATH="${BUN_INSTALL}/bin:${PATH}"

WORKDIR /app
COPY package.json bun.lock* checkNodeVersion.js ./
COPY docker docker
RUN bun install --frozen-lockfile
RUN node ./node_modules/typescript/bin/tsc --project ./docker/apollo-server/tsconfig.server.json

## -------- Production Stage --------
FROM public.ecr.aws/docker/library/node:24.8.0-alpine3.21
ENV NODE_ENV=production
ENV DEV_PORT=3000

RUN apk add --no-cache bash curl=8.14.1-r2 && \
    curl -fsSL https://bun.sh/install | bash -s "bun-v1.3.5"

ENV BUN_INSTALL=/root/.bun
ENV PATH="${BUN_INSTALL}/bin:${PATH}"

WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

USER root
RUN apk update && apk add --no-cache curl=8.14.1-r2

COPY --from=builder --chown=node:node /app/docker/apollo-server/out ./docker/apollo-server/out
COPY --chown=node:node docker/apollo-server/bootstrap.mjs ./docker/apollo-server/bootstrap.mjs

USER node
CMD ["node", "./docker/apollo-server/bootstrap.mjs"]
