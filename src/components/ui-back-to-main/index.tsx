import styled from '@emotion/styled';
import UiBackToMain from '@vilnacrm/ui-toolkit/ui-back-to-main';
import React from 'react';
import { useTranslation } from 'react-i18next';

import BackArrow from '@/assets/icons/arrows/back-arrow.svg';

import styles from './styles';

const Band = styled('div')(styles.band);

export default function UIBackToMain(): React.ReactElement {
  const { t } = useTranslation();

  return (
    <Band id="back-to-main-band">
      <UiBackToMain
        label={t('buttons.back_to_main')}
        icon={<img src={BackArrow} alt="" aria-hidden="true" />}
      />
    </Band>
  );
}
