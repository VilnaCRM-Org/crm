import { HttpError } from './HttpError';

interface JsonWithMessage {
  message?: string;
}

export default async function throwIfHttpError(res: Response): Promise<void> {
  if (res.ok) return;

  let msg = `${res.status} ${res.statusText}`;
  let body: unknown;

  try {
    const ct = (res.headers.get('content-type') || '').toLowerCase();

    if (/\bjson\b/.test(ct) || ct.includes('json')) {
      const data = await res.json().catch(() => undefined);
      body = data;

      const jsonData = data as JsonWithMessage | undefined;
      if (jsonData?.message) {
        msg = jsonData.message;
      }
    } else {
      const text = await res.text().catch(() => '');
      body = text;
      if (text) msg = text.slice(0, 500);
    }
  } catch {
    // ignore body extraction errors; keep default message
  }

  throw new HttpError({
    status: res.status,
    message: msg,
    cause: { response: res, body, url: res.url },
  });
}
