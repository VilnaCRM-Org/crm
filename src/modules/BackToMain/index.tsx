import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';
import { useTranslation } from 'react-i18next';

import BackArrow from '@/assets/icons/arrows/back-arrow.svg';
import UIButton from '@/components/UIButton';
import UIContainer from '@/components/UIContainer';

import getBackToMainStyles from './styles';

export default function BackToMain(): React.ReactElement {
  const theme = useTheme();
  const styles = getBackToMainStyles(theme);
  const { t } = useTranslation();

  return (
    <Box component="section" sx={styles.section}>
      <UIContainer>
        <UIButton sx={styles.backButton}>
          <Box sx={styles.icon}>
            <img src={BackArrow} alt="Back arrow icon" />
          </Box>

          <Typography sx={styles.backText}>{t('buttons.back_to_main')}</Typography>
        </UIButton>
      </UIContainer>
    </Box>
  );
}
