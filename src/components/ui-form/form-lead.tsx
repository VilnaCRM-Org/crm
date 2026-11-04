import { type JSX, useState } from 'react';

import type { FormHeaderSectionProps, FormLeadSectionProps } from '@/components/types/ui-form';
import styles from '@/components/ui-form/styles';
import UIOfflineNotice from '@/components/ui-offline-notice';
import UITypography from '@/components/ui-typography';

import ErrorBanner from './error-banner';
import useFocusReturn from './use-focus-return';

function FormHeader({ header, bannerShown }: FormHeaderSectionProps): JSX.Element {
  const { title, subtitle, showTitle, showSubtitle, titleComponent, titleRef } = header;
  const [bannerAtMount] = useState(bannerShown);
  return (
    <>
      {showTitle && title && (
        <UITypography
          variant="h4"
          component={titleComponent}
          sx={styles.formTitle}
          ref={bannerAtMount ? undefined : titleRef}
          tabIndex={titleRef ? -1 : undefined}
        >
          {title}
        </UITypography>
      )}
      {showSubtitle && subtitle && <UITypography sx={styles.formSubtitle}>{subtitle}</UITypography>}
    </>
  );
}

export default function FormLead({ header, lead, offline }: FormLeadSectionProps): JSX.Element {
  const focusReturn = useFocusReturn(Boolean(lead.error), offline.submitRef);

  return (
    <>
      <FormHeader header={header} bannerShown={Boolean(lead.error)} />
      {lead.notice}
      <ErrorBanner
        key={lead.errorOccurrence}
        error={lead.error}
        action={lead.errorAction}
        focusReturn={focusReturn}
        unavailableReasonId={offline.online ? undefined : offline.noticeId}
      />
      <UIOfflineNotice ref={offline.noticeRef} id={offline.noticeId} online={offline.online} />
    </>
  );
}
