import { HttpError } from '@/services/HttpsClient/HttpError';
import { RequestMethod } from '@/services/HttpsClient/HttpsClient';
import ResponseMessages from '@/services/HttpsClient/responseMessages';
import throwIfHttpError from '@/services/HttpsClient/throw-if-http-error';

const NO_BODY_STATUSES = new Set([204, 205, 304]);

function getBodyInitCtors(): Array<new (...args: never[]) => object> {
  const out: Array<new (...args: never[]) => object> = [];
  const g = globalThis as Record<string, unknown>;
  for (const name of ['FormData', 'Blob', 'ArrayBuffer', 'URLSearchParams', 'ReadableStream']) {
    const ctor = g[name];
    if (typeof ctor === 'function') out.push(ctor as new (...args: never[]) => object);
  }
  return out;
}

function isBodyInit(body: unknown): boolean {
  if (typeof body === 'string') return true;
  for (const ctor of getBodyInitCtors()) if (body instanceof ctor) return true;
  return typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(body);
}

function hasHeader(headers: Record<string, string>, target: string): boolean {
  const normalized = target.toLowerCase();
  for (const name of Object.keys(headers)) {
    if (name.toLowerCase() === normalized) return true;
  }
  return false;
}

function createHeaders(
  contentType: string | undefined,
  customHeaders?: Record<string, string>
): Record<string, string> {
  const headers: Record<string, string> = { ...customHeaders };
  if (!hasHeader(headers, 'accept')) headers.Accept = 'application/json';
  if (contentType && !hasHeader(headers, 'content-type')) headers['Content-Type'] = contentType;
  return headers;
}

export function createRequestConfig(
  method: RequestMethod,
  body: unknown,
  headers: Record<string, string> | undefined
): RequestInit {
  const hasBody = body !== undefined;
  const isJsonBody = hasBody && !isBodyInit(body);
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
  if (!text || text.trim().length === 0) return undefined as T;
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
  const isAbort =
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name?: unknown }).name === 'AbortError';
  if (isAbort) throw err;
  if (err instanceof HttpError) throw err;
  throw new HttpError({ status: 0, message: ResponseMessages.NETWORK_ERROR, cause: err });
}
