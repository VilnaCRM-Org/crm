import type { Dispatch, SetStateAction, MutableRefObject } from 'react';

import type { SignUpDto } from '@/modules/user/types/user/sign-up-dto';
import type { RegistrationView } from '@auth/components/form-section/types';

export interface RegistrationStoreActions {
  registerUser: (data: SignUpDto) => Promise<void>;
  resetRegistration: () => void;
}

export interface RegistrationHandlerDeps {
  setView: Dispatch<SetStateAction<RegistrationView>>;
  setFormKey: Dispatch<SetStateAction<number>>;
  lastSubmittedDataRef: MutableRefObject<SignUpDto | null>;
}

export interface RegistrationHandlers {
  handleRegister: (data: SignUpDto) => Promise<void>;
  handleSuccessShown: () => void;
  handleBackToForm: () => void;
  handleRetry: () => void;
}
