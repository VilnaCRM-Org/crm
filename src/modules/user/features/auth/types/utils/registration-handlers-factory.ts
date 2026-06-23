import type { Dispatch, SetStateAction, MutableRefObject } from 'react';

import type { RegistrationView } from '@auth/components/form-section/types';
import type { RegisterUserDto } from '@auth/types/credentials';

export type RegistrationStoreActions = {
  registerUser: (data: RegisterUserDto) => Promise<void>;
  resetRegistration: () => void;
};

export type RegistrationHandlerDeps = {
  setView: Dispatch<SetStateAction<RegistrationView>>;
  setFormKey: Dispatch<SetStateAction<number>>;
  lastSubmittedDataRef: MutableRefObject<RegisterUserDto | null>;
};

export type RegistrationHandlers = {
  handleRegister: (data: RegisterUserDto) => Promise<void>;
  handleSuccessShown: () => void;
  handleBackToForm: () => void;
  handleRetry: () => void;
};
