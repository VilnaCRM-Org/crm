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
  occurrence: number;
  focus?: boolean | undefined;
}

export interface ServerFieldErrorClearForm {
  readonly clearErrors: UseFormClearErrors<FieldValues>;
  readonly getFieldState: UseFormGetFieldState<FieldValues>;
}

export interface ServerFieldErrorForm extends ServerFieldErrorClearForm {
  readonly setError: UseFormSetError<FieldValues>;
  readonly setFocus: UseFormSetFocus<FieldValues>;
}
