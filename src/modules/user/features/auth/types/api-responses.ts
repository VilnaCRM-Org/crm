export type LoginResponse = { token: string };

export type RegistrationResponse = {
  fullName?: string | undefined;
  email?: string | undefined;
};

export type SafeUserInfo = RegistrationResponse;
