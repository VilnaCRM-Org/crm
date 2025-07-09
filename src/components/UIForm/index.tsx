import { ReactNode } from 'react';
import { useForm, FormProvider, SubmitHandler, FieldValues, DefaultValues } from 'react-hook-form';

import UIButton from '@/components/UIButton';

import UITypography from '../UITypography';

import styles from './styles';

interface UIFormProps<T extends FieldValues> {
  onSubmit: SubmitHandler<T>;
  defaultValues: DefaultValues<T>;
  children: ReactNode;
  // eslint-disable-next-line react/require-default-props
  isSubmitting?: boolean;
  // eslint-disable-next-line react/require-default-props
  error?: string;
  submitLabel: string;
  title: string;
  // eslint-disable-next-line react/require-default-props
  subtitle?: string;
  // eslint-disable-next-line react/require-default-props
  showTitle?: boolean;
  // eslint-disable-next-line react/require-default-props
  showSubtitle?: boolean;
}

export default function UIForm<T extends FieldValues>({
  onSubmit,
  defaultValues,
  children,
  isSubmitting = false,
  error,
  submitLabel,
  title,
  subtitle,
  showTitle = true,
  showSubtitle = true,
}: UIFormProps<T>): JSX.Element {
  const methods = useForm<T>({ defaultValues });

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        {error && <UITypography sx={{ color: 'red', marginBottom: '1rem' }}>{error}</UITypography>}

        {showTitle && title && (
          <UITypography variant="h4" sx={styles.formTitle}>
            {title}
          </UITypography>
        )}

        {showSubtitle && subtitle && (
          <UITypography sx={styles.formSubtitle}>{subtitle}</UITypography>
        )}

        {children}

        <UIButton
          type="submit"
          disabled={isSubmitting}
          variant="contained"
          sx={styles.submitButton}
        >
          {isSubmitting ? 'Loading...' : submitLabel}
        </UIButton>
      </form>
    </FormProvider>
  );
}
