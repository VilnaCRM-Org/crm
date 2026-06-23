import type { Validate, FieldValues } from 'react-hook-form';

export type Validators<TFieldValues extends FieldValues> = {
  email: Validate<string, TFieldValues>;
  password: Validate<string, TFieldValues>;
  fullName: Validate<string, TFieldValues>;
};
