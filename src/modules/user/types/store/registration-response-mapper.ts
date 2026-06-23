import type { UiError } from '@/services/error';
import type { SafeUserInfo } from '@auth/types/api-responses';

export type RegistrationResponseMappingResult =
  | { ok: true; value: SafeUserInfo }
  | { ok: false; error: UiError };
