import { Box } from '@mui/material';
import { ReactNode } from 'react';
import { SubmitHandler, FieldValues, useFormContext } from 'react-hook-form';

import type {
  FormBodyProps,
  SubmitControlsProps,
  SubmitHandlerOptions,
  TitleHeadingComponent,
  UIFormProps,
} from '@/components/types/ui-form';
import UIButton from '@/components/ui-button';
import FormProviderBridge from '@/components/ui-form/form-provider-bridge';
import styles from '@/components/ui-form/styles';
import UILiveStatus from '@/components/ui-live-status';
import UITypography from '@/components/ui-typography';
import useFocusOnMount from '@/utils/use-focus-on-mount';

import SubmitSpinner from './submit-spinner';
import useUIForm from './use-ui-form';

function ErrorBanner({ error }: { error?: string | null }): JSX.Element | null {
  const focusOnAppear = useFocusOnMount<HTMLDivElement>();
  if (!error) return null;
  return (
    <Box ref={focusOnAppear} tabIndex={-1} sx={styles.errorBannerFocus}>
      <UITypography role="alert" sx={{ color: 'red', marginBottom: '1rem' }}>
        {error}
      </UITypography>
    </Box>
  );
}

function FormHeader({
  title,
  subtitle,
  showTitle,
  showSubtitle,
  titleComponent,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  showTitle: boolean;
  showSubtitle: boolean;
  titleComponent?: TitleHeadingComponent;
}): JSX.Element {
  return (
    <>
      {showTitle && title && (
        <UITypography variant="h4" component={titleComponent} sx={styles.formTitle}>
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
  handleSubmit,
  children,
  error,
  title,
  subtitle,
  showTitle,
  showSubtitle,
  titleComponent,
  submitting,
  isSubmitDisabled,
  submitLabel,
  submittingLabel,
  announceSubmitting,
}: FormBodyProps<T>): JSX.Element {
  const methods = useFormContext<T>();
  return (
    <form noValidate aria-busy={submitting} onSubmit={methods.handleSubmit(handleSubmit)}>
      <ErrorBanner error={error} />
      <FormHeader
        title={title}
        subtitle={subtitle}
        showTitle={showTitle}
        showSubtitle={showSubtitle}
        titleComponent={titleComponent}
      />
      {children}
      <SubmitControls
        submitting={submitting}
        isSubmitDisabled={isSubmitDisabled}
        submitLabel={submitLabel}
      />
      <UILiveStatus message={announceSubmitting ? submittingLabel : ''} />
    </form>
  );
}

export default function UIForm<T extends FieldValues>({
  onSubmit,
  defaultValues,
  children,
  formOptions = {},
  isSubmitting,
  error = null,
  subtitle = null,
  showTitle = true,
  showSubtitle = true,
  resetOnSuccess = false,
  isSubmitDisabled = false,
  submitLabel,
  title,
  submittingLabel,
  titleComponent,
  submittingAnnouncement,
}: UIFormProps<T>): JSX.Element {
  const { methods, submitting } = useUIForm<T>({ defaultValues, formOptions, isSubmitting });

  return (
    <FormProviderBridge methods={methods}>
      <FormBody
        handleSubmit={buildSubmitHandler({ onSubmit, methods, defaultValues, resetOnSuccess })}
        error={error}
        title={title}
        subtitle={subtitle}
        showTitle={showTitle}
        showSubtitle={showSubtitle}
        titleComponent={titleComponent}
        submitting={submitting}
        isSubmitDisabled={isSubmitDisabled}
        submitLabel={submitLabel}
        submittingLabel={submittingLabel}
        announceSubmitting={submittingAnnouncement ?? submitting}
      >
        {children}
      </FormBody>
    </FormProviderBridge>
  );
}
