import { HttpError } from './http-error';

interface JsonWithMessage {
  message?: string;
}

const BODY_PREVIEW_LIMIT = 200;

function buildBodyPreview(data: unknown): { bodyPreview: string; bodyLength: number } {
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

export default async function throwIfHttpError(res: Response): Promise<void> {
  if (res.ok || res.status === 304) return;

  let msg = `${res.status} ${res.statusText}`;
  let bodyMeta: { bodyPreview: string; bodyLength: number } | undefined;

  try {
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    const clonedRes = res.clone();

    if (ct.includes('json')) {
      const data = await clonedRes.json().catch(() => undefined);

      if (data !== undefined) bodyMeta = buildBodyPreview(data);
      const jsonData = data as JsonWithMessage | undefined;
      if (jsonData?.message) {
        msg = jsonData.message.slice(0, 500);
      }
    } else {
      const text = await clonedRes.text().catch(() => '');
      if (ct.includes('text/plain') && text) msg = text.slice(0, 500);
    }
  } catch {
    // ignore body extraction errors; keep default message
  }

  throw new HttpError({
    status: res.status,
    message: msg,
    cause: {
      url: res.url,
      contentType: res.headers.get('content-type') ?? undefined,
      ...(bodyMeta ?? {}),
    },
  });
}
