export type LoginResponse = { token: string };

export type RegistrationResponse = {
  fullName?: string;
  email?: string;
};

export type SafeUserInfo = RegistrationResponse;
