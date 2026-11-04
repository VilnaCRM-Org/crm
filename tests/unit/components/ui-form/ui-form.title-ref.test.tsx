import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import type { RefCallback } from 'react';

import UIForm from '@/components/ui-form';
import render from '@tests/unit/utils/render-with-i18n';

type Values = { name: string };

const DEFAULTS: Values = { name: '' };
const ERROR_TEXT = 'Request failed';

interface FormOverrides {
  readonly error?: string | null;
  readonly titleRef?: RefCallback<HTMLElement> | undefined;
}

function renderForm({ error = null, titleRef }: FormOverrides = {}): HTMLElement {
  const { container } = render(
    <UIForm<Values>
      defaultValues={DEFAULTS}
      onSubmit={jest.fn()}
      submitLabel="Submit"
      submittingLabel="Submitting…"
      title="Title"
      titleComponent="h1"
      error={error}
      titleRef={titleRef}
    >
      <span />
    </UIForm>
  );
  return container;
}

describe('UIForm title ref', () => {
  it('gives the title the ref and tabindex -1 when a titleRef is passed', () => {
    const titleRef = jest.fn();
    renderForm({ titleRef });

    const heading = screen.getByRole('heading', { level: 1, name: 'Title' });
    expect(titleRef).toHaveBeenCalledWith(heading);
    expect(heading).toHaveAttribute('tabindex', '-1');
  });

  it('focuses the title through its ref when no banner is shown', () => {
    const focusTitle: RefCallback<HTMLElement> = (node) => node?.focus();
    renderForm({ titleRef: focusTitle });

    expect(screen.getByRole('heading', { level: 1, name: 'Title' })).toHaveFocus();
  });

  it('leaves focus on the banner when it mounts together with a focusing titleRef', () => {
    const focusTitle = jest.fn<void, [HTMLElement | null]>((node) => node?.focus());
    renderForm({ error: ERROR_TEXT, titleRef: focusTitle });

    const heading = screen.getByRole('heading', { level: 1, name: 'Title' });
    const alert = screen.getByRole('alert');
    const banner = screen
      .getAllByRole('generic')
      .find((element) => element.getAttribute('tabindex') === '-1' && element.contains(alert));
    expect(banner).toBeDefined();
    expect(banner).toHaveFocus();
    expect(heading).not.toHaveFocus();
    expect(focusTitle).not.toHaveBeenCalled();
    expect(heading).toHaveAttribute('tabindex', '-1');
  });

  it('leaves the title without a tabindex when no titleRef is passed', () => {
    renderForm();

    expect(screen.getByRole('heading', { level: 1, name: 'Title' })).not.toHaveAttribute(
      'tabindex'
    );
  });
});
