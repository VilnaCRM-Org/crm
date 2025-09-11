FROM node:24-alpine3.21 AS base

RUN apk add --no-cache \
    make=4.4.1-r2 \
    curl=8.12.1-r1 && \
    npm install -g pnpm@10.6.5

WORKDIR /app

COPY package.json pnpm-lock.yaml checkNodeVersion.js ./
RUN pnpm install


# -------- Build Stage --------
FROM base AS build

COPY . .
RUN npx craco build


# -------- Production Image --------
FROM node:24-alpine3.21 AS production

WORKDIR /app

ENV NODE_ENV=production
RUN npm install -g serve@14.2.0

RUN mkdir -p /app && chown -R node:node /app
COPY --from=build --chown=node:node /app/build ./build
USER node

EXPOSE 3001

CMD ["serve", "build", "-p", "3001"]
