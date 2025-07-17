FROM node:23.11.1-alpine3.21

RUN apk add --no-cache curl=8.12.1-r1

RUN npm install -g pnpm@10.6.5 typescript@5.8.2

WORKDIR /app

COPY package.json pnpm-lock.yaml checkNodeVersion.js ./
COPY docker docker
COPY .env .env

RUN pnpm install
RUN tsc --project ./docker/apollo-server/tsconfig.server.json

CMD node ./docker/apollo-server/out/schemaFetcher.mjs && \
    node ./docker/apollo-server/out/server.mjs