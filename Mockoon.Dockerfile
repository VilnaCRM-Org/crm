FROM public.ecr.aws/docker/library/node:24.8.0-alpine3.21@sha256:f9e76ef2f60fc2003507927805d10e10c78e269186e8111b36f13b0cbe76218c

WORKDIR /app

SHELL ["/bin/ash", "-o", "pipefail", "-c"]

RUN npm install -g @mockoon/cli@9.2.0

ARG OPENAPI_SPEC_SHA256=3e5cfa1337f87cc1806fe06048728b0140f1d00d0f87312e4dd6724544187020

ADD https://raw.githubusercontent.com/VilnaCRM-Org/user-service/v2.8.0/.github/openapi-spec/spec.yaml /app/data.yaml

RUN echo "${OPENAPI_SPEC_SHA256}  /app/data.yaml" | sha256sum -c -

# The probe docker-compose.yml runs, carried by the image (issue #139).
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 CMD ["wget", "-q", "-O", "/dev/null", "http://localhost:8080/api/users"]

CMD ["mockoon-cli", "start", "--data", "/app/data.yaml", "--port", "8080"]
