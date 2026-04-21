import { HttpError } from '@/services/HttpsClient/HttpError';
import { RequestMethod } from '@/services/HttpsClient/HttpsClient';
import ResponseMessages from '@/services/HttpsClient/responseMessages';
import throwIfHttpError from '@/services/HttpsClient/throw-if-http-error';

const NO_BODY_STATUSES = new Set([204, 205, 304]);

function isBinaryBody(body: unknown): boolean {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const isBlob = typeof Blob !== 'undefined' && body instanceof Blob;
  const isArrayBuffer = typeof ArrayBuffer !== 'undefined' && body instanceof ArrayBuffer;
  const isReadableStream =
    typeof ReadableStream !== 'undefined' && body instanceof ReadableStream;
  return isFormData || isBlob || isArrayBuffer || isReadableStream || typeof body === 'string';
}

function createHeaders(
  contentType: string | undefined,
  customHeaders?: Record<string, string>
): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json', ...customHeaders };
  if (contentType && !('Content-Type' in headers)) headers['Content-Type'] = contentType;
  return headers;
}

export function createRequestConfig(
  method: RequestMethod,
  body: unknown,
  headers: Record<string, string> | undefined
): RequestInit {
  const hasBody = body !== undefined;
  const isJsonBody = hasBody && !isBinaryBody(body);
  const config: RequestInit = {
    method,
    headers: createHeaders(isJsonBody ? 'application/json' : undefined, headers),
  };
  if (hasBody) config.body = isJsonBody ? JSON.stringify(body) : (body as BodyInit);
  return config;
}

export function throwAbortError(): never {
  const abortError = new Error('The operation was aborted');
  abortError.name = 'AbortError';
  throw abortError;
}

async function parseJsonBody<T>(response: Response, status: number): Promise<T> {
  try {
    const raw = await response.clone().text().catch(() => '');
    if (!raw || raw.trim().length === 0) return undefined as T;
    return (await response.json()) as T;
  } catch {
    throw new HttpError({ status, message: ResponseMessages.JSON_PARSE_FAILED, cause: response });
  }
}

async function readNonJsonBody<T>(response: Response, status: number): Promise<T> {
  const text = await response.text().catch(() => '');
  if (!text) return undefined as T;
  throw new HttpError({ status, message: ResponseMessages.RESPONSE_NOT_JSON, cause: response });
}

export async function processResponse<T>(response: Response): Promise<T> {
  await throwIfHttpError(response);
  if (NO_BODY_STATUSES.has(response.status)) return undefined as T;
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  return contentType.includes('json')
    ? parseJsonBody<T>(response, response.status)
    : readNonJsonBody<T>(response, response.status);
}

export function rethrowOrWrap(err: unknown): never {
  if (err instanceof Error && err.name === 'AbortError') throw err;
  if (err instanceof HttpError) throw err;
  throw new HttpError({ status: 0, message: ResponseMessages.NETWORK_ERROR, cause: err });
}
