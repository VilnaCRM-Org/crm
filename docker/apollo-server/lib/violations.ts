import { GraphQLError } from 'graphql';

const EMAIL_LOCAL = String.raw`[a-zA-Z0-9.!#$%&'*+/=?^_\`{|}~-]+`;
const EMAIL_LABEL = String.raw`[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?`;

export const EMAIL_REGEX = new RegExp(`^${EMAIL_LOCAL}@${EMAIL_LABEL}(?:\\.${EMAIL_LABEL})*$`);

export const MAX_EMAIL_LENGTH = 254;

export const rejectViolation = (property: string, reason: string): never => {
  throw new GraphQLError(`${property}: ${reason}`, {
    extensions: { code: 'BAD_USER_INPUT', status: 422 },
  });
};
