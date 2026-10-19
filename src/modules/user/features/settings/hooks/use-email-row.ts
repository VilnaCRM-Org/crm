import useConnectivity from '@/hooks/use-connectivity';

import type { EmailRowState } from '../types/hooks/use-email-row';
import type { ProfileEditContext } from '../types/hooks/use-profile-save';

import useEmailResend from './use-email-resend';

export default function useEmailRow(context: ProfileEditContext, saving: boolean): EmailRowState {
  const { user, adoption, toasts } = context;
  const online = useConnectivity();
  const { isSubmitting, resend } = useEmailResend(user, adoption, toasts);

  return { confirmed: user.confirmed, busy: saving || isSubmitting || !online, resend };
}
