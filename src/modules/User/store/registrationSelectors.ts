import type { RootState } from '@/stores';

import type { RegistrationState } from './registrationSlice';

export const selectRegistrationLoading = (state: RootState): RegistrationState['loading'] =>
  state.registration.loading;

export const selectRegistrationError = (state: RootState): RegistrationState['error'] =>
  state.registration.error;
