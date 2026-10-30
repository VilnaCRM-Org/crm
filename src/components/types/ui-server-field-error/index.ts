import type {
  FieldValues,
  UseFormClearErrors,
  UseFormGetFieldState,
  UseFormSetError,
  UseFormSetFocus,
} from 'react-hook-form';

export interface ServerFieldErrorProps {
  name: string;
  message: string | null;
  focus?: boolean | undefined;
}

export interface ServerFieldErrorForm {
  readonly setError: UseFormSetError<FieldValues>;
  readonly setFocus: UseFormSetFocus<FieldValues>;
  readonly clearErrors: UseFormClearErrors<FieldValues>;
  readonly getFieldState: UseFormGetFieldState<FieldValues>;
}
