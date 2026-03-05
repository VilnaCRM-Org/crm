FROM golang:1.24.1-alpine3.21 AS builder

WORKDIR /app

ENV CGO_ENABLED=0

RUN apk add --no-cache git

RUN go install go.k6.io/xk6/cmd/xk6@v0.18.0

RUN xk6 build \
    --with github.com/grafana/xk6-faker@v0.4.1 \
    --with github.com/grafana/xk6-exec@v0.5.0 \
    --with github.com/avitalique/xk6-file@v1.5.0

FROM alpine:3.21
RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /app/k6 /bin/

ENTRYPOINT [ "k6" ]
