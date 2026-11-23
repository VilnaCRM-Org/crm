import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import formStyles from '@/components/ui-form/styles';
import UITypography from '@/components/ui-typography';
import useFocusOnMount from '@/utils/use-focus-on-mount';
import recoveryStyles from '@auth/components/reset-password/styles';

export default function SocialLinkReturnView(): JSX.Element {
  const { t } = useTranslation();
  const focusOnMount = useFocusOnMount<HTMLElement>();

  return (
    <>
      <UITypography
        component="h1"
        ref={focusOnMount}
        tabIndex={-1}
        sx={[formStyles.formTitle, recoveryStyles.resultTitle]}
      >
        {t('auth.social.link_title')}
      </UITypography>
      <UITypography sx={recoveryStyles.resultBody}>{t('auth.social.link_return')}</UITypography>
    </>
  );
}
