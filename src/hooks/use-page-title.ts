import type { i18n as I18nInstance } from 'i18next';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const BASE_TITLE = 'VilnaCRM';

function bindTitle(i18n: I18nInstance, titleKey: string): () => void {
  const applyTitle = (): void => {
    document.title = `${i18n.t(titleKey)} - ${BASE_TITLE}`;
  };
  applyTitle();
  i18n.on?.('languageChanged', applyTitle);
  return (): void => {
    i18n.off?.('languageChanged', applyTitle);
    document.title = BASE_TITLE;
  };
}

export default function usePageTitle(titleKey: string): void {
  const { i18n } = useTranslation();

  useEffect(() => bindTitle(i18n, titleKey), [i18n, titleKey]);
}
