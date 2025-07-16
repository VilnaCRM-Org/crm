import { useTranslation } from 'react-i18next';

function App() {
  const { t } = useTranslation();

  const click = () => {
    setTimeout(() => {
      // eslint-disable-next-line no-console
      console.log('done');
    }, 2000);
  };

  return (
    <div>
      <button type="button" onClick={click}>
        {t('hello')}
      </button>
    </div>
  );
}

export default App;
