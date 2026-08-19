import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import UIForm from '@/components/ui-form';

type Values = { name: string };

const DEFAULTS: Values = { name: '' };
const ERROR_TEXT = 'Request failed';

function renderForm(error?: string | null): void {
  render(
    <UIForm<Values>
      defaultValues={DEFAULTS}
      onSubmit={jest.fn()}
      submitLabel="Submit"
      submittingLabel="Submitting…"
      title="Title"
      error={error}
    >
      <span />
    </UIForm>
  );
}

function getErrorBanner(text: string): HTMLElement {
  const banner = screen.getAllByRole('generic').find((element) => element.textContent === text);
  if (!banner) {
    throw new Error(`No focusable error banner wrapping exactly "${text}" was rendered`);
  }
  return banner;
}

describe('UIForm error banner', () => {
  it('renders no alert region and steals no focus while the form is error-free', () => {
    renderForm();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(document.body).toHaveFocus();
  });

  it('treats an empty error string as no error at all', () => {
    renderForm('');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(document.body).toHaveFocus();
  });

  it('renders the error in the alert colour with the spacing the design pins', () => {
    renderForm(ERROR_TEXT);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(ERROR_TEXT);
    expect(alert).toHaveStyle({ color: 'rgb(255, 0, 0)', marginBottom: '1rem' });
  });

  it('moves focus to the banner without inserting it into the tab order', () => {
    renderForm(ERROR_TEXT);

    const banner = getErrorBanner(ERROR_TEXT);
    expect(banner).toHaveFocus();
    expect(banner).toHaveAttribute('tabindex', '-1');
    expect(banner).toContainElement(screen.getByRole('alert'));
  });
});
