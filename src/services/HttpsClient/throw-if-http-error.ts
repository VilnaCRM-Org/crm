import { HttpError } from './HttpError';

const MAX_ERROR_BODY_CHARS = 500;

interface JsonWithMessage {
  message?: string;
}

interface ExtractedBody {
  message: string | null;
  body: string | undefined;
}

function truncate(value: string): string {
  return value.slice(0, MAX_ERROR_BODY_CHARS);
}

async function extractJsonBody(clone: Response): Promise<ExtractedBody> {
  const data = (await clone.json().catch(() => undefined)) as JsonWithMessage | undefined;
  const message = typeof data?.message === 'string' ? truncate(data.message) : null;
  const body = data === undefined ? undefined : truncate(JSON.stringify(data));
  return { message, body };
}

async function extractTextBody(clone: Response, ct: string): Promise<ExtractedBody> {
  const text = await clone.text().catch(() => '');
  const body = text ? truncate(text) : undefined;
  const message = ct.includes('text/plain') && body ? body : null;
  return { message, body };
}

async function extractBody(res: Response): Promise<ExtractedBody> {
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  try {
    if (ct.includes('json')) return await extractJsonBody(res.clone());
    return await extractTextBody(res.clone(), ct);
  } catch {
    return { message: null, body: undefined };
  }
}

export default async function throwIfHttpError(res: Response): Promise<void> {
  if (res.ok || res.status === 304) return;
  const fallback = `${res.status} ${res.statusText}`;
  const { message, body } = await extractBody(res);
  throw new HttpError({
    status: res.status,
    message: message ?? fallback,
    cause: {
      url: res.url,
      contentType: res.headers.get('content-type') ?? undefined,
      body,
    },
  });
}
