import { screen, waitFor } from '@testing-library/react';
import type { JSX } from 'react';

import type { SubmitSpacing } from '@/components/types/ui-form';
import UIForm from '@/components/ui-form';
import { styleRuleFor, winningMediaValueFor } from '@tests/unit/utils/emotion-style-rules';
import renderWithI18n from '@tests/unit/utils/render-with-i18n';
import { resetClientStores } from '@tests/utils/reset-client-stores';

type Values = { name: string };

const DEFAULTS: Values = { name: '' };
const NOTICE = 'Password changed';
const ERROR = 'Something went wrong';

const formWith = (
  options: { error?: string | null; submitSpacing?: SubmitSpacing | undefined } = {}
): JSX.Element => (
  <UIForm<Values>
    defaultValues={DEFAULTS}
    onSubmit={jest.fn()}
    submitLabel="Submit"
    submittingLabel="Submitting…"
    title="My Title"
    titleComponent="h1"
    subtitle="My subtitle"
    notice={<p>{NOTICE}</p>}
    error={options.error ?? null}
    submitSpacing={options.submitSpacing}
  >
    <input name="name" aria-label="name" />
  </UIForm>
);

const mountForm = (
  options: { error?: string | null; submitSpacing?: SubmitSpacing | undefined } = {}
): ReturnType<typeof renderWithI18n> => renderWithI18n(formWith(options));

const follows = (first: Element, second: Element): number =>
  first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING;

describe('UIForm slots', () => {
  beforeEach(() => resetClientStores());

  it('renders the notice and then the error banner under the subtitle, above the fields', () => {
    mountForm({ error: ERROR });

    const subtitle = screen.getByText('My subtitle');
    const notice = screen.getByText(NOTICE);
    const alert = screen.getByRole('alert');
    const field = screen.getByRole('textbox', { name: 'name' });
    expect(follows(screen.getByRole('heading', { level: 1 }), subtitle)).toBeTruthy();
    expect(follows(subtitle, notice)).toBeTruthy();
    expect(follows(notice, alert)).toBeTruthy();
    expect(follows(alert, field)).toBeTruthy();
  });

  it('hands focus to the submit when the focused error disappears', async () => {
    const { rerender } = mountForm({ error: ERROR });
    expect(screen.getByRole('alert')).toBeInTheDocument();

    rerender(formWith({ error: null }));

    const submit = screen.getByRole('button', { name: 'Submit' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(submit).toHaveFocus();
    await waitFor(() => expect(submit).toHaveClass('Mui-focusVisible'));
  });

  it.each<SubmitSpacing | undefined>([undefined, 'default'])(
    'keeps the default submit spacing for %s',
    (submitSpacing) => {
      mountForm(submitSpacing === undefined ? {} : { submitSpacing });

      const submit = screen.getByRole('button', { name: 'Submit' });
      expect(styleRuleFor(submit)?.getPropertyValue('margin-top')).toBe('1rem');
      expect(winningMediaValueFor(submit, 'min-width:768px', 'margin-top')).toBe('2.125rem');
    }
  );

  it('tightens the gap above the submit for short forms', () => {
    mountForm({ submitSpacing: 'tight' });

    const submit = screen.getByRole('button', { name: 'Submit' });
    expect(styleRuleFor(submit)?.getPropertyValue('margin-top')).toBe('1.0625rem');
    expect(winningMediaValueFor(submit, 'min-width:768px', 'margin-top')).toBe('1.25rem');
  });
});
