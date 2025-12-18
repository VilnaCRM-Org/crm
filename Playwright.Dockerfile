FROM mcr.microsoft.com/playwright:v1.55.0-jammy

RUN apt-get update && apt-get install -y --no-install-recommends --fix-missing \
    python3 \
    make \
    g++ \
    curl \
    unzip \
    && curl -fsSL https://bun.sh/install | bash -s "bun-v1.3.5" \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

ENV BUN_INSTALL=/root/.bun
ENV PATH="${BUN_INSTALL}/bin:${PATH}"

WORKDIR /app

COPY package.json bun.lock* ./

RUN bun install

CMD ["tail", "-f", "/dev/null"]
