import { useMutation, MutationTuple } from '@apollo/client';
import { v4 as uuidv4 } from 'uuid';

import { CREATE_USER } from '../graphql';
import { CreateUserInput, CreateUserResponse } from '../graphql/types';

export interface CreateUserVariables {
  fullName: string;
  email: string;
  password: string;
}

type UseCreateUserReturn = MutationTuple<CreateUserResponse, { input: CreateUserInput }>;

export default function useCreateUser(): UseCreateUserReturn {
  return useMutation(CREATE_USER);
}

export function buildCreateUserInput(variables: CreateUserVariables): CreateUserInput {
  const normalizedFullName = variables.fullName.trim();

  return {
    email: variables.email,
    initials: normalizedFullName,
    password: variables.password,
    clientMutationId: uuidv4(),
  };
}
