import { RegisterUserDto } from '@/modules/user/features/auth/types/credentials';

const normalizeRegistrationData = (data: RegisterUserDto): RegisterUserDto => ({
  ...data,
  fullName: data.fullName.trim(),
});

export default normalizeRegistrationData;
