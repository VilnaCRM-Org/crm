import type { SentryEvent } from '@/services/types/observability/sentry';

import PiiTextScrubber from './pii-text-scrubber';

export class PiiScrubber {
  private readonly deniedFragments: readonly string[] = [
    'password',
    'token',
    'authorization',
    'cookie',
    'secret',
    'apikey',
    'email',
    'initials',
    'pendingsession',
    'twofactorcode',
    'recoverycode',
    'otpauth',
  ];

  private readonly text = new PiiTextScrubber();

  public scrub(event: SentryEvent): SentryEvent {
    return this.redact(event) as SentryEvent;
  }

  private redact(value: unknown): unknown {
    if (typeof value === 'string') return this.text.scrub(value);
    if (Array.isArray(value)) return value.map((item) => this.redact(item));
    if (!this.isRecord(value)) return value;
    return this.redactRecord(value);
  }

  private redactRecord(record: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(record)) {
      if (!this.isDeniedKey(key)) {
        result[this.text.scrub(key)] = this.redact(record[key]);
      }
    }
    return result;
  }

  private isDeniedKey(key: string): boolean {
    const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    return this.deniedFragments.some((fragment) => normalized.includes(fragment));
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}

const piiScrubber = new PiiScrubber();

export default piiScrubber;
