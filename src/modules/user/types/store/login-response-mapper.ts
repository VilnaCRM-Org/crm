import type { UiError } from '@/services/error';
import type { LoginResponse } from '@auth/types/api-responses';

export type LoginSuccessPayload = LoginResponse & { email: string };

export type LoginResult = { ok: true; value: LoginSuccessPayload } | { ok: false; error: UiError };
