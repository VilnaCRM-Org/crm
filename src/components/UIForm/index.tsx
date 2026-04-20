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
  UseFormReturn,
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
  resetOnSuccess?: boolean;
  isSubmitDisabled?: boolean;
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
};

type ResolvedFormProps<T extends FieldValues> = Omit<
  UIFormProps<T>,
  'showTitle' | 'showSubtitle' | 'resetOnSuccess' | 'isSubmitDisabled'
> & {
  showTitle: boolean;
  showSubtitle: boolean;
  resetOnSuccess: boolean;
  isSubmitDisabled: boolean;
};

function ErrorBanner({ error }: { error?: string | null }): JSX.Element | null {
  if (!error) return null;
  return (
    <UITypography role="alert" aria-live="polite" sx={{ color: 'red', marginBottom: '1rem' }}>
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
      {showSubtitle && subtitle && (
        <UITypography sx={styles.formSubtitle}>{subtitle}</UITypography>
      )}
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
    <>
      <UIButton
        type="submit"
        disabled={submitting || isSubmitDisabled}
        variant="contained"
        sx={styles.submitButton}
      >
        {submitLabel}
      </UIButton>
      {submitting ? <CircularProgress color="primary" size={70} sx={styles.loader} /> : null}
    </>
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
}: FormBodyProps<T>): JSX.Element {
  return (
    <form noValidate onSubmit={methods.handleSubmit(handleSubmit)}>
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
    </form>
  );
}

function resolveFormProps<T extends FieldValues>({
  showTitle = true,
  showSubtitle = true,
  resetOnSuccess = false,
  isSubmitDisabled = false,
  ...props
}: UIFormProps<T>): ResolvedFormProps<T> {
  return { ...props, showTitle, showSubtitle, resetOnSuccess, isSubmitDisabled };
}

export default function UIForm<T extends FieldValues>(props: UIFormProps<T>): JSX.Element {
  const resolved = resolveFormProps(props);
  const { defaultValues, formOptions } = resolved;
  const methods = useForm<T>({ mode: 'onTouched', defaultValues, ...formOptions });
  const submitting = resolved.isSubmitting ?? methods.formState.isSubmitting;
  const handleSubmit = buildSubmitHandler({
    onSubmit: resolved.onSubmit,
    methods,
    defaultValues,
    resetOnSuccess: resolved.resetOnSuccess,
  });

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <FormProvider {...methods}>
      <FormBody
        methods={methods}
        handleSubmit={handleSubmit}
        error={resolved.error}
        title={resolved.title}
        subtitle={resolved.subtitle}
        showTitle={resolved.showTitle}
        showSubtitle={resolved.showSubtitle}
        submitting={submitting}
        isSubmitDisabled={resolved.isSubmitDisabled}
        submitLabel={resolved.submitLabel}
      >
        {resolved.children}
      </FormBody>
    </FormProvider>
  );
}
