const NON_JSON_GLOBAL_CTORS = ['FormData', 'Blob', 'URLSearchParams', 'ReadableStream'] as const;

export default function isNonJsonBody(body: unknown): boolean {
  if (typeof body === 'string') return true;
  if (
    typeof ArrayBuffer !== 'undefined' &&
    (body instanceof ArrayBuffer || ArrayBuffer.isView(body))
  ) {
    return true;
  }
  const globals = globalThis as Record<string, unknown>;
  return NON_JSON_GLOBAL_CTORS.some((ctor) => {
    const globalCtor = globals[ctor];
    return typeof globalCtor === 'function' && body instanceof (globalCtor as new () => unknown);
  });
}
