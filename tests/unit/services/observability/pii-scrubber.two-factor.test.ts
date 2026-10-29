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

  describe('labelled two-factor values in free text', () => {
    it.each([
      ['an = label', 'pendingSessionId=01JAQZ8M3K5N7P9R2T4V6X8Z0B', 'pendingSessionId=[redacted]'],
      ['a : label', 'twoFactorCode:123456', 'twoFactorCode:[redacted]'],
      ['a : label and a space', 'recoveryCode: AB12-CD34', 'recoveryCode: [redacted]'],
      ['a plural label', 'recoveryCodes= EF56-GH78', 'recoveryCodes= [redacted]'],
      ['a label and two spaces', 'twoFactorCode:  123456', 'twoFactorCode:  [redacted]'],
      ['spaces around the =', 'twoFactorCode = 123456', 'twoFactorCode = [redacted]'],
      ['an upper-case label', 'TWOFACTORCODE=654321', 'TWOFACTORCODE=[redacted]'],
      ['a label inside a word', 'xpendingSessionId=01JB', 'xpendingSessionId=[redacted]'],
      [
        'the text after the value',
        'retry twoFactorCode=123456 and pendingSessionId=01JB&step=2',
        'retry twoFactorCode=[redacted] and pendingSessionId=[redacted]&step=2',
      ],
    ])('redacts the value after %s', (_name, input, expected) => {
      expect(scrubMessage(input)).toEqual({ message: expected });
    });

    it('redacts a generated pending session id, TOTP code and recovery code', () => {
      const pendingSessionId = buildPendingSessionId();
      const code = buildTotpCode();
      const recoveryCode = buildRecoveryCode();

      expect(
        scrubMessage(
          `pendingSessionId=${pendingSessionId} twoFactorCode=${code} recoveryCode: ${recoveryCode}`
        )
      ).toEqual({
        message: 'pendingSessionId=[redacted] twoFactorCode=[redacted] recoveryCode: [redacted]',
      });
    });

    it.each([
      ['an unlabelled six-digit number', 'order 123456 shipped'],
      ['a label with no separator', 'twoFactorCode 123456'],
      ['an unrelated label', 'orderCode=123456'],
    ])('keeps %s', (_name, input) => {
      expect(scrubMessage(input)).toEqual({ message: input });
    });
  });

  describe('two-factor values in serialized JSON members', () => {
    it.each([
      ['pendingSessionId', '01JAQZ8M3K5N7P9R2T4V6X8Z0B'],
      ['twoFactorCode', '123456'],
      ['recoveryCode', 'AB12-CD34'],
      ['secret', 'JBSWY3DPEHPK3PXP'],
      ['totpSecret', 'JBSWY3DPEHPK3PXP'],
      ['PENDINGSESSIONID', '01JB'],
    ])('redacts the %s member value', (key, value) => {
      expect(scrubMessage(`body {"${key}": "${value}","step":"2"}`)).toEqual({
        message: `body {"${key}": "[redacted]","step":"2"}`,
      });
    });

    it('keeps an unrelated JSON member value', () => {
      const message = 'body {"orderCode":"123456"}';

      expect(scrubMessage(message)).toEqual({ message });
    });
  });

  describe('recovery code lists', () => {
    it('redacts a serialized JSON array of generated codes whole', () => {
      const codes = [buildRecoveryCode(), buildRecoveryCode()];

      const result = scrubMessage(`body {"recoveryCodes":${JSON.stringify(codes)},"step":"2"}`);

      expect(result).toEqual({ message: 'body {"recoveryCodes":[redacted],"step":"2"}' });
    });

    it.each([
      ['spaces around the separator', 'recoveryCodes = ["AB12-CD34", "EF56-GH78"]'],
      ['a free-text array', 'recoveryCodes:[AB12-CD34,EF56-GH78]'],
      ['an upper-case label', 'RECOVERYCODES:["AB12-CD34"]'],
    ])('redacts the array after %s', (_name, input) => {
      const result = scrubMessage(`${input} next`) as { message: string };

      expect(result.message).toBe(`${input.slice(0, input.indexOf('['))}[redacted] next`);
    });

    it('keeps an array after an unrelated label', () => {
      const message = 'orderCodes:["AB12-CD34"]';

      expect(scrubMessage(message)).toEqual({ message });
    });

    it.each([
      ['no spaces', 'recoveryCodes=AB12-CD34,EF56-GH78', 'recoveryCodes=[redacted],[redacted]'],
      [
        'a space after each comma',
        'recoveryCodes= AB12-CD34, EF56-GH78, IJ90-KL12',
        'recoveryCodes= [redacted], [redacted], [redacted]',
      ],
      [
        'spaces around the separator',
        'recoveryCodes = AB12-CD34 , EF56-GH78',
        'recoveryCodes = [redacted] , [redacted]',
      ],
      [
        'a JSON string value',
        'body {"recoveryCodes": "AB12-CD34,EF56-GH78","step":"2"}',
        'body {"recoveryCodes": "[redacted],[redacted]","step":"2"}',
      ],
      [
        'the text after the list',
        'recoveryCodes=AB12-CD34,EF56-GH78&step=2',
        'recoveryCodes=[redacted],[redacted]&step=2',
      ],
    ])('redacts every code of a comma-separated list with %s', (_name, input, expected) => {
      expect(scrubMessage(input)).toEqual({ message: expected });
    });

    it('leaves no generated code of a free-text list behind', () => {
      const codes = Array.from({ length: 8 }, () => buildRecoveryCode());

      const result = scrubMessage(`recoveryCodes: ${codes.join(', ')}`) as { message: string };

      expect(result.message).toBe(`recoveryCodes: ${codes.map(() => '[redacted]').join(', ')}`);
    });

    it('keeps a comma-separated list after an unrelated label', () => {
      const message = 'orderCodes=AB12-CD34,EF56-GH78';

      expect(scrubMessage(message)).toEqual({ message });
    });
  });

  describe('quoted and escaped two-factor values', () => {
    it.each([
      ['a single-quoted code', "twoFactorCode: '123456' next", "twoFactorCode: '[redacted]' next"],
      [
        'a single-quoted session id',
        "pendingSessionId: '01JAQZ8M3K5N7P9R2T4V6X8Z0B' next",
        "pendingSessionId: '[redacted]' next",
      ],
      ['a single-quoted label', "{'twoFactorCode': '123456'}", "{'twoFactorCode': '[redacted]'}"],
      [
        'a single-quoted code array',
        "recoveryCodes: ['AB12-CD34', 'EF56-GH78'] next",
        'recoveryCodes: [redacted] next',
      ],
      [
        'a single-quoted label and array',
        "{'recoveryCodes': ['AB12-CD34']}",
        "{'recoveryCodes': [redacted]}",
      ],
      [
        'a double-quoted comma list',
        'recoveryCodes: "AB12-CD34", "EF56-GH78", "IJ90-KL12"',
        'recoveryCodes: "[redacted]", "[redacted]", "[redacted]"',
      ],
      [
        'a single-quoted comma list',
        "recoveryCodes: 'AB12-CD34','EF56-GH78'",
        "recoveryCodes: '[redacted]','[redacted]'",
      ],
      [
        'an escaped JSON code',
        String.raw`{\"twoFactorCode\":\"123456\"}`,
        String.raw`{\"twoFactorCode\":\"[redacted]\"}`,
      ],
      [
        'an escaped JSON session id',
        String.raw`{\"pendingSessionId\":\"01JB\",\"step\":\"2\"}`,
        String.raw`{\"pendingSessionId\":\"[redacted]\",\"step\":\"2\"}`,
      ],
      [
        'an escaped JSON code array',
        String.raw`{\"recoveryCodes\":[\"AB12-CD34\",\"EF56-GH78\"],\"step\":\"2\"}`,
        String.raw`{\"recoveryCodes\":[redacted],\"step\":\"2\"}`,
      ],
      [
        'an escaped JSON comma list',
        String.raw`{\"recoveryCodes\":\"AB12-CD34,EF56-GH78\",\"step\":\"2\"}`,
        String.raw`{\"recoveryCodes\":\"[redacted],[redacted]\",\"step\":\"2\"}`,
      ],
      [
        'an escaped JSON quoted list',
        String.raw`{\"recoveryCodes\":\"AB12-CD34\",\"EF56-GH78\"}`,
        String.raw`{\"recoveryCodes\":\"[redacted]\",\"[redacted]\"}`,
      ],
      [
        'a single-quoted label and list before another member',
        "{'recoveryCodes': 'AB12-CD34','EF56-GH78', 'step': '2'}",
        "{'recoveryCodes': '[redacted]','[redacted]', 'step': '2'}",
      ],
      [
        'a free-text list before another label',
        'recoveryCodes=AB12-CD34,EF56-GH78,step=2',
        'recoveryCodes=[redacted],[redacted],step=2',
      ],
    ])('redacts %s', (_name, input, expected) => {
      expect(scrubMessage(input)).toEqual({ message: expected });
    });

    it('leaves no generated code of a quoted list behind', () => {
      const codes = Array.from({ length: 8 }, () => buildRecoveryCode());
      const quoted = codes.map((code) => `"${code}"`).join(', ');

      const result = scrubMessage(`recoveryCodes: ${quoted}`) as { message: string };

      expect(result.message).toBe(`recoveryCodes: ${codes.map(() => '"[redacted]"').join(', ')}`);
    });

    it('keeps the members that follow a quoted list', () => {
      expect(scrubMessage('{"recoveryCodes": "AB12-CD34", "step" : "2", "next": "3"}')).toEqual({
        message: '{"recoveryCodes": "[redacted]", "step" : "2", "next": "3"}',
      });
    });

    it('keeps a quoted value after an unrelated label', () => {
      const message = String.raw`orderCode: '123456', \"orderCodes\": \"AB12-CD34\"`;

      expect(scrubMessage(message)).toEqual({ message });
    });
  });

  describe('patterns', () => {
    const patterns = Reflect.get(scrubber, 'patterns') as readonly RegExp[];

    it('lists the otpauth pattern first, before the e-mail pattern', () => {
      expect(patterns).toHaveLength(10);
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
