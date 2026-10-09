import type { Dispatch, SetStateAction, MutableRefObject } from 'react';

import type { RegistrationView } from '@auth/components/form-section/types';
import type { RegisterUserDto } from '@auth/types/credentials';

export interface RegistrationStoreActions {
  registerUser: (data: RegisterUserDto) => Promise<void>;
  resetRegistration: () => void;
}

export interface RegistrationHandlerDeps {
  setView: Dispatch<SetStateAction<RegistrationView>>;
  setFormKey: Dispatch<SetStateAction<number>>;
  lastSubmittedDataRef: MutableRefObject<RegisterUserDto | null>;
}

export interface RegistrationHandlers {
  handleRegister: (data: RegisterUserDto) => Promise<void>;
  handleSuccessShown: () => void;
  handleBackToForm: () => void;
  handleRetry: () => void;
}
