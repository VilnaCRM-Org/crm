import type { SentryEvent } from '@/services/types/observability/sentry';

export class PiiScrubber {
  private readonly deniedKeys: ReadonlySet<string> = new Set([
    'password',
    'token',
    'accesstoken',
    'refreshtoken',
    'authorization',
    'cookie',
    'cookies',
    'set-cookie',
    'secret',
    'apikey',
    'email',
  ]);

  private readonly patterns: readonly RegExp[] = [
    /[^\s@]+@[^\s@]+\.[^\s@]+/g,
    /bearer\s+[\w.\-~+/]+=*/gi,
    /eyJ[\w-]+\.[\w-]+\.[\w-]+/g,
  ];

  public scrub(event: SentryEvent): SentryEvent {
    return this.redact(event) as SentryEvent;
  }

  private redact(value: unknown): unknown {
    if (typeof value === 'string') return this.redactString(value);
    if (Array.isArray(value)) return value.map((item) => this.redact(item));
    if (!this.isRecord(value)) return value;
    return this.redactRecord(value);
  }

  private redactRecord(record: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(record)) {
      if (!this.deniedKeys.has(key.toLowerCase())) {
        result[key] = this.redact(record[key]);
      }
    }
    return result;
  }

  private redactString(value: string): string {
    return this.patterns.reduce((text, pattern) => text.replace(pattern, '[redacted]'), value);
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}

const piiScrubber = new PiiScrubber();

export default piiScrubber;
