import type { TFunction } from 'i18next';
import type { Dispatch } from 'react';

import type { ProfileUpdateOutcome } from '../user-profile/outcome';
import type { ProfileChange } from '../user-profile/profile-change';

import type { ProfileEditContext, ProfileFormAction, SectionTargets } from './use-profile-save';

export interface SaveSettleOptions {
  readonly props: ProfileEditContext;
  readonly targets: SectionTargets;
  readonly dispatch: Dispatch<ProfileFormAction>;
}

export interface SaveSettleContext extends SaveSettleOptions {
  readonly t: TFunction;
}

export type SaveSettle = (outcome: ProfileUpdateOutcome, change: ProfileChange) => void;
