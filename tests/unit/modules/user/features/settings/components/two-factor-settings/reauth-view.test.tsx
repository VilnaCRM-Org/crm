import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import Reauth from '@/modules/user/features/settings/components/two-factor-settings/reauth-view';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

import { panelProps, viewState } from './render-panel';

const MESSAGE =
  'З міркувань безпеки нові коди можна створити лише протягом 5 хвилин після входу. ' +
  'Увійдіть знову, щоб продовжити.';

function Wrapper({ children }: { children: ReactNode }): JSX.Element {
  return <I18nextProvider i18n={createSettingsLocaleI18n('uk', [])}>{children}</I18nextProvider>;
}

const mount = (): ReturnType<typeof panelProps> => {
  const props = panelProps({ view: viewState('reauth') });
  render(
    <Reauth
      settings={props.settings}
      view={props.view}
      callbacks={props.callbacks}
      isSubmitting={props.isSubmitting}
    />,
    { wrapper: Wrapper }
  );
  return props;
};

describe('ReauthView', () => {
  it('focuses the message on mount and keeps it out of the tab order', async () => {
    mount();
    const message = screen.getByText(MESSAGE);

    expect(message).toHaveFocus();
    message.blur();
    await userEvent.tab();

    expect(screen.getByRole('button', { name: 'Увійти знову' })).toHaveFocus();
  });

  it('asks to sign in again when the button is pressed', async () => {
    const props = mount();

    await userEvent.click(screen.getByRole('button', { name: 'Увійти знову' }));

    expect(props.callbacks.signInAgain).toHaveBeenCalledTimes(1);
  });
});
