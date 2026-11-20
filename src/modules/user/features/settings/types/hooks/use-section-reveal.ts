import type { UserEntity } from '@/modules/user/types/user/user-entity';

import type ProfileChangeDetector from '../../utils/profile-change-detector';
import type { RevealedProfileSection } from '../user-profile/profile-section';

export interface SectionRevealOptions {
  readonly section: RevealedProfileSection;
  readonly user: UserEntity;
  readonly changes: ProfileChangeDetector;
  readonly onChange: (changed: boolean) => void;
}
