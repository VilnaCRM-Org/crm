import { useTranslation } from 'react-i18next';

function App() {
  const { t } = useTranslation();

  const click = () => {
    setTimeout(() => {
      // eslint-disable-next-line
      console.log('done');
    }, 2000);
  };

  return (
    <div>
      {/* eslint-disable-next-line react/button-has-type */}
      <button onClick={click}>{ t('hello') }</button>
    </div>
  );
}

export default App;
