import type { Dispatch, SetStateAction, MutableRefObject } from 'react';

import { RegistrationView } from '@auth/components/form-section/types';
import { RegisterUserDto } from '@auth/types/credentials';

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

export default class RegistrationHandlersFactory {
  private readonly deps: RegistrationHandlerDeps;
  private readonly actions: RegistrationStoreActions;

  constructor(deps: RegistrationHandlerDeps, actions: RegistrationStoreActions) {
    this.deps = deps;
    this.actions = actions;
  }

  public build(): RegistrationHandlers {
    return {
      handleRegister: this.handleRegister.bind(this),
      handleSuccessShown: this.handleSuccessShown.bind(this),
      handleBackToForm: this.handleBackToForm.bind(this),
      handleRetry: this.handleRetry.bind(this),
    };
  }

  private normalize(data: RegisterUserDto): RegisterUserDto {
    return {
      ...data,
      fullName: data.fullName.trim(),
    };
  }

  private async handleRegister(data: RegisterUserDto): Promise<void> {
    const normalized = this.normalize(data);
    this.deps.lastSubmittedDataRef.current = normalized;
    await this.actions.registerUser(normalized);
  }

  private handleSuccessShown(): void {
    this.deps.setFormKey((prev) => prev + 1);
  }

  private handleBackToForm(): void {
    this.deps.setView('form');
    this.actions.resetRegistration();
    this.deps.lastSubmittedDataRef.current = null;
  }

  private handleRetry(): void {
    const last = this.deps.lastSubmittedDataRef.current;
    if (!last) return;
    this.actions.resetRegistration();
    void this.actions.registerUser(last);
  }
}
