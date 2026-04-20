import { HttpError } from './HttpError';

interface JsonWithMessage {
  message?: string;
}

interface ExtractedBody {
  message: string | null;
  body: unknown;
}

async function extractJsonBody(clone: Response): Promise<ExtractedBody> {
  const data = (await clone.json().catch(() => undefined)) as JsonWithMessage | undefined;
  return { message: data?.message ? data.message.slice(0, 500) : null, body: data };
}

async function extractTextBody(clone: Response, ct: string): Promise<ExtractedBody> {
  const text = await clone.text().catch(() => '');
  const message = ct.includes('text/plain') && text ? text.slice(0, 500) : null;
  return { message, body: text };
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
