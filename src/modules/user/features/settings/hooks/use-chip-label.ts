import { useTranslation } from 'react-i18next';

import type { UserDisplayName } from '@/modules/user/types/lib/user-display-name';

export default function useChipLabel(identity: UserDisplayName | null): string {
  const { t } = useTranslation();
  const name = identity?.displayName.trim() ?? '';

  return name === '' ? t('user_menu.button') : t('user_menu.button_named', { name });
}
