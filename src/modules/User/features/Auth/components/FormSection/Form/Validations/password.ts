const isLengthValid: (value: string) => boolean = (value: string): boolean =>
  value.length >= 8 && value.length <= 64;

const hasNumber: (value: string) => boolean = (value: string): boolean => /[0-9]/.test(value);

const hasUppercase: (value: string) => boolean = (value: string): boolean => /\p{Lu}/u.test(value);

type ValidationPswdMessageKey = 'invalidLength' | 'numberRequired' | 'uppercaseRequired';

const validationPswdMessages: Record<ValidationPswdMessageKey, string> = {
  invalidLength: 'Будь ласка, введіть від 8 до 64 символів',
  numberRequired: 'Будь ласка, додайте принаймні одну цифру',
  uppercaseRequired: 'Будь ласка, додайте принаймні одну велику літеру',
};

const validatePassword: (value: string) => string | boolean = (value: string): string | boolean => {
  if (!isLengthValid(value)) return validationPswdMessages.invalidLength;
  if (!hasNumber(value)) return validationPswdMessages.numberRequired;
  if (!hasUppercase(value)) return validationPswdMessages.uppercaseRequired;
  return true;
};

export default validatePassword;
