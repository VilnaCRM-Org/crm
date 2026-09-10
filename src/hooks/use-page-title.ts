import type { i18n as I18nInstance } from 'i18next';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

function bindTitle(i18n: I18nInstance, titleKey: string): () => void {
  // Declared inside the binding rather than at module scope: a module-level literal is evaluated
  // at import, so its mutant is attributed to whichever suite loaded the hook first instead of to
  // the assertions below it.
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
