import type { RegisterUserDto } from '@auth/types/credentials';

import type {
  RegistrationStoreActions,
  RegistrationHandlerDeps,
  RegistrationHandlers,
} from './registration-handlers-factory.types';

const normalize = (data: RegisterUserDto): RegisterUserDto => ({
  ...data,
  fullName: data.fullName.trim(),
});

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

  private async handleRegister(data: RegisterUserDto): Promise<void> {
    const normalized = normalize(data);
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
