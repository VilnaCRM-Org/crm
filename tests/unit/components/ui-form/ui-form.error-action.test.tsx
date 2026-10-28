import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { type JSX, useState } from 'react';

import type { UIFormErrorAction } from '@/components/types/ui-form';
import UIForm from '@/components/ui-form';
import ErrorBanner from '@/components/ui-form/error-banner';
import render from '@tests/unit/utils/render-with-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

type Values = { name: string };

const DEFAULTS: Values = { name: '' };
const ERROR_TEXT = 'Request failed';
const ACTION_LABEL = 'Try again';

interface FormProps {
  error?: string | null;
  errorAction?: UIFormErrorAction | undefined;
}

function Form({ error, errorAction }: FormProps): JSX.Element {
  return (
    <UIForm<Values>
      defaultValues={DEFAULTS}
      onSubmit={jest.fn()}
      submitLabel="Submit"
      submittingLabel="Submitting…"
      title="Title"
      error={error}
      errorAction={errorAction}
    >
      <span />
    </UIForm>
  );
}

const retry = (onClick: () => void = jest.fn()): UIFormErrorAction => ({
  label: ACTION_LABEL,
  onClick,
});

type ActivationKey = 'click' | 'Enter' | 'Space';

const activate = async (user: UserEvent, how: ActivationKey): Promise<void> => {
  if (how === 'click') {
    await user.click(screen.getByRole('button', { name: ACTION_LABEL }));
    return;
  }
  await user.tab();
  await user.keyboard(how === 'Enter' ? '{Enter}' : ' ');
};

const bannerOf = (): HTMLElement => {
  const banner = screen
    .getAllByRole('generic')
    .find(
      (element) => element.tagName === 'SECTION' && element.contains(screen.getByRole('alert'))
    );
  if (!banner) throw new Error('The error banner section was not rendered');
  return banner;
};

describe('UIForm errorAction', () => {
  it('renders the alert text and then the action inside the focused banner', () => {
    render(<Form error={ERROR_TEXT} errorAction={retry()} />);

    const banner = bannerOf();
    const action = screen.getByRole('button', { name: ACTION_LABEL });

    expect(banner).toHaveFocus();
    expect(banner).toContainElement(screen.getByRole('alert'));
    expect(banner).toContainElement(action);
    expect(screen.getByRole('alert')).toHaveTextContent(ERROR_TEXT);
    expect(screen.getByRole('alert')).not.toHaveTextContent(ACTION_LABEL);
    expect(
      screen.getByRole('alert').compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('makes the action the next Tab stop after the banner', async () => {
    const user = userEvent.setup();
    render(<Form error={ERROR_TEXT} errorAction={retry()} />);

    await user.tab();

    expect(screen.getByRole('button', { name: ACTION_LABEL })).toHaveFocus();
  });

  it.each(['click', 'Enter', 'Space'] as const)(
    'calls the handler exactly once on %s',
    async (how) => {
      const onClick = jest.fn();
      const user = userEvent.setup();
      render(<Form error={ERROR_TEXT} errorAction={retry(onClick)} />);

      await activate(user, how);

      expect(onClick).toHaveBeenCalledTimes(1);
    }
  );

  it('renders nothing for an action without an error', () => {
    render(<Form errorAction={retry()} />);

    expect(screen.queryByRole('button', { name: ACTION_LABEL })).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders nothing for an action with an empty error', () => {
    render(<Form error="" errorAction={retry()} />);

    expect(screen.queryByRole('button', { name: ACTION_LABEL })).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders the same banner as before when no action is given', () => {
    render(<Form error={ERROR_TEXT} />);

    expect(bannerOf()).toHaveTextContent(new RegExp(`^${ERROR_TEXT}$`));
    expect(screen.queryByRole('button', { name: ACTION_LABEL })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('returns focus to the submit button when its action clears the error', async () => {
    const user = userEvent.setup();
    function Clearing(): JSX.Element {
      const [error, setError] = useState<string | null>(ERROR_TEXT);
      return <Form error={error} errorAction={retry(() => setError(null))} />;
    }
    render(<Clearing />);

    await user.click(screen.getByRole('button', { name: ACTION_LABEL }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toHaveFocus();
  });

  it('has no axe violation with the action shown', async () => {
    const { container } = render(<Form error={ERROR_TEXT} errorAction={retry()} />);

    await expectNoA11yViolations(container);
  });
});

describe('ErrorBanner action', () => {
  it('renders the action only when it is given', () => {
    const { rerender } = render(
      <ErrorBanner error={ERROR_TEXT} returnFocusRef={{ current: null }} />
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    rerender(
      <ErrorBanner error={ERROR_TEXT} action={retry()} returnFocusRef={{ current: null }} />
    );

    expect(screen.getByRole('button', { name: ACTION_LABEL })).toBeInTheDocument();
  });

  it('renders no action when there is no error', () => {
    const { container } = render(
      <ErrorBanner error={null} action={retry()} returnFocusRef={{ current: null }} />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
