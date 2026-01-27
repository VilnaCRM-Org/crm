import { type LoginAPI } from '@/modules/User/features/Auth/api';

export type ThunkExtra = {
  loginAPI: LoginAPI;
};
