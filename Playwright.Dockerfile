FROM mcr.microsoft.com/playwright:v1.63.0-jammy@sha256:167d0506cfbe3c294fb214b2d11737326eeee028aa611fa1ba538e5057675847

ARG BUN_VERSION=1.3.5

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

COPY scripts/docker/install-bun.sh /usr/local/bin/install-bun
RUN apt-get update && apt-get install -y --no-install-recommends --fix-missing \
    bash=5.1-6ubuntu1.1 \
    curl=7.81.0-1ubuntu1.27 \
    g++=4:11.2.0-1ubuntu1 \
    make=4.3-4.1build1 \
    python3=3.10.6-1~22.04.1 \
    unzip=6.0-26ubuntu3.2 \
    && install-bun "${BUN_VERSION}" \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

ENV BUN_INSTALL=/root/.bun
ENV PATH="/root/.bun/bin:$PATH"

WORKDIR /app

COPY package.json bun.lock* ./

# Install all dependencies from package.json via bun; no manual installs
RUN bun install --frozen-lockfile

# A test runner that idles until `docker compose exec` drives it has no service to probe.
HEALTHCHECK NONE

CMD ["tail", "-f", "/dev/null"]
