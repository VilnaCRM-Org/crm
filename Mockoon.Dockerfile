FROM public.ecr.aws/docker/library/node:24.8.0-alpine3.21

WORKDIR /app

RUN apk add --no-cache curl=8.14.1-r2 && \
    npm install -g @mockoon/cli@9.2.0

ARG GITHUB_TOKEN
ARG OPENAPI_SPEC_SHA256=3e5cfa1337f87cc1806fe06048728b0140f1d00d0f87312e4dd6724544187020
ARG OPENAPI_SPEC_URL=https://raw.githubusercontent.com/VilnaCRM-Org/user-service/v2.7.1/.github/openapi-spec/spec.yaml

RUN set -eu; \
    if [ -n "${GITHUB_TOKEN:-}" ]; then \
      curl --fail --show-error --location --retry 5 --retry-delay 2 --retry-connrefused \
        --header "Authorization: Bearer ${GITHUB_TOKEN}" \
        --output /app/data.yaml \
        "${OPENAPI_SPEC_URL}"; \
    else \
      curl --fail --show-error --location --retry 5 --retry-delay 2 --retry-connrefused \
        --output /app/data.yaml \
        "${OPENAPI_SPEC_URL}"; \
    fi; \
    echo "${OPENAPI_SPEC_SHA256}  /app/data.yaml" | sha256sum -c -

CMD ["mockoon-cli", "start", "--data", "/app/data.yaml", "--port", "8080"]
