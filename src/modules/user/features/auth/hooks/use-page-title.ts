import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function usePageTitle(titleKey: string): void {
  const { i18n } = useTranslation();

  useEffect(() => {
    const applyTitle = (): void => {
      document.title = `${i18n.t(titleKey)} - VilnaCRM`;
    };
    applyTitle();
    i18n.on?.('languageChanged', applyTitle);
    return (): void => i18n.off?.('languageChanged', applyTitle);
  }, [i18n, titleKey]);
}
