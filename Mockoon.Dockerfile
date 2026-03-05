FROM public.ecr.aws/docker/library/node:24.8.0-alpine3.21

WORKDIR /app

RUN apk add --no-cache curl=8.14.1-r2 && \
    npm install -g @mockoon/cli@9.2.0

RUN curl -fSL -o /app/data.yaml "https://raw.githubusercontent.com/VilnaCRM-Org/user-service/v2.7.1/.github/openapi-spec/spec.yaml"

CMD ["mockoon-cli", "start", "--data", "/app/data.yaml", "--port", "8080"]