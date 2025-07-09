import { Validate } from 'react-hook-form';

import { AuthVariants } from '../types';

export const isValidEmailFormat: (email: string) => boolean = (email: string): boolean =>
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

const validationMessages = {
  required: "Це поле обов'язкове",
  incorrect: 'Будь ласка, введіть коректну електронну адресу',
};
const validateEmail: Validate<string, AuthVariants> = (email) => {
  if (!email) return validationMessages.required;

  if (!isValidEmailFormat(email)) return validationMessages.incorrect;

  return true;
};

export default validateEmail;
