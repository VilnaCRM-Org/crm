import { buildClientMutationId, buildUserId } from './auth';
import { buildEmail, buildFullName } from './user';

export interface CreateUserInputData {
  email: string;
  initials: string;
  clientMutationId: string;
}

export interface GraphqlUserData {
  id: string;
  confirmed: boolean;
  email: string;
  initials: string;
}

export function buildCreateUserInput(
  overrides: Partial<CreateUserInputData> = {}
): CreateUserInputData {
  return {
    email: buildEmail(),
    initials: buildFullName(),
    clientMutationId: buildClientMutationId(),
    ...overrides,
  };
}

export function buildGraphqlUser(overrides: Partial<GraphqlUserData> = {}): GraphqlUserData {
  return {
    id: buildUserId(),
    confirmed: true,
    email: buildEmail(),
    initials: buildFullName(),
    ...overrides,
  };
}
