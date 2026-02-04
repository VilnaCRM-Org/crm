import { type IUserRepository } from '@/modules/user/features/auth/repositories';

export type ThunkExtra = {
  userRepository: IUserRepository;
};
