---
name: rsbuild-dev-server-containerized-ci
description: Rsbuild v2+ binds dev-server to localhost by default; set server.host: '0.0.0.0' in rsbuild.config.ts for Docker port forwarding in CI.
---

## Root Cause

Rsbuild v2 changed the default dev-server `server.host` from `0.0.0.0` (all interfaces) to `localhost` (loopback only). In containerized CI, this binds only to the container's loopback (127.0.0.1), breaking Docker port forwarding (`3000:3000` mapped from host to container).

**Symptom:** `make wait-for-dev` times out with connection refused, because healthcheck requests cannot reach the dev server through the published port.

## Fix

Add to `src/rsbuild.config.ts`:

```typescript
export default defineConfig({
  server: {
    host: '0.0.0.0', // Expose to all interfaces for containerized CI
  },
  // … rest of config
});
```

Verify the dev server is now accessible from the host:

```bash
curl http://localhost:3000  # Should return HTTP 200
docker logs dev | grep "Network:"  # Confirms binding to 0.0.0.0:3000
```

## Apply When

- After rsbuild major version upgrades
- If CI dev-server healthchecks timeout after upgrading
- When debugging `make wait-for-dev` failures in Docker environments

## Discovery

Uncovered in PR #209/#210 (rsbuild v1→v2 migration). Every dev-container CI job failed at start-container: static, unit, integration, dependency-cruiser, bundle-size, lighthouse, codecov. Root cause: dev server unreachable through Docker port forwarding. Fixed in commit 064d9d88.
