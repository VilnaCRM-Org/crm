import rawEnv from '@/config/env/raw-env';

const DEFAULT_THRESHOLD = 5;
const DEFAULT_WINDOW_MS = 60_000;

export class SecurityEventConfig {
  public threshold(): number {
    return this.positiveInteger(rawEnv.authFailureAlert().threshold, DEFAULT_THRESHOLD);
  }

  public windowMs(): number {
    return this.positiveInteger(rawEnv.authFailureAlert().windowMs, DEFAULT_WINDOW_MS);
  }

  private positiveInteger(raw: string | undefined, fallback: number): number {
    const parsed = Number.parseInt(raw ?? '', 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }
}

const securityEventConfig = new SecurityEventConfig();

export default securityEventConfig;
