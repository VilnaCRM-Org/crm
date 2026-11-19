import { useFormContext } from 'react-hook-form';
import type { FieldValues } from 'react-hook-form';

import type { FormSubmission, FormSubmissionOptions } from '@/components/types/ui-form';

import useOfflineSubmit from './use-offline-submit';
import useSubmitBlock from './use-submit-block';

// Offline, the submit is refused rather than allowed to fail. With a notice it is disabled: the
// notice sits inside the form after its heading so the registration overlay never covers it, the
// button describes itself by the notice, and focus moves there if the button held it (issue
// #147). Without one it stays focusable and aria-disabled, so focus never drops to the page.
export default function useFormSubmission<T extends FieldValues>({
  submit,
  submitting,
  handleSubmit,
  onInvalid,
  noticeShown,
}: FormSubmissionOptions<T>): FormSubmission {
  const methods = useFormContext<T>();
  const offline = useOfflineSubmit(submit.submitRef, noticeShown);
  const offlineDisabled = !offline.online && noticeShown;
  const disabled = submit.isSubmitDisabled || offlineDisabled;
  const block = useSubmitBlock({
    reason: submit.blockedReason,
    nativelyDisabled: disabled || submitting,
    held: !offline.online && !noticeShown,
    noticeId: offline.noticeId,
    onSubmit: methods.handleSubmit(handleSubmit, onInvalid),
  });

  return { offline, block, disabled };
}
