import LoginAPI from '@/modules/User/features/Auth/api/LoginAPI';
import RegistrationAPI from '@/modules/User/features/Auth/api/RegistrationAPI';

export type ThunkExtra = {
  loginAPI: LoginAPI;
  registrationAPI: RegistrationAPI;
};
