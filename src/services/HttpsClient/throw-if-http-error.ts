import HttpErrorStatusGuard from './http-error-status-guard';

const defaultHttpErrorStatusGuard = new HttpErrorStatusGuard();

export default async function throwIfHttpError(response: Response): Promise<void> {
  await defaultHttpErrorStatusGuard.assertOk(response);
}
