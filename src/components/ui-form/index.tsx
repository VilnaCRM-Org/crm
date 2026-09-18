import { Box } from '@mui/material';
import { type JSX } from 'react';
import { SubmitHandler, FieldValues, useFormContext } from 'react-hook-form';

import type {
  FormBodyProps,
  FormHeaderProps,
  SubmitControlsProps,
  SubmitHandlerOptions,
  UIFormProps,
} from '@/components/types/ui-form';
import UIButton from '@/components/ui-button';
import FormProviderBridge from '@/components/ui-form/form-provider-bridge';
import styles from '@/components/ui-form/styles';
import UILiveStatus from '@/components/ui-live-status';
import UIOfflineNotice from '@/components/ui-offline-notice';
import UITypography from '@/components/ui-typography';
import useFocusOnMount from '@/utils/use-focus-on-mount';

import SubmitSpinner from './submit-spinner';
import useOfflineSubmit from './use-offline-submit';
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

function FormHeader({ header }: { header: FormHeaderProps }): JSX.Element {
  const { title, subtitle, showTitle, showSubtitle, titleComponent } = header;
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
  describedBy,
  buttonRef,
}: SubmitControlsProps): JSX.Element {
  return (
    <UIButton
      ref={buttonRef}
      type="submit"
      loading={submitting}
      loadingPosition="center"
      loadingIndicator={<SubmitSpinner />}
      disabled={isSubmitDisabled}
      aria-describedby={describedBy}
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
  submitting,
  isSubmitDisabled,
  submitLabel,
  submittingLabel,
  announceSubmitting,
  header,
}: FormBodyProps<T>): JSX.Element {
  const methods = useFormContext<T>();
  // Offline, the submit is disabled rather than allowed to fail: the notice sits inside the
  // form after its heading so the registration overlay never covers it, the button describes
  // itself by the notice, and focus moves there if the button held it (issue #147).
  const offline = useOfflineSubmit();
  return (
    <form noValidate aria-busy={submitting} onSubmit={methods.handleSubmit(handleSubmit)}>
      <ErrorBanner error={error} />
      <FormHeader header={header} />
      <UIOfflineNotice ref={offline.noticeRef} id={offline.noticeId} online={offline.online} />
      {children}
      <SubmitControls
        submitting={submitting}
        isSubmitDisabled={isSubmitDisabled || !offline.online}
        submitLabel={submitLabel}
        describedBy={offline.noticeId}
        buttonRef={offline.submitRef}
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
        header={{ title, subtitle, showTitle, showSubtitle, titleComponent }}
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
