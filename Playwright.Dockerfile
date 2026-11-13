FROM mcr.microsoft.com/playwright:v1.65.0-jammy@sha256:5a8620d70618963ec6628dd77cc25ec6a4b232e26c4a41241a8c1def04e2dc04

ARG BUN_VERSION=1.4.4
ARG UBUNTU_SNAPSHOT=20261110T000000Z

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

COPY scripts/docker/install-bun.sh /usr/local/bin/install-bun
RUN for suite in jammy jammy-updates jammy-security; do \
      echo "deb https://snapshot.ubuntu.com/ubuntu/${UBUNTU_SNAPSHOT} ${suite} main restricted universe multiverse"; \
    done > /etc/apt/sources.list \
    && echo 'Acquire::Retries "5";' > /etc/apt/apt.conf.d/80-retries \
    && apt-get update && apt-get install -y --no-install-recommends --fix-missing \
    bash=5.1-6ubuntu1.1 \
    curl=7.81.0-1ubuntu1.30 \
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
