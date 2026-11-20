import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';

import UIForm from '@/components/ui-form';
import render from '@tests/unit/utils/render-with-i18n';

type Values = { name: string };

const DEFAULTS: Values = { name: '' };
const ERROR_TEXT = 'Request failed';

interface FormState {
  error: string | null;
  occurrence?: number | undefined;
}

function Form({ error, occurrence }: FormState): JSX.Element {
  return (
    <>
      <UIForm<Values>
        defaultValues={DEFAULTS}
        onSubmit={jest.fn()}
        submitLabel="Submit"
        submittingLabel="Submitting…"
        title="Title"
        error={error}
        errorOccurrence={occurrence}
      >
        <span />
      </UIForm>
      <button type="button">Elsewhere</button>
    </>
  );
}

const bannerOf = (): HTMLElement | undefined =>
  screen
    .getAllByRole('generic')
    .find((element) => element.tagName === 'SECTION' && element.textContent === ERROR_TEXT);

const submitOf = (): HTMLElement => screen.getByRole('button', { name: 'Submit' });

describe('UIForm error banner focus return', () => {
  it('returns focus to submit when the error clears and its occurrence resets', async () => {
    const { rerender } = render(<Form error={ERROR_TEXT} occurrence={2} />);
    expect(bannerOf()).toHaveFocus();

    rerender(<Form error={null} occurrence={0} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await waitFor(() => expect(submitOf()).toHaveFocus());
  });

  it('returns focus to submit when the error clears under the same occurrence', async () => {
    const { rerender } = render(<Form error={ERROR_TEXT} occurrence={1} />);
    expect(bannerOf()).toHaveFocus();

    rerender(<Form error={null} occurrence={1} />);

    await waitFor(() => expect(submitOf()).toHaveFocus());
  });

  it('holds focus across a new occurrence and returns it when that one clears', async () => {
    const { rerender } = render(<Form error={ERROR_TEXT} occurrence={1} />);
    rerender(<Form error={ERROR_TEXT} occurrence={2} />);
    expect(bannerOf()).toHaveFocus();

    rerender(<Form error={null} occurrence={0} />);

    await waitFor(() => expect(submitOf()).toHaveFocus());
  });

  it('leaves focus where the user moved it when the error clears', async () => {
    const { rerender } = render(<Form error={ERROR_TEXT} occurrence={1} />);
    await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }));

    rerender(<Form error={null} occurrence={0} />);

    expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus();
  });
});
