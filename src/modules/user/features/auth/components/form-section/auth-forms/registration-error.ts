import { ApolloError } from '@apollo/client';

type GraphQLErrorLike = {
  message?: string;
  extensions?: {
    code?: string;
  };
};

type ApolloErrorLike = ApolloError & {
  errors?: GraphQLErrorLike[];
  cause?: {
    errors?: GraphQLErrorLike[];
  };
  networkError?: {
    result?: {
      errors?: GraphQLErrorLike[];
    };
  };
};

function getGraphQLErrorCandidates(error: ApolloErrorLike): GraphQLErrorLike[] {
  return [
    ...(error.graphQLErrors ?? []),
    ...(error.errors ?? []),
    ...(error.cause?.errors ?? []),
    ...(error.networkError?.result?.errors ?? []),
  ];
}

function isConflictError(error: ApolloErrorLike): boolean {
  const candidates = getGraphQLErrorCandidates(error);

  if (candidates.some((candidate) => candidate?.extensions?.code === 'CONFLICT')) {
    return true;
  }

  if (
    candidates.some((candidate) =>
      (candidate?.message ?? '').toLowerCase().includes('email already exists')
    )
  ) {
    return true;
  }

  return (error.message ?? '').toLowerCase().includes('email already exists');
}

export default function getRegistrationErrorMessage(
  error: ApolloError | undefined,
  t: (key: string) => string
): string | null {
  if (!error) return null;

  if (isConflictError(error as ApolloErrorLike)) {
    return t('sign_up.errors.email_used');
  }

  return t('sign_up.errors.signup_error');
}
