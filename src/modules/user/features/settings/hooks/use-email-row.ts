import useConnectivity from '@/hooks/use-connectivity';

import type { EmailRowState, ProfileFormProps } from '../types/components/profile-form';

import useEmailResend from './use-email-resend';

export default function useEmailRow(props: ProfileFormProps, saving: boolean): EmailRowState {
  const { user, adoption, toasts } = props;
  const online = useConnectivity();
  const { isSubmitting, resend } = useEmailResend(user, adoption, toasts);

  return { confirmed: user.confirmed, busy: saving || isSubmitting || !online, resend };
}
