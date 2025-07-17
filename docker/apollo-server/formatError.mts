import { GraphQLFormattedError } from 'graphql';
import { CustomFormattedError } from './type.js';
import { ApolloServerErrorCode } from '@apollo/server/errors';

export const formatError = (
  formattedError: GraphQLFormattedError,
  error: unknown
): CustomFormattedError => {
  if (formattedError?.extensions?.code === 'INTERNAL_SERVER_ERROR') {
    return {
      ...formattedError,
      message: 'Something went wrong on the server. Please try again later.',
      details: (error as Error).message,
    };
  }

  if (formattedError?.extensions?.code === 'BAD_REQUEST') {
    return {
      ...formattedError,
      message: 'The request was invalid. Please check your input.',
      details: (error as Error).message,
    };
  }

  if (formattedError?.extensions?.code === ApolloServerErrorCode.GRAPHQL_VALIDATION_FAILED) {
    return {
      ...formattedError,
      message: "Your query doesn't match the schema. Please check it!",
    };
  }

  return formattedError;
};
