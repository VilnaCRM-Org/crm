FROM public.ecr.aws/docker/library/node:24.8.0-alpine3.21

WORKDIR /app

SHELL ["/bin/ash", "-o", "pipefail", "-c"]

RUN apk add --no-cache curl=8.14.1-r2 && \
    npm install -g @mockoon/cli@9.2.0

ARG OPENAPI_SPEC_SHA256=3e5cfa1337f87cc1806fe06048728b0140f1d00d0f87312e4dd6724544187020
ARG OPENAPI_SPEC_BASE=https://raw.githubusercontent.com/VilnaCRM-Org/user-service
ARG OPENAPI_SPEC_REF=v2.7.1
ARG OPENAPI_SPEC_PATH=.github/openapi-spec/spec.yaml

RUN --mount=type=secret,id=GITHUB_TOKEN,required=false \
    set -eu; \
    spec_url="${OPENAPI_SPEC_BASE}/${OPENAPI_SPEC_REF}/${OPENAPI_SPEC_PATH}"; \
    token_file="/run/secrets/GITHUB_TOKEN"; \
    if [ -s "${token_file}" ]; then \
      curl --fail --show-error --location --retry 5 --retry-delay 2 --retry-connrefused \
        --header "Authorization: Bearer $(cat "${token_file}")" \
        --output /app/data.yaml \
        "${spec_url}"; \
    else \
      curl --fail --show-error --location --retry 5 --retry-delay 2 --retry-connrefused \
        --output /app/data.yaml \
        "${spec_url}"; \
    fi; \
    echo "${OPENAPI_SPEC_SHA256}  /app/data.yaml" | sha256sum -c -

CMD ["mockoon-cli", "start", "--data", "/app/data.yaml", "--port", "8080"]
