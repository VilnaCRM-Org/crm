/* eslint-disable react/require-default-props */
import { CircularProgress } from '@mui/material';
import { ReactNode } from 'react';
import { useForm, FormProvider, FieldValues, DefaultValues, UseFormProps } from 'react-hook-form';

import UIButton from '@/components/ui-button';

import UITypography from '../ui-typography';

import styles from './styles';

type SubmitResult = void | boolean | Promise<void> | Promise<boolean>;

export interface UIFormProps<T extends FieldValues> {
  onSubmit: (data: T) => SubmitResult;
  defaultValues: DefaultValues<T>;
  children: ReactNode;
  formOptions?: Omit<UseFormProps<T>, 'defaultValues'>;
  isSubmitting?: boolean;
  error?: string | null;
  submitLabel: string;
  title: ReactNode;
  subtitle?: ReactNode;
  showTitle?: boolean;
  showSubtitle?: boolean;
  resetOnSuccess?: boolean;
}

export default function UIForm<T extends FieldValues>({
  onSubmit,
  defaultValues,
  children,
  formOptions,
  isSubmitting,
  error,
  submitLabel,
  title,
  subtitle,
  showTitle = true,
  showSubtitle = true,
  resetOnSuccess = false,
}: UIFormProps<T>): JSX.Element {
  const methods = useForm<T>({ mode: 'onTouched', defaultValues, ...formOptions });
  const submitting = isSubmitting ?? methods.formState.isSubmitting;

  const handleSubmit = async (data: T): Promise<void> => {
    const submitResult = await onSubmit(data);

    if (resetOnSuccess && submitResult !== false) {
      methods.reset(defaultValues);
    }
  };
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <FormProvider {...methods}>
      <form noValidate onSubmit={methods.handleSubmit(handleSubmit)}>
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

        <UIButton type="submit" disabled={submitting} variant="contained" sx={styles.submitButton}>
          {submitLabel}
        </UIButton>
        {submitting ? <CircularProgress color="primary" size={70} sx={styles.loader} /> : null}
      </form>
    </FormProvider>
  );
}
