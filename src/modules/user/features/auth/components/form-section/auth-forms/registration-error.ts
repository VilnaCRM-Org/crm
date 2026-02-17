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

export type RegistrationErrorState = {
  formError: string | null;
  emailError: string | null;
};

const EMAIL_PREFIX = /^email\s*:\s*/i;
const EMAIL_CONFLICT_PATTERNS = [
  'email already exists',
  'email address is already registered',
  'email.not.unique',
  'email already in use',
  'email-адреса вже використовується',
  'ця email-адреса вже зареєстрована',
] as const;

const EMAIL_INVALID_PATTERNS = [
  'not a valid email address',
  'email.invalid',
  'не є дійсною електронною адресою',
] as const;

const EMAIL_REQUIRED_PATTERNS = ['not be blank', 'not.blank', 'не має бути пустим'] as const;

function getGraphQLErrorCandidates(error: ApolloErrorLike): GraphQLErrorLike[] {
  return [
    ...(error.graphQLErrors ?? []),
    ...(error.errors ?? []),
    ...(error.cause?.errors ?? []),
    ...(error.networkError?.result?.errors ?? []),
  ].filter((candidate): candidate is GraphQLErrorLike => Boolean(candidate));
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function matchesAnyPattern(message: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => message.includes(pattern));
}

function getAllMessages(error: ApolloErrorLike): string[] {
  return [
    ...getGraphQLErrorCandidates(error).map((candidate) => candidate.message ?? ''),
    error.message ?? '',
  ];
}

function isConflictError(error: ApolloErrorLike): boolean {
  const candidates = getGraphQLErrorCandidates(error);

  if (candidates.some((candidate) => candidate.extensions?.code === 'CONFLICT')) {
    return true;
  }

  return getAllMessages(error).some((msg) =>
    matchesAnyPattern(normalize(msg), EMAIL_CONFLICT_PATTERNS)
  );
}

function extractEmailValidationMessage(error: ApolloErrorLike): string | null {
  const candidate = getGraphQLErrorCandidates(error).find((c) =>
    EMAIL_PREFIX.test(c.message ?? '')
  );

  if (candidate?.message) {
    return candidate.message.trim().replace(EMAIL_PREFIX, '').trim() || null;
  }

  const rootMessage = (error.message ?? '').trim();
  if (rootMessage && EMAIL_PREFIX.test(rootMessage)) {
    return rootMessage.replace(EMAIL_PREFIX, '').trim();
  }

  return null;
}

function mapEmailValidationMessage(message: string, t: (key: string) => string): string {
  const normalized = normalize(message);

  if (matchesAnyPattern(normalized, EMAIL_REQUIRED_PATTERNS)) {
    return t('sign_up.form.email_input.required');
  }

  if (matchesAnyPattern(normalized, EMAIL_INVALID_PATTERNS)) {
    return t('sign_up.form.email_input.invalid_message');
  }

  return message;
}

export default function getRegistrationErrorMessage(
  error: ApolloError | undefined,
  t: (key: string) => string
): RegistrationErrorState {
  if (!error) {
    return { formError: null, emailError: null };
  }

  if (isConflictError(error as ApolloErrorLike)) {
    return {
      formError: null,
      emailError: t('sign_up.errors.email_used'),
    };
  }

  const emailValidationMessage = extractEmailValidationMessage(error as ApolloErrorLike);
  if (emailValidationMessage) {
    return {
      formError: null,
      emailError: mapEmailValidationMessage(emailValidationMessage, t),
    };
  }

  return {
    formError: t('sign_up.errors.signup_error'),
    emailError: null,
  };
}
