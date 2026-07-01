import type { UiError } from '@/services/error';
import type { LoginResponse } from '@auth';

export type LoginSuccessPayload = LoginResponse & { email: string };

export type LoginMappingResult =
  | { ok: true; value: LoginSuccessPayload }
  | { ok: false; error: UiError };
