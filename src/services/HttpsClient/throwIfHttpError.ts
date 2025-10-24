import { HttpError } from './HttpError';

interface JsonWithMessage {
  message?: string;
}

export default async function throwIfHttpError(res: Response): Promise<void> {
  if (res.ok || res.status === 304) return;

  let msg = `${res.status} ${res.statusText}`;
  let body: unknown;

  try {
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    const clonedRes = res.clone();

    if (ct.includes('json')) {
      const data = await clonedRes.json().catch(() => undefined);
      body = data;

      const jsonData = data as JsonWithMessage | undefined;
      if (jsonData?.message) {
        msg = jsonData.message.slice(0, 500);
      }
    } else {
      const text = await clonedRes.text().catch(() => '');
      body = text;
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
      body,
    },
  });
}
