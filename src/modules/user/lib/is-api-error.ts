import type { APIError } from './is-api-error.types';

const hasStringProp = (obj: Record<string, unknown>, key: string): boolean =>
  key in obj && typeof obj[key] === 'string';

function isAPIError(err: unknown): err is APIError {
  if (typeof err !== 'object' || err === null) return false;
  const record = err as Record<string, unknown>;
  return hasStringProp(record, 'code') && hasStringProp(record, 'message');
}

export default isAPIError;
