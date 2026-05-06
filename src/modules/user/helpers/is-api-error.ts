interface APIError {
  code: string;
  message: string;
}

function isAPIError(err: unknown): err is APIError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as Record<string, unknown>).code === 'string' &&
    'message' in err &&
    typeof (err as Record<string, unknown>).message === 'string'
  );
}

export default isAPIError;
