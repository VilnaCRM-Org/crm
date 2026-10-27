import { faker } from '@faker-js/faker';

import { buildEmail } from './user';

const CROCKFORD_BASE32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ULID_FIRST_CHARACTERS = '01234567';
const RFC4648_BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const ULID_LENGTH = 26;
const TOTP_SECRET_LENGTH = 32;

export function buildTotpCode(): string {
  return faker.string.numeric({ length: 6, allowLeadingZeros: true });
}

export function buildRecoveryCode(): string {
  const group = (): string => faker.string.alphanumeric({ length: 4, casing: 'upper' });

  return `${group()}-${group()}`;
}

export function buildPendingSessionId(): string {
  const first = faker.string.fromCharacters(ULID_FIRST_CHARACTERS, 1);
  const rest = faker.string.fromCharacters(CROCKFORD_BASE32, ULID_LENGTH - 1);

  return `${first}${rest}`;
}

export function buildTotpSecret(): string {
  return faker.string.fromCharacters(RFC4648_BASE32, TOTP_SECRET_LENGTH);
}

export function buildOtpauthUri(
  email: string = buildEmail(),
  secret: string = buildTotpSecret()
): string {
  return `otpauth://totp/VilnaCRM%3A${encodeURIComponent(email)}?secret=${secret}&issuer=VilnaCRM`;
}
