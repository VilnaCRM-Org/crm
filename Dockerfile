FROM node:23.11.1-alpine3.21 AS base

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
RUN pnpm build


# -------- Production Image --------
FROM node:23.11.1-alpine3.21 AS production

WORKDIR /app

RUN npm install -g serve@14.2.0

COPY --from=build /app/build ./build

EXPOSE 3001

CMD ["serve", "build", "-p", "3001"]