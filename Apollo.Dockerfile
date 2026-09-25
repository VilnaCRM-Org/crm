FROM public.ecr.aws/docker/library/node:25.2.1-alpine3.21@sha256:32509199057d74a987fdd88cde00fdfd48ef52469adbd6bd11969fc701477761 AS builder

ARG BUN_VERSION=1.3.5

SHELL ["/bin/ash", "-o", "pipefail", "-c"]

COPY scripts/docker/install-bun.sh /usr/local/bin/install-bun
RUN apk add --no-cache bash~=5.2 curl=8.14.1-r2 && \
    install-bun "${BUN_VERSION}"

ENV BUN_INSTALL=/root/.bun
ENV PATH="/root/.bun/bin:$PATH"

WORKDIR /app
COPY package.json bun.lock* check-node-version.js ./
COPY docker docker
RUN bun install --frozen-lockfile && \
    node ./node_modules/typescript/bin/tsc --project ./docker/apollo-server/tsconfig.server.json

## -------- Production Stage --------
FROM public.ecr.aws/docker/library/node:25.2.1-alpine3.21@sha256:32509199057d74a987fdd88cde00fdfd48ef52469adbd6bd11969fc701477761
ENV NODE_ENV=production
ENV DEV_PORT=3000

WORKDIR /app
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/bun.lock* ./bun.lock*

USER root

COPY --from=builder --chown=node:node /app/docker/apollo-server/out ./docker/apollo-server/out
COPY --chown=node:node docker/apollo-server/bootstrap.mjs ./docker/apollo-server/bootstrap.mjs

USER node

# Apollo Server 4 answers GET /graphql without a query with HTTP 400, and the image ships
# busybox wget but not curl, so the probe posts a minimal query — the same check
# docker-compose.yml runs, carried by the image (issue #139). Exec form with an explicit `sh -c`,
# because GRAPHQL_PORT is read at container start and only a shell can expand it.
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 CMD ["sh", "-c", "wget -q -O /dev/null --header='Content-Type: application/json' --post-data='{\"query\":\"{__typename}\"}' \"http://localhost:${GRAPHQL_PORT:-4000}/graphql\""]

CMD ["node", "./docker/apollo-server/bootstrap.mjs"]
