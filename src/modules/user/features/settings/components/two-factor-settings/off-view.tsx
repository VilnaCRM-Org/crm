import type { JSX } from 'react';
import type { FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import UIForm from '@/components/ui-form';
import useSubmitRetry from '@/hooks/use-submit-retry';

import useStatusText from '../../hooks/use-status-text';
import useTwoFactorBanner from '../../hooks/use-two-factor-banner';
import type { TwoFactorSettingsProps } from '../../types/two-factor/settings-view';

import OffGuide from './off-guide';
import StatusHeading from './status-heading';
import styles from './styles';

const NO_VALUES: FieldValues = {};

export default function OffView({
  view,
  callbacks,
  isSubmitting,
}: TwoFactorSettingsProps): JSX.Element {
  const { t } = useTranslation();
  const { submitRef, retry } = useSubmitRetry();
  const banner = useTwoFactorBanner(view.banner, retry);
  const status = useStatusText(view);

  return (
    <UIForm<FieldValues>
      defaultValues={NO_VALUES}
      onSubmit={callbacks.start}
      isSubmitting={isSubmitting}
      error={banner.error}
      errorAction={banner.action}
      errorOccurrence={view.bannerOccurrence}
      submitRef={submitRef}
      title=""
      showTitle={false}
      submitLabel={t('settings.two_factor.start')}
      submittingLabel={t('settings.two_factor.preparing')}
      submitSx={styles.submit}
    >
      <StatusHeading text={status} icon={false} focus />
      <OffGuide />
    </UIForm>
  );
}
