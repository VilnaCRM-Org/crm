import { GraphQLError } from 'graphql';

import {
  isValidEmail,
  MAX_EMAIL_LENGTH,
  rejectViolation,
} from '../../docker/apollo-server/lib/violations';

const label63 = 'a'.repeat(63);

describe('isValidEmail', () => {
  it.each([
    ['a plain address', 'user@example.com'],
    ['a dotted local part', 'test.user+tag@example.com'],
    ['every special local character', "a!#$%&'*+/=?^_`{|}~-z@example.com"],
    ['a single-character local part and label', 'a@b'],
    ['a domain without a dot', 'user@localhost'],
    ['a subdomain', 'user@mail.example.com'],
    ['digits in both parts', 'user123@example456.com'],
    ['a hyphen inside a label', 'user@ex-ample.com'],
    ['a 63-character label', `user@${label63}.com`],
    ['a two-character label', 'user@ab.com'],
    ['a leading dot in the local part, as html5 mode allows', '.user@example.com'],
    ['a trailing dot in the local part, as html5 mode allows', 'user.@example.com'],
    ['consecutive dots in the local part, as html5 mode allows', 'user..name@example.com'],
    ['a lone dot as the local part, as html5 mode allows', '.@example.com'],
  ])('accepts %s', (_shape, email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each([
    ['no @', 'invalidemail.com'],
    ['two @', 'user@mail@example.com'],
    ['an empty local part', '@example.com'],
    ['an empty domain', 'user@'],
    ['a space in the local part', 'test user@example.com'],
    ['a leading dot in the domain', 'user@.example.com'],
    ['a trailing dot in the domain', 'user@example.com.'],
    ['consecutive dots in the domain', 'user@example..com'],
    ['a label starting with a hyphen', 'user@-example.com'],
    ['a label ending with a hyphen', 'user@example-.com'],
    ['a lone hyphen label', 'user@-.com'],
    ['a 64-character label', `user@${label63}a.com`],
    ['an underscore in the domain', 'user@exa_mple.com'],
    ['a trailing newline', 'user@example.com\n'],
    ['a leading newline', '\nuser@example.com'],
    ['only spaces', '   '],
  ])('rejects %s', (_shape, email) => {
    expect(isValidEmail(email)).toBe(false);
  });
});

describe('MAX_EMAIL_LENGTH', () => {
  it('is the RFC 5321 path limit', () => {
    expect(MAX_EMAIL_LENGTH).toBe(254);
  });
});

describe('rejectViolation', () => {
  it('throws a coded 422 violation naming the property', () => {
    const thrown = ((): unknown => {
      try {
        return rejectViolation('email', 'This value is not a valid email address.');
      } catch (caught: unknown) {
        return caught;
      }
    })();

    expect(thrown).toBeInstanceOf(GraphQLError);
    expect(thrown).toMatchObject({
      message: 'email: This value is not a valid email address.',
      extensions: { code: 'BAD_USER_INPUT', status: 422 },
    });
  });
});
