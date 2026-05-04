import { ReactNode } from 'react';
import {
  useForm,
  FormProvider,
  SubmitHandler,
  FieldValues,
  DefaultValues,
  UseFormProps,
} from 'react-hook-form';

import UIButton from '@/components/ui-button';

import UITypography from '../ui-typography';

import styles from './styles';

export interface UIFormProps<T extends FieldValues> {
  onSubmit: SubmitHandler<T>;
  defaultValues: DefaultValues<T>;
  children: ReactNode;
  formOptions?: Omit<UseFormProps<T>, 'defaultValues'>;
  isSubmitting?: boolean;
  isSubmitDisabled?: boolean;
  error?: string | null;
  submitLabel: string;
  title: ReactNode;
  subtitle?: ReactNode;
  showTitle?: boolean;
  showSubtitle?: boolean;
  resetOnSuccess?: boolean;
  isSubmitDisabled?: boolean;
}

export default function UIForm<T extends FieldValues>({
  onSubmit,
  defaultValues,
  children,
  formOptions,
  isSubmitting,
  isSubmitDisabled = false,
  error,
  submitLabel,
  title,
  subtitle,
  showTitle = true,
  showSubtitle = true,
  resetOnSuccess = false,
  isSubmitDisabled = false,
}: UIFormProps<T>): JSX.Element {
  const methods = useForm<T>({ mode: 'onTouched', defaultValues, ...formOptions });
  const submitting = isSubmitting ?? methods.formState.isSubmitting;
  const submitDisabled = submitting || isSubmitDisabled;
  const {
    clearErrors,
    control,
    formState,
    getFieldState,
    getValues,
    handleSubmit: formHandleSubmit,
    register,
    reset,
    resetField,
    setError,
    setFocus,
    setValue,
    subscribe,
    trigger,
    unregister,
    watch,
  } = methods;

  const handleSubmit: SubmitHandler<T> = async (data) => {
    await onSubmit(data);
    if (resetOnSuccess) {
      methods.reset(defaultValues);
    }
  };
  return (
    <FormProvider
      clearErrors={clearErrors}
      control={control}
      formState={formState}
      getFieldState={getFieldState}
      getValues={getValues}
      handleSubmit={formHandleSubmit}
      register={register}
      reset={reset}
      resetField={resetField}
      setError={setError}
      setFocus={setFocus}
      setValue={setValue}
      subscribe={subscribe}
      trigger={trigger}
      unregister={unregister}
      watch={watch}
    >
      <form noValidate onSubmit={formHandleSubmit(handleSubmit)}>
        {/* TODO: Implement correct error handling (replace temporary inline error display). Update tests */}
        {error && (
          <UITypography role="alert" aria-live="polite" sx={{ color: 'red', marginBottom: '1rem' }}>
            {error}
          </UITypography>
        )}

        {showTitle && title && (
          <UITypography variant="h4" sx={styles.formTitle}>
            {title}
          </UITypography>
        )}

        {showSubtitle && subtitle && (
          <UITypography sx={styles.formSubtitle}>{subtitle}</UITypography>
        )}

        {children}

        <UIButton type="submit" disabled={submitting || isSubmitDisabled} variant="contained" sx={styles.submitButton}>
          {submitLabel}
        </UIButton>
      </form>
    </FormProvider>
  );
}
