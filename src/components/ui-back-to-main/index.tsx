import UiBackToMain from '@vilnacrm/ui-toolkit/ui-back-to-main';
import React from 'react';
import { useTranslation } from 'react-i18next';

import BackArrow from '@/assets/icons/arrows/back-arrow.svg';

export default function UIBackToMain(): React.ReactElement {
  const { t } = useTranslation();

  return (
    <UiBackToMain
      label={t('buttons.back_to_main')}
      icon={<img src={BackArrow} alt="" aria-hidden="true" />}
    />
  );
}
