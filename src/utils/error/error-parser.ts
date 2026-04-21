import ApiError from '@/modules/User/features/Auth/api/ApiErrors/api-error';

import ParsedError from './types';

type Matcher = { match: (e: unknown) => boolean; parse: (e: unknown) => ParsedError };

const matchers: Matcher[] = [
  {
    match: (e): boolean => typeof Response !== 'undefined' && e instanceof Response,
    parse: (e): ParsedError => {
      const r = e as Response;
      return { code: `HTTP_${r.status}`, message: `HTTP error ${r.status}`, original: r };
    },
  },
  {
    match: (e): boolean => e instanceof ApiError,
    parse: (e): ParsedError => {
      const a = e as ApiError;
      return { code: a.code, message: a.message, original: a };
    },
  },
  {
    match: (e): boolean => e instanceof Error,
    parse: (e): ParsedError => {
      const err = e as Error;
      return { code: 'JS_ERROR', message: err.message, original: err };
    },
  },
];

const UNKNOWN_ERROR: Omit<ParsedError, 'original'> = {
  code: 'UNKNOWN_ERROR',
  message: 'An unknown error occurred',
};

export default class ErrorParser {
  public static parseHttpError(error: unknown): ParsedError {
    const matched = matchers.find((m) => m.match(error));
    return matched ? matched.parse(error) : { ...UNKNOWN_ERROR, original: error };
  }
}
