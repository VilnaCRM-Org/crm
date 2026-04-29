FROM public.ecr.aws/docker/library/node:24.8.0-alpine3.21

WORKDIR /app

SHELL ["/bin/ash", "-o", "pipefail", "-c"]

RUN apk add --no-cache curl=8.14.1-r2 && \
    npm install -g @mockoon/cli@9.2.0

ARG OPENAPI_SPEC_SHA256=3e5cfa1337f87cc1806fe06048728b0140f1d00d0f87312e4dd6724544187020
ARG OPENAPI_SPEC_BASE=https://raw.githubusercontent.com/VilnaCRM-Org/user-service
ARG OPENAPI_SPEC_REF=v2.7.1
ARG OPENAPI_SPEC_PATH=.github/openapi-spec/spec.yaml

RUN curl --retry 5 --retry-delay 2 --retry-connrefused -fsSL \
        -o /app/data.yaml \
        "${OPENAPI_SPEC_BASE}/${OPENAPI_SPEC_REF}/${OPENAPI_SPEC_PATH}" && \
    echo "${OPENAPI_SPEC_SHA256}  /app/data.yaml" | sha256sum -c -

CMD ["mockoon-cli", "start", "--data", "/app/data.yaml", "--port", "8080"]
