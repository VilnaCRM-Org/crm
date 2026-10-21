import { type JSX, useState } from 'react';
import { SubmitHandler, FieldValues, useFormContext } from 'react-hook-form';

import type {
  FormBodyProps,
  FormHeaderSectionProps,
  FormLeadSectionProps,
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

import ErrorBanner from './error-banner';
import SubmitSpinner from './submit-spinner';
import useOfflineSubmit from './use-offline-submit';
import useUIForm from './use-ui-form';

function FormHeader({ header, bannerShown }: FormHeaderSectionProps): JSX.Element {
  const { title, subtitle, showTitle, showSubtitle, titleComponent, titleRef } = header;
  const [bannerAtMount] = useState(bannerShown);
  return (
    <>
      {showTitle && title && (
        <UITypography
          variant="h4"
          component={titleComponent}
          sx={styles.formTitle}
          ref={bannerAtMount ? undefined : titleRef}
          tabIndex={titleRef ? -1 : undefined}
        >
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
  spacing,
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
      sx={[styles.submitButton, spacing === 'tight' && styles.submitButtonTight]}
    >
      {submitLabel}
    </UIButton>
  );
}

function FormLead({ header, lead, offline }: FormLeadSectionProps): JSX.Element {
  return (
    <>
      <FormHeader header={header} bannerShown={Boolean(lead.error)} />
      {lead.notice}
      <ErrorBanner error={lead.error} returnFocusRef={offline.submitRef} />
      <UIOfflineNotice ref={offline.noticeRef} id={offline.noticeId} online={offline.online} />
    </>
  );
}

function FormBody<T extends FieldValues>({
  handleSubmit,
  children,
  header,
  lead,
  submit,
  submitting,
  announceSubmitting,
}: FormBodyProps<T>): JSX.Element {
  const methods = useFormContext<T>();
  // Offline, the submit is disabled rather than allowed to fail: the notice sits inside the
  // form after its heading so the registration overlay never covers it, the button describes
  // itself by the notice, and focus moves there if the button held it (issue #147).
  const offline = useOfflineSubmit();
  return (
    <form noValidate aria-busy={submitting} onSubmit={methods.handleSubmit(handleSubmit)}>
      <FormLead header={header} lead={lead} offline={offline} />
      {children}
      <SubmitControls
        submitting={submitting}
        isSubmitDisabled={submit.isSubmitDisabled || !offline.online}
        submitLabel={submit.submitLabel}
        describedBy={offline.noticeId}
        buttonRef={offline.submitRef}
        spacing={submit.submitSpacing}
      />
      <UILiveStatus message={announceSubmitting ? submit.submittingLabel : ''} />
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
  titleRef,
  submittingAnnouncement,
  notice,
  submitSpacing,
}: UIFormProps<T>): JSX.Element {
  const { methods, submitting } = useUIForm<T>({ defaultValues, formOptions, isSubmitting });

  return (
    <FormProviderBridge methods={methods}>
      <FormBody
        handleSubmit={buildSubmitHandler({ onSubmit, methods, defaultValues, resetOnSuccess })}
        header={{ title, subtitle, showTitle, showSubtitle, titleComponent, titleRef }}
        lead={{ error, notice }}
        submit={{ submitLabel, submittingLabel, isSubmitDisabled, submitSpacing }}
        submitting={submitting}
        announceSubmitting={submittingAnnouncement ?? submitting}
      >
        {children}
      </FormBody>
    </FormProviderBridge>
  );
}
