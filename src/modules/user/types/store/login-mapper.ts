import type { LoginResponse } from '@auth';

import type { MappingFailure } from './mapping-failure';

export interface LoginSuccessPayload extends LoginResponse {
  email: string;
}

export interface LoginMappingSuccess {
  ok: true;
  value: LoginSuccessPayload;
}

export type LoginMappingResult = LoginMappingSuccess | MappingFailure;
