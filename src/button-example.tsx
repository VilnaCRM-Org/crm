import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import i18n from './i18n';

export default function ButtonExample(): JSX.Element {
  const { t } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = i18n.dir?.() || 'ltr';
  }, []);

  const handleClick = (): void => undefined;

  return (
    <button type="button" onClick={handleClick}>
      {t('hello')}
    </button>
  );
}
