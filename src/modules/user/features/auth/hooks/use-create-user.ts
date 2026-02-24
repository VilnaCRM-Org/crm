import {
  useMutation,
  MutationTuple,
  MutationFunctionOptions,
  DefaultContext,
} from '@apollo/client';
import { v4 as uuidv4 } from 'uuid';

import { CREATE_USER } from '../types/graphql';
import { CreateUserInput, CreateUserResponse } from '../types/graphql/types';

export interface CreateUserVariables {
  fullName: string;
  email: string;
  password: string;
}

type UseCreateUserReturn = MutationTuple<CreateUserResponse, { input: CreateUserInput }>;
type CreateUserMutationFn = UseCreateUserReturn[0];
type CreateUserMutationOptions = Parameters<CreateUserMutationFn>[0];

type RequestContext = DefaultContext & {
  fetchOptions?: RequestInit;
};

export const CREATE_USER_TIMEOUT_MS = 15000;

export default function useCreateUser(): UseCreateUserReturn {
  const [mutate, result] = useMutation(CREATE_USER);

  const createUserWithTimeout: CreateUserMutationFn = (options) => {
    const requestContext = options?.context as RequestContext | undefined;
    const existingSignal = requestContext?.fetchOptions?.signal;

    if (existingSignal) {
      return mutate(
        options as MutationFunctionOptions<CreateUserResponse, { input: CreateUserInput }>
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CREATE_USER_TIMEOUT_MS);

    const mergedContext: RequestContext = {
      ...(requestContext ?? {}),
      fetchOptions: {
        ...(requestContext?.fetchOptions ?? {}),
        signal: controller.signal,
      },
    };

    const mutationOptions: CreateUserMutationOptions = {
      ...(options ?? {}),
      context: mergedContext,
    };

    return mutate(
      mutationOptions as MutationFunctionOptions<CreateUserResponse, { input: CreateUserInput }>
    ).finally(() => {
      clearTimeout(timeoutId);
    });
  };

  return [createUserWithTimeout, result];
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
