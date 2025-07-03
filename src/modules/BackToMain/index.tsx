import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { Box, Typography } from '@mui/material';
import React from 'react';

import UIButton from '@/components/UIButton';
import UIContainer from '@/components/UIContainer';

import styles from './styles';


export default function BackToMain(): React.ReactElement {
  return (
    <Box component="section" sx={styles.section}>
      <UIContainer>
        <UIButton sx={styles.backButton}>
          <ArrowBackIosIcon sx={styles.icon} />
          <Typography
            sx={styles.backText}
          >
            На головну сторінку
          </Typography>
        </UIButton>
      </UIContainer>
    </Box>
  );
}
