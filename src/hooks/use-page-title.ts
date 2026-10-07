import type { i18n as I18nInstance } from 'i18next';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

function bindTitle(i18n: I18nInstance, titleKey: string): () => void {
  const baseTitle = 'VilnaCRM';
  const applyTitle = (): void => {
    document.title = `${i18n.t(titleKey)} - ${baseTitle}`;
  };
  applyTitle();
  i18n.on?.('languageChanged', applyTitle);
  return (): void => {
    i18n.off?.('languageChanged', applyTitle);
    document.title = baseTitle;
  };
}

export default function usePageTitle(titleKey: string): void {
  const { i18n } = useTranslation();

  useEffect(() => bindTitle(i18n, titleKey), [i18n, titleKey]);
}
