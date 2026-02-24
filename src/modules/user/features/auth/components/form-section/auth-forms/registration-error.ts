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
  passwordError: string | null;
  nameError: string | null;
};

const EMAIL_PREFIX = /^email\s*:\s*/i;
const PASSWORD_PREFIX = /^password\s*:\s*/i;
const INITIALS_PREFIX = /^initials\s*:\s*/i;

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

const PASSWORD_UPPERCASE_PATTERNS = [
  'at least one uppercase letter',
  'принаймні одну велику літеру',
] as const;

const PASSWORD_NUMBERS_PATTERNS = ['at least one number', 'хоча б одне число'] as const;

const PASSWORD_LENGTH_PATTERNS = ['between 8 and 64 characters', 'від 8 до 64 символів'] as const;

const PASSWORD_REQUIRED_PATTERNS = ['not be blank', 'not.blank', 'не має бути пустим'] as const;

const INITIALS_SPACES_PATTERNS = [
  'cannot consist only of spaces',
  'не можуть складатися лише з пробілів',
] as const;

const INITIALS_REQUIRED_PATTERNS = ['not be blank', 'not.blank', 'не має бути пустим'] as const;

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

  if (matchesAnyPattern(normalized, EMAIL_REQUIRED_PATTERNS))
    return t('sign_up.form.email_input.required');
  if (matchesAnyPattern(normalized, EMAIL_INVALID_PATTERNS))
    return t('sign_up.form.email_input.invalid_message');

  return message;
}

function mapPasswordMessage(message: string, t: (key: string) => string): string {
  const normalized = normalize(message);

  if (matchesAnyPattern(normalized, PASSWORD_REQUIRED_PATTERNS))
    return t('sign_up.form.password_input.required');
  if (matchesAnyPattern(normalized, PASSWORD_UPPERCASE_PATTERNS))
    return t('sign_up.form.password_input.error_uppercase');
  if (matchesAnyPattern(normalized, PASSWORD_NUMBERS_PATTERNS))
    return t('sign_up.form.password_input.error_numbers');
  if (matchesAnyPattern(normalized, PASSWORD_LENGTH_PATTERNS))
    return t('sign_up.form.password_input.error_length');

  return message;
}

function mapInitialsMessage(message: string, t: (key: string) => string): string {
  const normalized = normalize(message);

  if (matchesAnyPattern(normalized, INITIALS_REQUIRED_PATTERNS))
    return t('sign_up.form.name_input.required');
  if (matchesAnyPattern(normalized, INITIALS_SPACES_PATTERNS))
    return t('sign_up.form.name_input.only_spaces_error');

  return message;
}

const NO_ERROR: RegistrationErrorState = {
  formError: null,
  emailError: null,
  passwordError: null,
  nameError: null,
};

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

  return { formError: t('sign_up.errors.signup_error') };
}

export default function getRegistrationErrorMessage(
  error: ApolloError | undefined,
  t: (key: string) => string
): RegistrationErrorState {
  if (!error) return NO_ERROR;
  return { ...NO_ERROR, ...resolveFieldError(error as ApolloErrorLike, t) };
}
