# Load Testing Troubleshooting

## Production Service Is Not Healthy

Run:

```bash
make wait-for-prod-health
```

Check `make logs-prod` if the health check times out.

## Results File Missing

Confirm the output path is under `/loadTests/results/` inside the K6 container
and `tests/load/results/` on the host.

## High Failure Rate

First verify the flow manually or with Playwright. Then reduce VUs and duration
to separate application failures from load pressure.
