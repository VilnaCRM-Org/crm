FROM public.ecr.aws/docker/library/node:24.8.0-alpine3.21 AS builder

SHELL ["/bin/ash", "-o", "pipefail", "-c"]

RUN apk add --no-cache bash~=5.2 curl=8.14.1-r2 && \
    curl --retry 5 --retry-delay 2 -fsSL https://bun.sh/install | bash -s "bun-v1.3.5" && \
    if [ ! -x /root/.bun/bin/bunx ]; then ln -sf /root/.bun/bin/bun /root/.bun/bin/bunx; fi && \
    ln -sf /root/.bun/bin/bunx /usr/local/bin/bunx

ENV BUN_INSTALL=/root/.bun
ENV PATH="${BUN_INSTALL}/bin:${PATH}"

WORKDIR /app
COPY package.json bun.lock* checkNodeVersion.js ./
COPY docker docker
RUN bun install --frozen-lockfile && \
    node ./node_modules/typescript/bin/tsc --project ./docker/apollo-server/tsconfig.server.json

## -------- Production Stage --------
FROM public.ecr.aws/docker/library/node:24.8.0-alpine3.21
ENV NODE_ENV=production
ENV DEV_PORT=3000

SHELL ["/bin/ash", "-o", "pipefail", "-c"]

RUN apk add --no-cache bash~=5.2 curl=8.14.1-r2 && \
    curl --retry 5 --retry-delay 2 -fsSL https://bun.sh/install | bash -s "bun-v1.3.5" && \
    if [ ! -x /root/.bun/bin/bunx ]; then ln -sf /root/.bun/bin/bun /root/.bun/bin/bunx; fi && \
    ln -sf /root/.bun/bin/bunx /usr/local/bin/bunx

ENV BUN_INSTALL=/root/.bun
ENV PATH="${BUN_INSTALL}/bin:${PATH}"

WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

USER root

COPY --from=builder --chown=node:node /app/docker/apollo-server/out ./docker/apollo-server/out
COPY --chown=node:node docker/apollo-server/bootstrap.mjs ./docker/apollo-server/bootstrap.mjs

USER node
CMD ["node", "./docker/apollo-server/bootstrap.mjs"]
