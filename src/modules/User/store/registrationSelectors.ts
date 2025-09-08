import type { RootState } from '@/stores';

import type { RegistrationState } from './registrationSlice';

export const selectRegistrationUser = (state: RootState): RegistrationState['user'] =>
  state.registration.user;

export const selectRegistrationLoading = (state: RootState): RegistrationState['loading'] =>
  state.registration.loading;

export const selectRegistrationError = (state: RootState): RegistrationState['error'] =>
  state.registration.error;

export const selectRegistrationRetryable = (state: RootState): RegistrationState['retryable'] =>
  state.registration.retryable;
