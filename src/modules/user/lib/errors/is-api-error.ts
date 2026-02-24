interface APIError {
  code: string;
  message: string;
}

function hasStringProp(obj: object, key: string): boolean {
  return key in obj && typeof (obj as Record<string, unknown>)[key] === 'string';
}

function isAPIError(err: unknown): err is APIError {
  if (typeof err !== 'object' || err === null) return false;
  return hasStringProp(err, 'code') && hasStringProp(err, 'message');
}

export default isAPIError;
