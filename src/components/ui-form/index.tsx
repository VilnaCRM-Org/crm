import { type JSX, useState } from 'react';
import { SubmitHandler, FieldValues } from 'react-hook-form';

import type {
  BlockedReasonProps,
  FormBodyProps,
  FormHeaderProps,
  FormHeaderSectionProps,
  FormLeadSectionProps,
  FormSubmitProps,
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
import useFormSubmission from './use-form-submission';
import useUIForm from './use-ui-form';

const NO_STYLES = {};

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
  blocked,
  submitLabel,
  describedBy,
  buttonRef,
  spacing,
  submitSx = NO_STYLES,
}: SubmitControlsProps): JSX.Element {
  return (
    <UIButton
      ref={buttonRef}
      type="submit"
      loading={submitting}
      loadingPosition="center"
      loadingIndicator={<SubmitSpinner />}
      disabled={isSubmitDisabled}
      aria-disabled={blocked || undefined}
      aria-describedby={describedBy}
      variant="contained"
      sx={[styles.submitButton, spacing === 'tight' && styles.submitButtonTight, submitSx]}
    >
      {submitLabel}
    </UIButton>
  );
}

function BlockedReason({ block }: BlockedReasonProps): JSX.Element | null {
  return block.blocked ? (
    <UITypography id={block.reasonId} sx={styles.blockedReason}>
      {block.reason}
    </UITypography>
  ) : null;
}

function FormLead({ header, lead, offline }: FormLeadSectionProps): JSX.Element {
  return (
    <>
      <FormHeader header={header} bannerShown={Boolean(lead.error)} />
      {lead.notice}
      <ErrorBanner
        key={lead.errorOccurrence}
        error={lead.error}
        action={lead.errorAction}
        returnFocusRef={offline.submitRef}
        unavailableReasonId={offline.online ? undefined : offline.noticeId}
      />
      <UIOfflineNotice ref={offline.noticeRef} id={offline.noticeId} online={offline.online} />
    </>
  );
}

function FormBody<T extends FieldValues>({
  handleSubmit,
  onInvalid,
  children,
  header,
  lead,
  submit,
  submitting,
  announceSubmitting,
  footer,
}: FormBodyProps<T>): JSX.Element {
  const { offline, block, disabled } = useFormSubmission({
    submit,
    submitting,
    handleSubmit,
    onInvalid,
  });
  return (
    <form noValidate aria-busy={submitting} onSubmit={block.onSubmit}>
      <FormLead header={header} lead={lead} offline={offline} />
      {children}
      <SubmitControls
        submitting={submitting}
        isSubmitDisabled={disabled}
        blocked={block.blocked}
        submitLabel={submit.submitLabel}
        describedBy={block.describedBy}
        buttonRef={offline.submitRef}
        spacing={submit.submitSpacing}
        submitSx={submit.submitSx}
      />
      <BlockedReason block={block} />
      {footer}
      <UILiveStatus message={announceSubmitting ? submit.submittingLabel : ''} />
    </form>
  );
}

function headerOf<T extends FieldValues>(props: UIFormProps<T>): FormHeaderProps {
  const { title, subtitle = null, showTitle = true, showSubtitle = true } = props;
  return {
    title,
    subtitle,
    showTitle,
    showSubtitle,
    titleComponent: props.titleComponent,
    titleRef: props.titleRef,
  };
}

function submitOf<T extends FieldValues>(props: UIFormProps<T>): FormSubmitProps {
  const { submitLabel, submittingLabel, isSubmitDisabled = false, submitSpacing } = props;
  return {
    submitLabel,
    submittingLabel,
    isSubmitDisabled,
    blockedReason: props.submitBlockedReason,
    submitSpacing,
    submitRef: props.submitRef,
    submitSx: props.submitSx,
  };
}

export default function UIForm<T extends FieldValues>(props: UIFormProps<T>): JSX.Element {
  const { onSubmit, defaultValues, formOptions = {}, isSubmitting, resetOnSuccess = false } = props;
  const { error = null, notice, errorAction, errorOccurrence } = props;
  const { methods, submitting } = useUIForm<T>({ defaultValues, formOptions, isSubmitting });

  return (
    <FormProviderBridge methods={methods}>
      <FormBody
        handleSubmit={buildSubmitHandler({ onSubmit, methods, defaultValues, resetOnSuccess })}
        onInvalid={props.onInvalid}
        header={headerOf(props)}
        lead={{ error, notice, errorAction, errorOccurrence }}
        submit={submitOf(props)}
        submitting={submitting}
        announceSubmitting={props.submittingAnnouncement ?? submitting}
        footer={props.footer}
      >
        {props.children}
      </FormBody>
    </FormProviderBridge>
  );
}
