import type { TFunction } from 'i18next';
import type { ReactNode } from 'react';

import type { LoginSubmitter } from '@auth/types/auth-forms/use-login-submitter';
import type { LoginView, LoginViewState } from '@auth/types/auth-forms/use-login-view';
import type { PostLoginRedirect } from '@auth/types/sign-in/post-login-redirect';

export type LoginViewListener = (view: LoginView) => void;

export interface LoginFormProps {
  readonly notice?: ReactNode;
  readonly postLogin: PostLoginRedirect;
  readonly onViewChange?: LoginViewListener | undefined;
}

export interface LoginFormPanelProps {
  readonly notice?: ReactNode;
  readonly submitter: LoginSubmitter;
  readonly viewState: LoginViewState;
  readonly t: TFunction;
}

export interface LoginNotificationPanelProps {
  readonly submitter: LoginSubmitter;
  readonly viewState: LoginViewState;
  readonly postLogin: PostLoginRedirect;
  readonly t: TFunction;
}

export interface FocusEmailOnReturnProps {
  readonly returnCount: number;
}
