import type { ProfileFieldErrorSet } from './outcome';

export interface ProfileFormState {
  readonly fieldErrors: ProfileFieldErrorSet;
  readonly noChanges: boolean;
  readonly noChangesMarked: boolean;
  readonly settled: number;
  readonly cleared: number;
  readonly attempts: number;
}
