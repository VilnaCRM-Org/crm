import { faker } from '@faker-js/faker';

import type {
  LoginResponse,
  RegistrationResponse,
} from '@/modules/user/features/auth/types/api-responses';

import { buildEmail, buildFullName } from './user';

export function buildToken(): string {
  return faker.internet.jwt();
}

export function buildUserId(): string {
  return faker.string.uuid();
}

export function buildClientMutationId(): string {
  return faker.string.uuid();
}

export function buildLoginResponse(overrides: Partial<LoginResponse> = {}): LoginResponse {
  return {
    token: buildToken(),
    ...overrides,
  };
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
