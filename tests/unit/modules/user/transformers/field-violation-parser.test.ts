import { faker } from '@faker-js/faker';

import FieldViolationParser from '@/modules/user/transformers/field-violation-parser';
import loadIsolated from '@tests/unit/utils/isolated-module';

const loadParser = async (): Promise<FieldViolationParser> => {
  const Parser = await loadIsolated(
    async () => (await import('@/modules/user/transformers/field-violation-parser')).default
  );
  return new Parser();
};

describe('FieldViolationParser', () => {
  it.each(['email', 'token', 'newPassword', 'initials', 'password', 'twoFactorCode'])(
    'reads a freshly loaded %s line as an other violation on that path',
    async (path) => {
      const parser = await loadParser();

      expect(parser.parse(`${path}: ${faker.lorem.sentence()}`)).toEqual({
        items: [{ path, reason: 'other' }],
        complete: true,
      });
    }
  );

  it.each([
    ['en', 'This email address is already registered'],
    ['uk', 'Ця email-адреса вже зареєстрована'],
  ])('reads the freshly loaded %s uniqueness message as taken', async (_locale, text) => {
    const parser = await loadParser();

    expect(parser.parse(`email:   ${text}  `)).toEqual({
      items: [{ path: 'email', reason: 'taken' }],
      complete: true,
    });
  });

  it('returns null when no line names a known property', () => {
    expect(new FieldViolationParser().parse(`clientMutationId: ${faker.lorem.word()}`)).toBeNull();
    expect(new FieldViolationParser().parse(faker.lorem.sentence())).toBeNull();
  });

  it('skips whitespace-only lines, so the remaining violations still make a complete set', () => {
    const message = ['initials: too short', '   ', 'newPassword: too weak', ''].join('\n');

    expect(new FieldViolationParser().parse(message)).toEqual({
      items: [
        { path: 'initials', reason: 'other' },
        { path: 'newPassword', reason: 'other' },
      ],
      complete: true,
    });
  });

  it('marks the set incomplete when a CRLF-separated line names no property', () => {
    const message = ['initials: too short', 'clientMutationId: bad'].join('\r\n');

    expect(new FieldViolationParser().parse(message)).toEqual({
      items: [{ path: 'initials', reason: 'other' }],
      complete: false,
    });
  });

  it('requires the property name followed by a colon at the start of the line', () => {
    expect(new FieldViolationParser().parse('my email: wrong')).toBeNull();
    expect(new FieldViolationParser().parse('email wrong')).toBeNull();
  });
});
