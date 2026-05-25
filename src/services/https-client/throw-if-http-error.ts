import { HttpError } from './http-error';

interface JsonWithMessage {
  message?: string;
}

const BODY_PREVIEW_LIMIT = 200;
const MESSAGE_LIMIT = 500;

type BodyMeta = { bodyPreview: string; bodyLength: number };

function buildBodyPreview(data: unknown): BodyMeta {
  let serialized: string;
  try {
    serialized = typeof data === 'string' ? data : JSON.stringify(data);
  } catch {
    serialized = String(data);
  }
  return {
    bodyPreview: serialized.slice(0, BODY_PREVIEW_LIMIT),
    bodyLength: serialized.length,
  };
}

async function extractJsonMeta(res: Response): Promise<{ message?: string; bodyMeta?: BodyMeta }> {
  const data = await res.json().catch(() => undefined);
  if (data === undefined) return {};
  const candidate =
    typeof data === 'object' && data !== null
      ? (data as JsonWithMessage).message
      : undefined;
  const message = typeof candidate === 'string' ? candidate.slice(0, MESSAGE_LIMIT) : undefined;
  return { message, bodyMeta: buildBodyPreview(data) };
}

async function extractTextMessage(res: Response, ct: string): Promise<string | undefined> {
  const text = await res.text().catch(() => '');
  return ct.includes('text/plain') && text ? text.slice(0, MESSAGE_LIMIT) : undefined;
}

async function extractErrorMeta(res: Response): Promise<{ message?: string; bodyMeta?: BodyMeta }> {
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  const cloned = res.clone();
  if (ct.includes('json')) return extractJsonMeta(cloned);
  const message = await extractTextMessage(cloned, ct);
  return { message };
}

export default async function throwIfHttpError(res: Response): Promise<void> {
  if (res.ok || res.status === 304) return;
  const { message, bodyMeta } = await extractErrorMeta(res);
  throw new HttpError({
    status: res.status,
    message: message ?? `${res.status} ${res.statusText}`,
    cause: {
      url: res.url,
      contentType: res.headers.get('content-type') ?? undefined,
      ...(bodyMeta ?? {}),
    },
  });
}
