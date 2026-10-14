import { faker } from '@faker-js/faker';

import type { RegisterUserDto } from '@/modules/user/features/auth/types/credentials';

const NAME_PART = /[A-Za-z]{3,10}/;

export function buildNamePart(): string {
  return faker.helpers.fromRegExp(NAME_PART);
}

export function buildFullName(): string {
  return `${buildNamePart()} ${buildNamePart()}`;
}

export function buildEmail(): string {
  return faker.internet.email({ allowSpecialCharacters: false }).toLowerCase();
}

export function buildPassword(): string {
  const upper = faker.string.alpha({ length: 1, casing: 'upper' });
  const lower = faker.string.alpha({ length: 1, casing: 'lower' });
  const digit = faker.string.numeric({ length: 1 });
  const rest = faker.string.alphanumeric({ length: 13 });
  return faker.helpers.shuffle(`${upper}${lower}${digit}${rest}`.split('')).join('');
}

export function buildUser(overrides: Partial<RegisterUserDto> = {}): RegisterUserDto {
  return {
    fullName: buildFullName(),
    email: buildEmail(),
    password: buildPassword(),
    ...overrides,
  };
}
