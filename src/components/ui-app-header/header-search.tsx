import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as SearchIcon } from '@/assets/icons/shell/search.svg';
import type { HeaderSearchProps } from '@/components/types/ui-app-header';

import HeaderHiddenText from './header-hidden-text';
import styles from './styles';

export default function HeaderSearch({ layout }: HeaderSearchProps): JSX.Element {
  const { t } = useTranslation();
  const statusId = useId();

  return (
    <>
      <Box sx={styles.search[layout]}>
        <Box
          component={SearchIcon}
          aria-hidden="true"
          focusable="false"
          sx={styles.magnifier[layout]}
        />
        <Box
          component="input"
          type="search"
          disabled
          aria-label={t('app_shell.search.label')}
          aria-describedby={statusId}
          placeholder={t('app_shell.search.placeholder')}
          sx={styles.searchInput[layout]}
        />
      </Box>
      <HeaderHiddenText id={statusId}>{t('app_shell.unavailable')}</HeaderHiddenText>
    </>
  );
}
