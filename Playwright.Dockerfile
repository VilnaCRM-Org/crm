FROM mcr.microsoft.com/playwright:v1.55.0-jammy

RUN apt-get update && apt-get install -y --no-install-recommends --fix-missing \
    python3=3.10.6-1~22.04.1 \
    make=4.3-4.1build1 \
    g++=4:11.2.0-1ubuntu1 \
    curl=7.81.0-* \
    && curl -fsSL https://bun.sh/install | bash -s "bun-v1.3.4" \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

ENV BUN_INSTALL=/root/.bun
ENV PATH="${BUN_INSTALL}/bin:${PATH}"

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN bun install

CMD ["tail", "-f", "/dev/null"]
