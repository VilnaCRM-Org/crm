FROM docker.io/axllent/mailpit:v1.33.1@sha256:aef2aacc11f075ec0fb6874275ee4a421e688e11a96ebb296134d1735c7761ce

# The probe docker-compose.yml runs, carried by the image (issue #139).
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 CMD ["/mailpit", "readyz"]
