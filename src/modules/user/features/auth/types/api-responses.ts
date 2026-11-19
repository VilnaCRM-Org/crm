export interface RegistrationResponse {
  fullName?: string | undefined;
  email?: string | undefined;
}

export type SafeUserInfo = RegistrationResponse;
