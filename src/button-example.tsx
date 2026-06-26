import { useTranslation } from 'react-i18next';

const noop = (): void => undefined;

export default function ButtonExample(): JSX.Element {
  const { t } = useTranslation();

  return (
    <button type="button" onClick={noop}>
      {t('hello')}
    </button>
  );
}
