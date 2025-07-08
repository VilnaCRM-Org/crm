import { Validate } from 'react-hook-form';

import RegisterUserDto from '@/modules/User/features/Auth/types/Credentials';

export const isValidEmailFormat: (email: string) => boolean = (email: string): boolean =>
  /^.+@.+\..+$/.test(email);

const validateEmail: Validate<string, RegisterUserDto> = (email) => {
  if (!isValidEmailFormat(email)) {
    if (!email.includes('@') || !email.includes('.')) {
      return "Будь ласка, переконайтеся, що email містить '@' та '.'";
    }
    return 'Будь ласка, введіть коректну електронну адресу';
  }
  return true;
};

export default validateEmail;
