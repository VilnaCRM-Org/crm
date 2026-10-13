import type ParsedError from '@/utils/error/types';

export type ErrorPredicate = (error: unknown) => boolean;

export type ErrorParseFunction = (error: unknown) => ParsedError;

export interface Matcher {
  match: ErrorPredicate;
  parse: ErrorParseFunction;
}
