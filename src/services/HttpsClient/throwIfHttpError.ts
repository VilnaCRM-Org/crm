import { HttpError } from './HttpError';

export default async function throwIfHttpError(res: Response): Promise<void> {
  if (res.ok) return;

  let msg = `${res.status} ${res.statusText}`;

  try {
    const data = await res.json();
    if (data?.message && typeof data.message === 'string') {
      msg = data.message;
    }
  } catch {
    // ignore JSON parse errors; keep default message
  }

  throw new HttpError({ status: res.status, message: msg, cause: res });
}
