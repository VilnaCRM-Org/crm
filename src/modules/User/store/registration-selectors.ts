import type { RegistrationState } from '@/modules/User/store/registration-slice';
import type { RootState } from '@/stores';

export const selectRegistrationUser = (state: RootState): RegistrationState['user'] =>
  state.registration.user;

export const selectRegistrationLoading = (state: RootState): RegistrationState['loading'] =>
  state.registration.loading;

export const selectRegistrationError = (state: RootState): RegistrationState['error'] =>
  state.registration.error;

export const selectRegistrationRetryable = (state: RootState): RegistrationState['retryable'] =>
  state.registration.retryable;
