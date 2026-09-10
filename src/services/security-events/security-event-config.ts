import rawEnv from '@/config/env/raw-env';

const DEFAULT_THRESHOLD = 5;
const DEFAULT_WINDOW_MS = 60_000;
const MAX_TRACKED_FAILURES = 1000;

export class SecurityEventConfig {
  public threshold(): number {
    const configured = this.positiveInteger(rawEnv.authFailureAlert().threshold, DEFAULT_THRESHOLD);
    return Math.min(configured, MAX_TRACKED_FAILURES);
  }

  public windowMs(): number {
    return this.positiveInteger(rawEnv.authFailureAlert().windowMs, DEFAULT_WINDOW_MS);
  }

  public maxTrackedFailures(): number {
    return MAX_TRACKED_FAILURES;
  }

  private positiveInteger(raw: string | undefined, fallback: number): number {
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }
}

const securityEventConfig = new SecurityEventConfig();

export default securityEventConfig;
