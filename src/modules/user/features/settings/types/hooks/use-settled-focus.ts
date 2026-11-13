import type { RefObject } from 'react';

import type { ProfileFormState } from '../user-profile/form-state';
import type { ProfileSection } from '../user-profile/profile-section';

export interface SettledFocusOptions {
  readonly state: ProfileFormState;
  readonly section: ProfileSection;
  readonly buttonRef: RefObject<HTMLButtonElement | null>;
  readonly saveRef: RefObject<HTMLElement | null>;
  readonly headingRef: RefObject<HTMLElement | null>;
}
