import type { UiError } from '@/services/error';
import type { SafeUserInfo } from '@auth';

export type RegistrationMappingResult =
  | { ok: true; value: SafeUserInfo }
  | { ok: false; error: UiError };
