import { GraphQLError } from 'graphql';

const LOCAL_PART = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
const DOMAIN_LABEL = /^(?:[a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])$/;

export const MAX_EMAIL_LENGTH = 254;

const everySegmentMatches = (value: string, segment: RegExp): boolean =>
  value.split('.').every((part) => segment.test(part));

export const isValidEmail = (email: string): boolean => {
  const at = email.lastIndexOf('@');
  return (
    at !== -1 &&
    LOCAL_PART.test(email.slice(0, at)) &&
    everySegmentMatches(email.slice(at + 1), DOMAIN_LABEL)
  );
};

export const rejectViolation = (property: string, reason: string): never => {
  throw new GraphQLError(`${property}: ${reason}`, {
    extensions: { code: 'BAD_USER_INPUT', status: 422 },
  });
};
