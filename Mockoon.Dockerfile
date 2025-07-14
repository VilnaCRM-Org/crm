FROM node:23.11.1-alpine3.21

WORKDIR /app

RUN apk add --no-cache curl=8.12.1-r1 && \
    npm install -g @mockoon/cli@9.2.0

RUN curl -fSL -o /app/data.yaml "https://raw.githubusercontent.com/VilnaCRM-Org/user-service/main/.github/openapi-spec/spec.yaml"

CMD ["mockoon-cli", "start", "--data", "/app/data.yaml", "--port", "8080"]