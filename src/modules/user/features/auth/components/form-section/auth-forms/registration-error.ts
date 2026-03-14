import { ApolloError } from '@apollo/client';

type GraphQLErrorLike = {
  message?: string;
  extensions?: {
    code?: string;
    statusCode?: number;
  };
};

type ApolloErrorLike = ApolloError & {
  errors?: GraphQLErrorLike[];
  cause?: {
    errors?: GraphQLErrorLike[];
  };
  networkError?: {
    statusCode?: number;
    result?: {
      errors?: GraphQLErrorLike[];
    };
  };
};

export type RegistrationErrorState = {
  formError: string | null;
  emailError: string | null;
  passwordError: string | null;
  nameError: string | null;
};

const EMAIL_PREFIX = /^email\s*:\s*/i;
const PASSWORD_PREFIX = /^password\s*:\s*/i;
const INITIALS_PREFIX = /^initials\s*:\s*/i;

const GRAPHQL_ERROR_CODES = {
  CONFLICT: 'CONFLICT',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
} as const;

// Backend currently returns field errors as free-form messages in EN/UK locales.
// We prefer extension codes when available; these phrases are controlled fallbacks.
const REGISTRATION_ERROR_PATTERNS = {
  emailConflict: [
    'email already exists',
    'email address is already registered',
    'email.not.unique',
    'email already in use',
    'email-адреса вже використовується',
    'ця email-адреса вже зареєстрована',
  ],
  emailInvalid: ['not a valid email address', 'email.invalid', 'не є дійсною електронною адресою'],
  required: ['not be blank', 'not.blank', 'не має бути пустим'],
  passwordUppercase: ['at least one uppercase letter', 'принаймні одну велику літеру'],
  passwordNumbers: ['at least one number', 'хоча б одне число'],
  passwordLength: ['between 8 and 64 characters', 'від 8 до 64 символів'],
  initialsSpaces: ['cannot consist only of spaces', 'не можуть складатися лише з пробілів'],
  network: [
    'failed to fetch',
    'network request failed',
    'fetch failed',
    'network error',
    'request to',
  ],
} as const;

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

  if (candidates.some((candidate) => candidate.extensions?.code === GRAPHQL_ERROR_CODES.CONFLICT)) {
    return true;
  }

  return getAllMessages(error).some((msg) =>
    matchesAnyPattern(normalize(msg), REGISTRATION_ERROR_PATTERNS.emailConflict)
  );
}

function extractMessageByPrefix(error: ApolloErrorLike, prefix: RegExp): string | null {
  const candidate = getGraphQLErrorCandidates(error).find((c) => prefix.test(c.message ?? ''));

  if (candidate?.message) {
    return candidate.message.trim().replace(prefix, '').trim() || null;
  }

  const rootMessage = (error.message ?? '').trim();
  if (rootMessage && prefix.test(rootMessage)) {
    return rootMessage.replace(prefix, '').trim() || null;
  }

  return null;
}

function mapEmailMessage(message: string, t: (key: string) => string): string {
  const normalized = normalize(message);

  if (matchesAnyPattern(normalized, REGISTRATION_ERROR_PATTERNS.required))
    return t('sign_up.form.email_input.required');
  if (matchesAnyPattern(normalized, REGISTRATION_ERROR_PATTERNS.emailInvalid))
    return t('sign_up.form.email_input.invalid_message');

  return message;
}

function mapPasswordMessage(message: string, t: (key: string) => string): string {
  const normalized = normalize(message);

  if (matchesAnyPattern(normalized, REGISTRATION_ERROR_PATTERNS.required))
    return t('sign_up.form.password_input.required');
  if (matchesAnyPattern(normalized, REGISTRATION_ERROR_PATTERNS.passwordUppercase))
    return t('sign_up.form.password_input.error_uppercase');
  if (matchesAnyPattern(normalized, REGISTRATION_ERROR_PATTERNS.passwordNumbers))
    return t('sign_up.form.password_input.error_numbers');
  if (matchesAnyPattern(normalized, REGISTRATION_ERROR_PATTERNS.passwordLength))
    return t('sign_up.form.password_input.error_length');

  return message;
}

function mapInitialsMessage(message: string, t: (key: string) => string): string {
  const normalized = normalize(message);

  if (matchesAnyPattern(normalized, REGISTRATION_ERROR_PATTERNS.required))
    return t('sign_up.form.name_input.required');
  if (matchesAnyPattern(normalized, REGISTRATION_ERROR_PATTERNS.initialsSpaces))
    return t('sign_up.form.name_input.only_spaces_error');

  return message;
}

const NO_ERROR: RegistrationErrorState = {
  formError: null,
  emailError: null,
  passwordError: null,
  nameError: null,
};

function resolveFormError(error: ApolloErrorLike, t: (key: string) => string): string {
  const statusCode = error.networkError?.statusCode;
  if (statusCode === 401) return t('failure_responses.authentication_errors.unauthorized_access');
  if (statusCode === 403) return t('failure_responses.authentication_errors.access_denied');
  if (statusCode !== undefined && statusCode >= 500 && statusCode < 600) {
    return t('failure_responses.server_errors.server_error');
  }

  const candidates = getGraphQLErrorCandidates(error);
  if (
    candidates.some(
      (c) =>
        c.extensions?.code === GRAPHQL_ERROR_CODES.INTERNAL_SERVER_ERROR ||
        c.extensions?.code === GRAPHQL_ERROR_CODES.SERVER_ERROR
    )
  ) {
    return t('failure_responses.server_errors.server_error');
  }
  if (
    candidates.some(
      (c) =>
        c.extensions?.code === GRAPHQL_ERROR_CODES.UNAUTHORIZED ||
        c.extensions?.code === GRAPHQL_ERROR_CODES.UNAUTHENTICATED
    )
  ) {
    return t('failure_responses.authentication_errors.unauthorized_access');
  }
  if (candidates.some((c) => c.extensions?.code === GRAPHQL_ERROR_CODES.FORBIDDEN)) {
    return t('failure_responses.authentication_errors.access_denied');
  }

  if (error.networkError != null && statusCode === undefined) {
    return t('failure_responses.network_errors.network_error');
  }

  const message = normalize(error.message ?? '');
  if (REGISTRATION_ERROR_PATTERNS.network.some((pattern) => message.includes(pattern))) {
    return t('failure_responses.network_errors.network_error');
  }

  return t('failure_responses.client_errors.something_went_wrong');
}

function resolveFieldError(
  error: ApolloErrorLike,
  t: (key: string) => string
): Partial<RegistrationErrorState> {
  if (isConflictError(error)) {
    return { emailError: t('sign_up.errors.email_used') };
  }

  const emailMessage = extractMessageByPrefix(error, EMAIL_PREFIX);
  if (emailMessage) {
    return { emailError: mapEmailMessage(emailMessage, t) };
  }

  const passwordMessage = extractMessageByPrefix(error, PASSWORD_PREFIX);
  if (passwordMessage) {
    return { passwordError: mapPasswordMessage(passwordMessage, t) };
  }

  const initialsMessage = extractMessageByPrefix(error, INITIALS_PREFIX);
  if (initialsMessage) {
    return { nameError: mapInitialsMessage(initialsMessage, t) };
  }

  return { formError: resolveFormError(error, t) };
}

export default function getRegistrationErrorMessage(
  error: ApolloError | undefined,
  t: (key: string) => string
): RegistrationErrorState {
  if (!error) return NO_ERROR;
  return { ...NO_ERROR, ...resolveFieldError(error as ApolloErrorLike, t) };
}
