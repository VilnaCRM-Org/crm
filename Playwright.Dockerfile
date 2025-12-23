FROM mcr.microsoft.com/playwright:v1.57.0-jammy

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN apt-get update && apt-get install -y --no-install-recommends --fix-missing \
    bash=5.1-6ubuntu1.1 \
    curl=7.81.0-1ubuntu1.21 \
    g++=4:11.2.0-1ubuntu1 \
    make=4.3-4.1build1 \
    python3=3.10.6-1~22.04.1 \
    unzip=6.0-26ubuntu3.2 \
    && curl --retry 5 --retry-delay 2 -fsSL https://bun.sh/install | bash -s "bun-v1.3.5" \
    && if [ ! -x /root/.bun/bin/bunx ]; then ln -sf /root/.bun/bin/bun /root/.bun/bin/bunx; fi \
    && ln -sf /root/.bun/bin/bunx /usr/local/bin/bunx \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

ENV BUN_INSTALL=/root/.bun
ENV PATH="${BUN_INSTALL}/bin:${PATH}"

WORKDIR /app

COPY package.json bun.lock* ./

RUN bun install && bunx playwright install --with-deps

CMD ["tail", "-f", "/dev/null"]
