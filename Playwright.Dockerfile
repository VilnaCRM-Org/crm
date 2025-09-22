FROM mcr.microsoft.com/playwright:v1.55.0-jammy

RUN apt-get update && apt-get install -y --no-install-recommends --fix-missing \
    python3=3.10.6-1~22.04.1 \
    make=4.3-4.1build1 \
    g++=4:11.2.0-1ubuntu1 \
    curl=7.81.0-* \
    && npm install -g pnpm@10.6.5 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN mkdir -p /app /app/test-results /app/playwright-report /tmp/test-results /tmp/playwright-report && \
    chown -R pwuser:pwuser /app /app/test-results /app/playwright-report /tmp/test-results /tmp/playwright-report

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

USER pwuser

CMD ["tail", "-f", "/dev/null"]