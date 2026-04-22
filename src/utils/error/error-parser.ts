import { injectable } from 'tsyringe';

import ApiError from '@/modules/User/features/Auth/api/ApiErrors/api-error';

import ParsedError from './types';

type Matcher = { match: (error: unknown) => boolean; parse: (error: unknown) => ParsedError };

const UNKNOWN_ERROR: Omit<ParsedError, 'original'> = {
  code: 'UNKNOWN_ERROR',
  message: 'An unknown error occurred',
};

@injectable()
export default class ErrorParser {
  private static readonly defaultInstance = new ErrorParser();

  private readonly matchers: Matcher[];

  constructor() {
    this.matchers = [
      {
        match: (error): boolean => typeof Response !== 'undefined' && error instanceof Response,
        parse: (error): ParsedError => {
          const response = error as Response;
          return {
            code: `HTTP_${response.status}`,
            message: `HTTP error ${response.status}`,
            original: response,
          };
        },
      },
      {
        match: (error): boolean => error instanceof ApiError,
        parse: (error): ParsedError => {
          const apiError = error as ApiError;
          return { code: apiError.code, message: apiError.message, original: apiError };
        },
      },
      {
        match: (error): boolean => error instanceof Error,
        parse: (error): ParsedError => {
          const jsError = error as Error;
          return { code: 'JS_ERROR', message: jsError.message, original: jsError };
        },
      },
    ];
  }

  public static parseHttpError(error: unknown): ParsedError {
    return this.defaultInstance.parse(error);
  }

  public parseHttpError(error: unknown): ParsedError {
    return this.parse(error);
  }

  private parse(error: unknown): ParsedError {
    const matched = this.matchers.find((matcher) => matcher.match(error));
    return matched ? matched.parse(error) : { ...UNKNOWN_ERROR, original: error };
  }
}
