import { useFormContext } from 'react-hook-form';
import type { FieldValues } from 'react-hook-form';

import type { FormSubmission, FormSubmissionOptions } from '@/components/types/ui-form';

import useOfflineSubmit from './use-offline-submit';
import useSubmitBlock from './use-submit-block';

// Offline, the submit is disabled rather than allowed to fail: the notice sits inside the
// form after its heading so the registration overlay never covers it, the button describes
// itself by the notice, and focus moves there if the button held it (issue #147).
export default function useFormSubmission<T extends FieldValues>({
  submit,
  submitting,
  handleSubmit,
  onInvalid,
}: FormSubmissionOptions<T>): FormSubmission {
  const methods = useFormContext<T>();
  const offline = useOfflineSubmit(submit.submitRef);
  const disabled = submit.isSubmitDisabled || !offline.online;
  const block = useSubmitBlock({
    reason: submit.blockedReason,
    nativelyDisabled: disabled || submitting,
    noticeId: offline.noticeId,
    onSubmit: methods.handleSubmit(handleSubmit, onInvalid),
  });

  return { offline, block, disabled };
}
