import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RefCallback } from 'react';

import type { FormErrorAction } from '@/components/types/ui-form';
import UIForm from '@/components/ui-form';
import render from '@tests/unit/utils/render-with-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

type Values = { name: string };

const DEFAULTS: Values = { name: '' };
const ERROR_TEXT = 'Request failed';

interface FormOverrides {
  readonly error?: string | null;
  readonly errorAction?: FormErrorAction | undefined;
  readonly titleRef?: RefCallback<HTMLElement> | undefined;
}

function renderForm({ error = null, errorAction, titleRef }: FormOverrides = {}): HTMLElement {
  const { container } = render(
    <UIForm<Values>
      defaultValues={DEFAULTS}
      onSubmit={jest.fn()}
      submitLabel="Submit"
      submittingLabel="Submitting…"
      title="Title"
      titleComponent="h1"
      error={error}
      errorAction={errorAction}
      titleRef={titleRef}
    >
      <span />
    </UIForm>
  );
  return container;
}

describe('UIForm error action and title ref', () => {
  it('renders the action as a native button after the alert text', () => {
    renderForm({ error: ERROR_TEXT, errorAction: { label: 'Retry', onClick: jest.fn() } });

    const alert = screen.getByRole('alert');
    const action = screen.getByRole('button', { name: 'Retry' });
    const banner = screen
      .getAllByRole('generic')
      .find((element) => element.tabIndex === -1 && element.contains(alert));
    expect(action.tagName).toBe('BUTTON');
    expect(action).toHaveAttribute('type', 'button');
    expect(banner).toContainElement(action);
    expect(alert.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it.each(['{Enter}', ' '])('calls onClick once per activation with %s', async (key) => {
    const onClick = jest.fn();
    renderForm({ error: ERROR_TEXT, errorAction: { label: 'Retry', onClick } });
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Retry' })).toHaveFocus();
    await userEvent.keyboard(key);

    await waitFor(() => expect(onClick).toHaveBeenCalledTimes(1));
  });

  it('reaches the action by Tab after the alert banner', async () => {
    renderForm({ error: ERROR_TEXT, errorAction: { label: 'Retry', onClick: jest.fn() } });

    await userEvent.tab();

    expect(screen.getByRole('button', { name: 'Retry' })).toHaveFocus();
  });

  it('renders no action button without an errorAction', () => {
    renderForm({ error: ERROR_TEXT });

    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('gives the title the ref and tabindex -1 when a titleRef is passed', () => {
    const titleRef = jest.fn();
    renderForm({ titleRef });

    const heading = screen.getByRole('heading', { level: 1, name: 'Title' });
    expect(titleRef).toHaveBeenCalledWith(heading);
    expect(heading).toHaveAttribute('tabindex', '-1');
  });

  it('leaves the title without a tabindex when no titleRef is passed', () => {
    renderForm();

    expect(screen.getByRole('heading', { level: 1, name: 'Title' })).not.toHaveAttribute(
      'tabindex'
    );
  });

  it('has no axe violations with the banner action', async () => {
    const view = renderForm({
      error: ERROR_TEXT,
      errorAction: { label: 'Retry', onClick: jest.fn() },
    });

    await expectNoA11yViolations(view);
  });
});
