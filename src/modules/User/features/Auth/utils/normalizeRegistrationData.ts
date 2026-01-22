import { RegisterUserDto } from '@/modules/User/features/Auth/types/Credentials';

const normalizeRegistrationData = (data: RegisterUserDto): RegisterUserDto => ({
  ...data,
  fullName: data.fullName.trim(),
});

export default normalizeRegistrationData;
