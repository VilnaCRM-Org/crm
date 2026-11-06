import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router';

import ComingSoonHomeLink from '@/components/coming-soon/coming-soon-home-link';
import useArrivalFocus from '@/hooks/use-arrival-focus';
import createComingSoonLocaleI18n from '@tests/unit/utils/create-coming-soon-locale-i18n';
import ShellLocation from '@tests/unit/utils/shell-location';

function ArrivalFrame(): JSX.Element {
  const focusOnArrival = useArrivalFocus();

  return (
    <main ref={focusOnArrival} tabIndex={-1}>
      <ComingSoonHomeLink />
      <ShellLocation />
    </main>
  );
}

function PlainFrame(): JSX.Element {
  return (
    <main tabIndex={-1}>
      <ComingSoonHomeLink />
      <ShellLocation />
    </main>
  );
}

const renderLink = (Frame: () => JSX.Element = PlainFrame): ReturnType<typeof render> =>
  render(
    <I18nextProvider i18n={createComingSoonLocaleI18n('en')}>
      <MemoryRouter initialEntries={['/boards']}>
        <Routes>
          <Route path="*" element={<Frame />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  );

describe('ComingSoonHomeLink', () => {
  it('is one contained link to / named by the coming_soon.home_link copy', () => {
    renderLink();

    const link = screen.getByRole('link', { name: 'Back to the home page' });

    expect(link).toHaveAttribute('href', '/');
    expect(link).toHaveClass('MuiButton-contained');
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('sits directly in the actions box the contrast exception is scoped to', () => {
    renderLink();

    const link = screen.getByRole('link', { name: 'Back to the home page' });
    const actions = screen
      .getAllByRole('generic')
      .find((element) => element.id === 'error-page-actions');

    expect(link.matches('#error-page-actions > .MuiButton-contained')).toBe(true);
    expect(actions).toContainElement(link);
    expect(within(actions as HTMLElement).getAllByRole('link')).toHaveLength(1);
  });

  it('navigates inside the router to / with state.focusMain', async () => {
    const user = userEvent.setup();
    renderLink();

    await user.click(screen.getByRole('link', { name: 'Back to the home page' }));

    expect(screen.getByLabelText('location')).toHaveTextContent('/|{"focusMain":true}');
  });

  it('puts focus on main on arrival, which then clears the marker', async () => {
    const user = userEvent.setup();
    renderLink(ArrivalFrame);

    await user.click(screen.getByRole('link', { name: 'Back to the home page' }));

    expect(screen.getByRole('main')).toHaveFocus();
    expect(screen.getByLabelText('location')).toHaveTextContent('/|{"focusMain":false}');
  });

  it('prevents the document load a plain anchor would cause', () => {
    renderLink();

    const proceeded = fireEvent.click(screen.getByRole('link', { name: 'Back to the home page' }));

    expect(proceeded).toBe(false);
  });

  it('leaves a modified click to the browser, so a new tab keeps working', () => {
    renderLink();

    const proceeded = fireEvent.click(screen.getByRole('link', { name: 'Back to the home page' }), {
      ctrlKey: true,
    });

    expect(proceeded).toBe(true);
    expect(screen.getByLabelText('location')).toHaveTextContent('/boards|null');
  });

  it('activates from the keyboard with Enter', async () => {
    const user = userEvent.setup();
    renderLink();
    act(() => screen.getByRole('link', { name: 'Back to the home page' }).focus());

    await user.keyboard('{Enter}');

    expect(screen.getByLabelText('location')).toHaveTextContent('/|{"focusMain":true}');
  });
});
