FROM docker.io/axllent/mailpit:v1.31.4@sha256:b68349e3a014b90c5610bfb26b2ae36f3892d7b8cf25ee140c6c71c98d2fcf48

# The probe docker-compose.yml runs, carried by the image (issue #139).
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 CMD ["/mailpit", "readyz"]
