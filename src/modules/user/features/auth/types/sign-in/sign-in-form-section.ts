import type { ArrivalNotice } from '@/routes/types/navigation-state';
import type { PostLoginRedirect } from '@auth/types/sign-in/post-login-redirect';

export interface SignInFormSectionProps {
  readonly notice: ArrivalNotice | null;
  readonly postLogin: PostLoginRedirect;
}
