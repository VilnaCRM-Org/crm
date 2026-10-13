import type { SafeUserInfo } from '@auth';

import type { MappingFailure } from './mapping-failure';

export interface RegistrationMappingSuccess {
  ok: true;
  value: SafeUserInfo;
}

export type RegistrationMappingResult = RegistrationMappingSuccess | MappingFailure;
