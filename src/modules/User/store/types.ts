import { type RegistrationAPI, type LoginAPI } from '../features/Auth/api';

export type ThunkExtra = {
  loginAPI: LoginAPI;
  registrationAPI: RegistrationAPI;
};
