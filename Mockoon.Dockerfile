FROM public.ecr.aws/docker/library/node:24.8.0-alpine3.21

WORKDIR /app

SHELL ["/bin/ash", "-o", "pipefail", "-c"]

RUN npm install -g @mockoon/cli@9.2.0

ARG OPENAPI_SPEC_SHA256=3e5cfa1337f87cc1806fe06048728b0140f1d00d0f87312e4dd6724544187020

ADD https://raw.githubusercontent.com/VilnaCRM-Org/user-service/v2.7.1/.github/openapi-spec/spec.yaml /app/data.yaml

RUN echo "${OPENAPI_SPEC_SHA256}  /app/data.yaml" | sha256sum -c -

CMD ["mockoon-cli", "start", "--data", "/app/data.yaml", "--port", "8080"]
