/* eslint-disable react/require-default-props */
import { CircularProgress } from '@mui/material';
import { ReactNode } from 'react';
import {
  useForm,
  FormProvider,
  SubmitHandler,
  FieldValues,
  DefaultValues,
  UseFormProps,
} from 'react-hook-form';

import UIButton from '@/components/UIButton';

import UITypography from '../UITypography';

import styles from './styles';

export interface UIFormProps<T extends FieldValues> {
  onSubmit: SubmitHandler<T>;
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
}: UIFormProps<T>): JSX.Element {
  const methods = useForm<T>({ mode: 'onTouched', defaultValues, ...formOptions });
  const submitting = isSubmitting ?? methods.formState.isSubmitting;

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <FormProvider {...methods}>
      <form noValidate onSubmit={methods.handleSubmit(onSubmit)}>
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
