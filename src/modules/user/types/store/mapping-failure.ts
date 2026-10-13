import type { UiError } from '@/services/error';

export interface MappingFailure {
  ok: false;
  error: UiError;
}
