import { PiiScrubber } from '@/services/observability/pii-scrubber';
import type { SentryEvent } from '@/services/types/observability/sentry';
import {
  buildEmail,
  buildOtpauthUri,
  buildPendingSessionId,
  buildRecoveryCode,
  buildToken,
  buildTotpCode,
  buildTotpSecret,
} from '@tests/builders';

describe('PiiScrubber two-factor redaction (#331)', () => {
  const scrubber = new PiiScrubber();
  const scrubMessage = (message: string): unknown =>
    scrubber.scrub({ message } as SentryEvent) as { message: string };

  describe('denied keys', () => {
    const secrets = {
      pendingSessionId: buildPendingSessionId(),
      twoFactorCode: buildTotpCode(),
      recoveryCodes: [buildRecoveryCode(), buildRecoveryCode()],
      otpauthUri: buildOtpauthUri(),
      secret: buildTotpSecret(),
      accessToken: buildToken(),
      refreshToken: buildToken(),
    };
    const values = [
      secrets.pendingSessionId,
      secrets.twoFactorCode,
      ...secrets.recoveryCodes,
      secrets.otpauthUri,
      secrets.secret,
      secrets.accessToken,
      secrets.refreshToken,
    ];
    const event = {
      ...secrets,
      extra: { ...secrets, keep: 'ok', variables: { input: { ...secrets, kept: 'in' } } },
      breadcrumbs: [{ message: 'step', data: { ...secrets, kept: 'data' } }],
    } as unknown as SentryEvent;

    it('removes all seven values from every level of the event', () => {
      const serialized = JSON.stringify(scrubber.scrub(event));

      for (const value of values) {
        expect(serialized).not.toContain(value);
      }
    });

    it('keeps the unrelated fields beside the dropped keys', () => {
      const result = scrubber.scrub(event) as unknown as {
        extra: { keep: string; variables: { input: Record<string, string> } };
        breadcrumbs: Array<{ data: Record<string, string> }>;
      };

      expect(result.extra.keep).toBe('ok');
      expect(result.extra.variables.input).toEqual({ kept: 'in' });
      expect(result.breadcrumbs[0]?.data).toEqual({ kept: 'data' });
      expect(Object.keys(scrubber.scrub(event))).toEqual(['extra', 'breadcrumbs']);
    });

    it.each([
      ['pendingSessionId'],
      ['pending_session_id'],
      ['twoFactorCode'],
      ['two-factor-code'],
      ['recoveryCodes'],
      ['recoveryCode'],
      ['otpauthUri'],
    ])('drops the key %s whatever its separators and case', (key) => {
      const result = scrubber.scrub({ extra: { [key]: 'value', keep: 'ok' } } as SentryEvent);

      expect(result.extra).toEqual({ keep: 'ok' });
    });
  });

  describe('otpauth URIs in free text', () => {
    const vector = 'otpauth://totp/VilnaCRM%3Aa%40b.c?secret=ABC&issuer=VilnaCRM';

    it.each([
      ['the end of the string', vector, '[redacted]'],
      ['a space', `${vector} next`, '[redacted] next'],
      ['a double quote', `"${vector}" next`, '"[redacted]" next'],
      ['a single quote', `'${vector}' next`, "'[redacted]' next"],
      ['a prefix', `scan ${vector}`, 'scan [redacted]'],
      ['an upper-case scheme', vector.replace('otpauth', 'OTPAUTH'), '[redacted]'],
      ['a mixed-case scheme', vector.replace('otpauth', 'OtpAuth'), '[redacted]'],
    ])('redacts the @-free URI up to %s and keeps the text after it', (_name, input, expected) => {
      expect(scrubMessage(input)).toEqual({ message: expected });
    });

    it('is the only pattern that catches the @-free vector (must-fail without it)', () => {
      const others = (Reflect.get(scrubber, 'patterns') as readonly RegExp[]).slice(1);
      const leftover = others.reduce(
        (text, pattern) => text.replace(pattern, '[redacted]'),
        vector
      );

      expect(leftover).toBe(vector);
    });

    it('redacts a URI whose label carries a raw @ whole, not just the e-mail', () => {
      expect(scrubMessage('"otpauth://totp/VilnaCRM:a@b.c?secret=ABC" next')).toEqual({
        message: '"[redacted]" next',
      });
    });

    it('redacts a generated URI and leaves no part of its secret behind', () => {
      const secret = buildTotpSecret();
      const uri = buildOtpauthUri(buildEmail(), secret);

      const result = scrubMessage(`scan ${uri}`) as { message: string };

      expect(result.message).toBe('scan [redacted]');
      expect(result.message).not.toContain(secret);
    });
  });

  describe('patterns', () => {
    const patterns = Reflect.get(scrubber, 'patterns') as readonly RegExp[];

    it('lists the otpauth pattern first, before the e-mail pattern', () => {
      expect(patterns).toHaveLength(7);
      expect(patterns[0]?.source).toBe(String.raw`otpauth:\/\/[^\s"']+`);
      expect(patterns[0]?.flags).toBe('gi');
      expect(patterns[1]?.source).toBe(String.raw`[^\s@]+@[^\s@]+\.[^\s@]+`);
    });
  });

  describe('values that must survive', () => {
    it('keeps a v4 UUID correlation id', () => {
      const id = '5e0e3c1a-9c11-4b7e-8a52-1f0d2c6b7a90';

      expect(scrubMessage(`request ${id} failed`)).toEqual({ message: `request ${id} failed` });
    });

    it('keeps an ordinary six-digit number in free text', () => {
      expect(scrubMessage('waited 123456 ms')).toEqual({ message: 'waited 123456 ms' });
    });
  });
});
