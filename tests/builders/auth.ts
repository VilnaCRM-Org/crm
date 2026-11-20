import { faker } from '@faker-js/faker';

import type { RegistrationResponse } from '@/modules/user/features/auth/types/api-responses';

import { buildEmail, buildFullName } from './user';

export function buildToken(): string {
  return faker.internet.jwt();
}

export function buildResetToken(): string {
  return faker.string.alphanumeric(32);
}

export function buildUserId(): string {
  return faker.string.uuid();
}

export function buildClientMutationId(): string {
  return faker.string.uuid();
}

export function buildRegistrationResponse(
  overrides: Partial<RegistrationResponse> = {}
): RegistrationResponse {
  return {
    fullName: buildFullName(),
    email: buildEmail(),
    ...overrides,
  };
}
