import type ParsedError from '@/utils/error/types';

export interface Matcher {
  match(error: unknown): boolean;
  parse(error: unknown): ParsedError;
}
