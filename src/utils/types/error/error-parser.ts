import type ParsedError from '@/utils/error/types';

export type Matcher = {
  match: (error: unknown) => boolean;
  parse: (error: unknown) => ParsedError;
};
