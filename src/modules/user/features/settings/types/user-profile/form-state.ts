import type { ProfileFieldErrorSet } from './outcome';

export interface ProfileFormState {
  readonly fieldErrors: ProfileFieldErrorSet;
  readonly noChanges: boolean;
  readonly settled: number;
}
