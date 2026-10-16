import type { RefObject } from 'react';

import type { ToastQueue } from '@/components/types/ui-toast';
import type { UserEntity } from '@/modules/user/types/user/user-entity';

import type { UserEntityAdoption } from '../hooks/use-profile-load';

export interface ProfileFormProps {
  readonly user: UserEntity;
  readonly adoption: UserEntityAdoption;
  readonly refocus: boolean;
  readonly toasts: ToastQueue;
  readonly saveRef: RefObject<HTMLButtonElement | null>;
}
