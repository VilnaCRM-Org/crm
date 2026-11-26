FROM docker.io/axllent/mailpit:v1.34.0@sha256:23a2ef85bc50853ab3093645d1d64679afd8887e89da5e48a88940c172591a4e

# The probe docker-compose.yml runs, carried by the image (issue #139).
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 CMD ["/mailpit", "readyz"]
