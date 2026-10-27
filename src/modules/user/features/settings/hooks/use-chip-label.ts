import { useTranslation } from 'react-i18next';

import type { UserDisplayName } from '@/modules/user/types/lib/user-display-name';

export default function useChipLabel(identity: UserDisplayName | null): string {
  const { t } = useTranslation();
  const label = t('user_menu.button');
  const name = identity?.displayName.trim() ?? '';

  return name === '' ? label : `${name}, ${label}`;
}
