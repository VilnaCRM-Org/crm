type OkResult<TValue> = { ok: true; value: TValue };
type ErrorResult<TError> = { ok: false; error: TError };
type ResultLike<TValue, TError> = OkResult<TValue> | ErrorResult<TError>;

const describeValue = (value: unknown): string => {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};

export function assertOk<TValue, TError>(
  result: ResultLike<TValue, TError>
): asserts result is OkResult<TValue> {
  if (!result.ok) {
    throw new Error(`Expected an ok result, received error: ${describeValue(result.error)}`);
  }
}

export function assertError<TValue, TError>(
  result: ResultLike<TValue, TError>
): asserts result is ErrorResult<TError> {
  if (result.ok) {
    throw new Error(`Expected an error result, received ok value: ${describeValue(result.value)}`);
  }
}

export function assertInstanceOf<T>(
  value: unknown,
  constructor: new (...args: never[]) => T
): asserts value is T {
  if (!(value instanceof constructor)) {
    throw new Error(
      `Expected an instance of ${constructor.name}, received: ${describeValue(value)}`
    );
  }
}
