import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function useRootLayoutDir(): void {
  const { i18n } = useTranslation();
  useEffect(() => {
    const applyDir = (): void => {
      document.documentElement.dir = i18n.dir?.(i18n.language) ?? 'ltr';
    };
    applyDir();
    i18n.on?.('languageChanged', applyDir);
    return (): void => {
      i18n.off?.('languageChanged', applyDir);
    };
  }, [i18n]);
}
