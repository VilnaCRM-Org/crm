import { ReactNode } from 'react';
import {
  useForm,
  SubmitHandler,
  FieldValues,
  DefaultValues,
  UseFormProps,
  UseFormReturn,
} from 'react-hook-form';

import UIButton from '@/components/ui-button';
import FormProviderBridge from '@/components/ui-form/form-provider-bridge';
import styles from '@/components/ui-form/styles';
import SubmitSpinner from '@/components/ui-form/submit-spinner';
import UILiveStatus from '@/components/ui-live-status';
import UITypography from '@/components/ui-typography';

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
  resetOnSuccess?: boolean;
  isSubmitDisabled?: boolean;
  submittingLabel: string;
}

type SubmitHandlerOptions<T extends FieldValues> = {
  onSubmit: SubmitHandler<T>;
  methods: UseFormReturn<T>;
  defaultValues: DefaultValues<T>;
  resetOnSuccess: boolean;
};

type SubmitControlsProps = {
  submitting: boolean;
  isSubmitDisabled: boolean;
  submitLabel: string;
};

type FormBodyProps<T extends FieldValues> = {
  methods: UseFormReturn<T>;
  handleSubmit: SubmitHandler<T>;
  children: ReactNode;
  error?: string | null;
  title: ReactNode;
  subtitle?: ReactNode;
  showTitle: boolean;
  showSubtitle: boolean;
  submitting: boolean;
  isSubmitDisabled: boolean;
  submitLabel: string;
  submittingLabel: string;
};

function ErrorBanner({ error }: { error?: string | null }): JSX.Element | null {
  if (!error) return null;
  return (
    <UITypography role="alert" sx={{ color: 'red', marginBottom: '1rem' }}>
      {error}
    </UITypography>
  );
}

function FormHeader({
  title,
  subtitle,
  showTitle,
  showSubtitle,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  showTitle: boolean;
  showSubtitle: boolean;
}): JSX.Element {
  return (
    <>
      {showTitle && title && (
        <UITypography variant="h4" sx={styles.formTitle}>
          {title}
        </UITypography>
      )}
      {showSubtitle && subtitle && <UITypography sx={styles.formSubtitle}>{subtitle}</UITypography>}
    </>
  );
}

function buildSubmitHandler<T extends FieldValues>(
  options: SubmitHandlerOptions<T>
): SubmitHandler<T> {
  return async (data) => {
    await options.onSubmit(data);
    if (options.resetOnSuccess) options.methods.reset(options.defaultValues);
  };
}

function SubmitControls({
  submitting,
  isSubmitDisabled,
  submitLabel,
}: SubmitControlsProps): JSX.Element {
  return (
    <UIButton
      type="submit"
      loading={submitting}
      loadingPosition="center"
      loadingIndicator={<SubmitSpinner />}
      disabled={isSubmitDisabled}
      variant="contained"
      sx={styles.submitButton}
    >
      {submitLabel}
    </UIButton>
  );
}

function FormBody<T extends FieldValues>({
  methods,
  handleSubmit,
  children,
  error,
  title,
  subtitle,
  showTitle,
  showSubtitle,
  submitting,
  isSubmitDisabled,
  submitLabel,
  submittingLabel,
}: FormBodyProps<T>): JSX.Element {
  return (
    <form noValidate aria-busy={submitting} onSubmit={methods.handleSubmit(handleSubmit)}>
      <ErrorBanner error={error} />
      <FormHeader
        title={title}
        subtitle={subtitle}
        showTitle={showTitle}
        showSubtitle={showSubtitle}
      />
      {children}
      <SubmitControls
        submitting={submitting}
        isSubmitDisabled={isSubmitDisabled}
        submitLabel={submitLabel}
      />
      <UILiveStatus message={submitting ? submittingLabel : ''} />
    </form>
  );
}

export default function UIForm<T extends FieldValues>({
  onSubmit,
  defaultValues,
  children,
  formOptions = {},
  isSubmitting = undefined,
  error = null,
  submitLabel,
  title,
  subtitle = null,
  showTitle = true,
  showSubtitle = true,
  resetOnSuccess = false,
  isSubmitDisabled = false,
  submittingLabel,
}: UIFormProps<T>): JSX.Element {
  const methods = useForm<T>({ mode: 'onTouched', defaultValues, ...formOptions });
  const submitting = isSubmitting ?? methods.formState.isSubmitting;
  const handleSubmit = buildSubmitHandler({ onSubmit, methods, defaultValues, resetOnSuccess });

  return (
    <FormProviderBridge methods={methods}>
      <FormBody
        methods={methods}
        handleSubmit={handleSubmit}
        error={error}
        title={title}
        subtitle={subtitle}
        showTitle={showTitle}
        showSubtitle={showSubtitle}
        submitting={submitting}
        isSubmitDisabled={isSubmitDisabled}
        submitLabel={submitLabel}
        submittingLabel={submittingLabel}
      >
        {children}
      </FormBody>
    </FormProviderBridge>
  );
}
