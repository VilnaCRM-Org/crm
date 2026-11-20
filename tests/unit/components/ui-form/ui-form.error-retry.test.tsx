import '@testing-library/jest-dom';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';

import type { UIFormErrorAction } from '@/components/types/ui-form';
import UIForm from '@/components/ui-form';
import useConnectivityStore from '@/lib/connectivity/use-connectivity-store';
import render from '@tests/unit/utils/render-with-i18n';
import { resetClientStores } from '@tests/utils/reset-client-stores';

type Values = { name: string };

const DEFAULTS: Values = { name: '' };
const ERROR_TEXT = 'Request failed';
const ACTION_LABEL = 'Try again';
const OFFLINE = 'You are offline. Submitting is unavailable until your connection is restored.';

interface FormProps {
  readonly occurrence?: number;
  readonly action: UIFormErrorAction;
}

function Form({ occurrence, action }: FormProps): JSX.Element {
  return (
    <UIForm<Values>
      defaultValues={DEFAULTS}
      onSubmit={jest.fn()}
      submitLabel="Submit"
      submittingLabel="Submitting…"
      title="Title"
      error={ERROR_TEXT}
      errorAction={action}
      errorOccurrence={occurrence}
    >
      <span />
    </UIForm>
  );
}

const actionOf = (): HTMLElement => screen.getByRole('button', { name: ACTION_LABEL });

const sectionOf = (alert: HTMLElement): HTMLElement => {
  const section = screen
    .getAllByRole('generic')
    .find((element) => element.tagName === 'SECTION' && element.contains(alert));
  if (!section) throw new Error('The error banner section was not rendered');
  return section;
};

describe('UIForm error retry', () => {
  beforeEach(() => resetClientStores());

  it('offers the action while online, undescribed', async () => {
    const onClick = jest.fn();
    render(<Form action={{ label: ACTION_LABEL, onClick }} />);

    await userEvent.click(actionOf());

    expect(actionOf()).not.toHaveAttribute('aria-disabled');
    expect(actionOf()).not.toHaveAttribute('aria-describedby');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('marks the action unavailable and describes it by the offline notice offline', async () => {
    const onClick = jest.fn();
    render(<Form action={{ label: ACTION_LABEL, onClick }} />);

    act(() => useConnectivityStore.setState({ online: false }));
    await userEvent.click(actionOf());

    expect(actionOf()).toHaveAttribute('aria-disabled', 'true');
    expect(actionOf()).toHaveAccessibleDescription(OFFLINE);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('mounts a new, focused banner when the same error occurs again', () => {
    const action = { label: ACTION_LABEL, onClick: jest.fn() };
    const view = render(<Form action={action} occurrence={1} />);
    const first = screen.getByRole('alert');
    actionOf().focus();

    view.rerender(<Form action={action} occurrence={2} />);

    const second = screen.getByRole('alert');
    expect(second).not.toBe(first);
    expect(second).toHaveTextContent(ERROR_TEXT);
    expect(sectionOf(second)).toHaveFocus();
  });

  it('keeps the same banner while the occurrence does not change', () => {
    const action = { label: ACTION_LABEL, onClick: jest.fn() };
    const view = render(<Form action={action} occurrence={1} />);
    const first = screen.getByRole('alert');
    actionOf().focus();

    view.rerender(<Form action={action} occurrence={1} />);

    expect(screen.getByRole('alert')).toBe(first);
    expect(actionOf()).toHaveFocus();
  });
});
