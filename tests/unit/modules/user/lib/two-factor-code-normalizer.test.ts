import TwoFactorCodeNormalizer from '@/modules/user/lib/two-factor-code-normalizer';
import type { TwoFactorCodeAcceptance } from '@/modules/user/types/two-factor/code';
import { buildRecoveryCode, buildTotpCode } from '@tests/builders';

const normalizer = new TwoFactorCodeNormalizer();

const normalize = (raw: string, accept: TwoFactorCodeAcceptance): string | null =>
  normalizer.normalize(raw, accept);

describe('TwoFactorCodeNormalizer', () => {
  describe('accepting a TOTP code', () => {
    it.each([
      ['123456', '123456'],
      ['123 456', '123456'],
      [' 123456 ', '123456'],
      ['1\t2 3\n4 5 6', '123456'],
      ['000000', '000000'],
    ])('turns %j into %s', (raw, expected) => {
      expect(normalize(raw, 'totp')).toBe(expected);
    });

    it.each([
      ['five digits', '12345'],
      ['seven digits', '1234567'],
      ['letters', 'abcdef'],
      ['digits with a letter', '12345a'],
      ['a hyphenated code', '123-456'],
      ['an empty string', ''],
      ['whitespace only', '   '],
      ['non-ASCII digits', '١٢٣٤٥٦'],
      ['a recovery code', 'ABCD-2345'],
      ['a plain recovery code', 'abcd2345'],
    ])('rejects %s', (_name, raw) => {
      expect(normalize(raw, 'totp')).toBeNull();
    });

    it('turns a generated TOTP code into itself', () => {
      const code = buildTotpCode();

      expect(normalize(code, 'totp')).toBe(code);
    });
  });

  describe('accepting a recovery code', () => {
    it.each([
      ['abcd2345', 'ABCD-2345'],
      ['abcd-2345', 'ABCD-2345'],
      ['ABCD-2345', 'ABCD-2345'],
      ['AbCd-2345', 'ABCD-2345'],
      [' abcd-2345 ', 'ABCD-2345'],
      ['abcd 2345', 'ABCD-2345'],
      ['12345678', '1234-5678'],
      ['1234-5678', '1234-5678'],
    ])('turns %j into %s', (raw, expected) => {
      expect(normalize(raw, 'recovery')).toBe(expected);
    });

    it.each([
      ['a short code', 'abc-123'],
      ['a long code', 'abcd-23456'],
      ['a misplaced hyphen', 'abc-d2345'],
      ['two hyphens', 'ab-cd-2345'],
      ['a TOTP code', '123456'],
      ['a symbol', 'abcd-234!'],
      ['an empty string', ''],
      ['a non-Latin letter', 'абвг-2345'],
    ])('rejects %s', (_name, raw) => {
      expect(normalize(raw, 'recovery')).toBeNull();
    });

    it('turns a generated recovery code into itself', () => {
      const code = buildRecoveryCode();

      expect(normalize(code, 'recovery')).toBe(code);
      expect(normalize(code.toLowerCase(), 'recovery')).toBe(code);
    });
  });

  describe('accepting either shape', () => {
    it.each([
      ['123456', '123456'],
      ['123 456', '123456'],
      ['abcd2345', 'ABCD-2345'],
      ['abcd-2345', 'ABCD-2345'],
      ['ABCD-2345', 'ABCD-2345'],
      ['12345678', '1234-5678'],
    ])('turns %j into %s', (raw, expected) => {
      expect(normalize(raw, 'any')).toBe(expected);
    });

    it.each(['12345', '1234567', 'abcdef', 'abc-123', 'abcd-23456', '', '  '])(
      'rejects %j',
      (raw) => {
        expect(normalize(raw, 'any')).toBeNull();
      }
    );
  });

  it('declares exactly one public method and no static member', () => {
    const prototypeMethods = Object.getOwnPropertyNames(TwoFactorCodeNormalizer.prototype);
    const staticMembers = Object.getOwnPropertyNames(TwoFactorCodeNormalizer).filter(
      (name) => !['length', 'name', 'prototype'].includes(name)
    );

    expect(prototypeMethods).toEqual(['constructor', 'normalize']);
    expect(staticMembers).toEqual([]);
  });

  it('is constructible with no argument and carries no state between calls', () => {
    const first = new TwoFactorCodeNormalizer();

    expect(first.normalize('123456', 'totp')).toBe('123456');
    expect(first.normalize('bad', 'totp')).toBeNull();
    expect(first.normalize('123456', 'totp')).toBe('123456');
  });
});
