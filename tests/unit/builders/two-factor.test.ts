import { faker } from '@faker-js/faker';

import {
  buildEmail,
  buildOtpauthUri,
  buildPendingSessionId,
  buildRecoveryCode,
  buildRecoveryCodeSet,
  buildTotpCode,
  buildTotpSecret,
} from '@tests/builders';

const SAMPLES = 200;
const SEED = 424242;

const sample = (build: () => string): string[] => Array.from({ length: SAMPLES }, () => build());

describe('two-factor builders', () => {
  it('builds a TOTP code of exactly six digits, leading zeros included', () => {
    const codes = sample(buildTotpCode);

    for (const code of codes) {
      expect(code).toMatch(/^\d{6}$/u);
    }
    expect(codes.some((code) => code.startsWith('0'))).toBe(true);
  });

  it('builds a recovery code as XXXX-XXXX from upper-case letters and digits', () => {
    const codes = sample(buildRecoveryCode);

    for (const code of codes) {
      expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/u);
    }
    expect(new Set(codes).size).toBeGreaterThan(SAMPLES - 5);
  });

  it('builds a pending session id as a 26-character ULID-shaped string', () => {
    const ids = sample(buildPendingSessionId);

    for (const id of ids) {
      expect(id).toHaveLength(26);
      expect(id).toMatch(/^[0-7][0-9A-HJKMNP-TV-Z]{25}$/u);
    }
    expect(new Set(ids).size).toBe(SAMPLES);
  });

  it('builds a TOTP secret of 32 base32 characters', () => {
    const secrets = sample(buildTotpSecret);

    for (const secret of secrets) {
      expect(secret).toMatch(/^[A-Z2-7]{32}$/u);
    }
    expect(new Set(secrets).size).toBe(SAMPLES);
  });

  it('builds an otpauth URI with a percent-encoded e-mail label and the issuer', () => {
    const email = buildEmail();
    const secret = buildTotpSecret();

    const uri = buildOtpauthUri(email, secret);

    expect(uri).toBe(
      `otpauth://totp/VilnaCRM%3A${encodeURIComponent(email)}?secret=${secret}&issuer=VilnaCRM`
    );
    expect(uri).toContain('%40');
    expect(uri).not.toContain('@');
  });

  it('defaults the otpauth label and secret to generated values', () => {
    const uri = buildOtpauthUri();

    expect(uri).toMatch(
      /^otpauth:\/\/totp\/VilnaCRM%3A[^@?&\s]+%40[^@?&\s]+\?secret=[A-Z2-7]{32}&issuer=VilnaCRM$/u
    );
  });

  it.each([
    ['buildTotpCode', buildTotpCode],
    ['buildRecoveryCode', buildRecoveryCode],
    ['buildPendingSessionId', buildPendingSessionId],
    ['buildTotpSecret', buildTotpSecret],
    ['buildOtpauthUri', (): string => buildOtpauthUri()],
  ])('makes %s deterministic per seed', (_name, build) => {
    faker.seed(SEED);
    const first = [build(), build()];
    faker.seed(SEED);
    const second = [build(), build()];

    expect(second).toEqual(first);
    expect(first[0]).not.toBe(first[1]);
  });

  it('builds a recovery code set of eight XXXX-XXXX codes in an items collection', () => {
    const set = buildRecoveryCodeSet();

    expect(Object.keys(set)).toEqual(['items']);
    expect(set.items).toHaveLength(8);
    for (const code of set.items) {
      expect(Object.keys(code)).toEqual(['value']);
      expect(code.value).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/u);
    }
  });

  it('makes buildRecoveryCodeSet deterministic per seed and different per call', () => {
    faker.seed(SEED);
    const first = [buildRecoveryCodeSet(), buildRecoveryCodeSet()];
    faker.seed(SEED);
    const second = [buildRecoveryCodeSet(), buildRecoveryCodeSet()];

    expect(second).toEqual(first);
    expect(first[0]).not.toEqual(first[1]);
  });
});
