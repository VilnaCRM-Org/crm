import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function useRecoveryNoticeMessage(count: number): string {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');

  useEffect(() => {
    setMessage(
      count === 0
        ? t('recovery_codes_notice.none')
        : t('recovery_codes_notice.remaining', { count })
    );
  }, [count, t]);

  return message;
}
