export interface CreateUserInput {
  email: string;
  initials: string;
  password: string;
  clientMutationId?: string;
}

export interface User {
  id: string;
  confirmed: boolean;
  email: string;
  initials: string;
}

export interface CreateUserPayload {
  user: User;
  clientMutationId: string;
}

export interface CreateUserResponse {
  createUser: CreateUserPayload;
}
