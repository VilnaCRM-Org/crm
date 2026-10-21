import { faker } from '@faker-js/faker';

import type {
  ProfileChange,
  ProfileFormValues,
  UserNode,
} from '@/modules/user/features/settings/types/user-profile';
import type { UserEntity } from '@/modules/user/types/user/user-entity';

import { buildUserId } from './auth';
import { buildGraphqlUser } from './graphql';
import { buildEmail, buildFullName, buildPassword } from './user';

export function buildUserIri(): string {
  return `/api/users/${buildUserId()}`;
}

export function buildUserEntity(overrides: Partial<UserEntity> = {}): UserEntity {
  return {
    id: buildUserIri(),
    fullName: buildFullName(),
    email: buildEmail(),
    confirmed: faker.datatype.boolean(),
    ...overrides,
  };
}

export function buildUserNode(overrides: Partial<UserNode> = {}): UserNode {
  return buildGraphqlUser({
    id: buildUserIri(),
    confirmed: faker.datatype.boolean(),
    ...overrides,
  });
}

export function buildProfileFormValues(
  overrides: Partial<ProfileFormValues> = {}
): ProfileFormValues {
  return {
    fullName: buildFullName(),
    email: buildEmail(),
    currentPassword: buildPassword(),
    newPassword: buildPassword(),
    ...overrides,
  };
}

export function buildProfileChange(overrides: Partial<ProfileChange> = {}): ProfileChange {
  return {
    id: buildUserIri(),
    currentPassword: buildPassword(),
    fullName: buildFullName(),
    ...overrides,
  };
}
