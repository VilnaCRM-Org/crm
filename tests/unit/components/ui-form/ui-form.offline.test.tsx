import { act, fireEvent, screen, waitFor } from '@testing-library/react';

import UIForm from '@/components/ui-form';
import connectivityStateVar from '@/lib/connectivity/connectivity-state-var';
import renderWithI18n from '@tests/unit/utils/render-with-i18n';

type Values = { name: string };

const DEFAULTS: Values = { name: '' };
const OFFLINE = 'You are offline. Submitting is unavailable until your connection is restored.';

const mountForm = (onSubmit = jest.fn()): jest.Mock => {
  renderWithI18n(
    <UIForm<Values>
      defaultValues={DEFAULTS}
      onSubmit={onSubmit}
      submitLabel="Submit"
      submittingLabel="Submitting…"
      title="My Title"
      titleComponent="h1"
    >
      <input name="name" aria-label="name" />
    </UIForm>
  );
  return onSubmit;
};

describe('UIForm offline behaviour', () => {
  afterEach(() => {
    act(() => connectivityStateVar.setOnline(true));
  });

  it('keeps the submit enabled and the status region empty while online', () => {
    mountForm();

    expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled();
    screen.getAllByRole('status').forEach((region) => expect(region).toBeEmptyDOMElement());
    expect(screen.queryByText(OFFLINE)).not.toBeInTheDocument();
  });

  it('disables the submit and shows the offline notice inside the form after the heading', () => {
    mountForm();

    act(() => connectivityStateVar.setOnline(false));

    const button = screen.getByRole('button', { name: 'Submit' }) as HTMLButtonElement;
    expect(button).toBeDisabled();
    const notice = screen.getByText(OFFLINE);
    expect(button.form).toContainElement(notice);
    const heading = screen.getByRole('heading', { level: 1, name: 'My Title' });
    expect(heading.compareDocumentPosition(notice)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(notice.compareDocumentPosition(button)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('does not fire the submit handler while offline', async () => {
    const onSubmit = mountForm();
    act(() => connectivityStateVar.setOnline(false));

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await act(async () => Promise.resolve());

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('describes the submit by the notice region so the reason reaches the button', () => {
    mountForm();
    act(() => connectivityStateVar.setOnline(false));

    const button = screen.getByRole('button', { name: 'Submit' });
    const notice = screen.getByText(OFFLINE);
    const region = screen.getAllByRole('status').find((candidate) => candidate.contains(notice));

    expect(button).toHaveAccessibleDescription(OFFLINE);
    expect(region).toHaveAttribute('id');
    expect(button).toHaveAttribute('aria-describedby', region?.id);
  });

  it('parks keyboard focus on the notice when the focused submit becomes disabled', () => {
    mountForm();
    const button = screen.getByRole('button', { name: 'Submit' });
    act(() => button.focus());
    expect(button).toHaveFocus();

    act(() => connectivityStateVar.setOnline(false));

    const notice = screen.getByText(OFFLINE);
    const region = screen.getAllByRole('status').find((candidate) => candidate.contains(notice));
    expect(region).toHaveFocus();
  });

  it('leaves focus alone when the submit did not hold it', () => {
    mountForm();
    const field = screen.getByLabelText('name');
    act(() => field.focus());

    act(() => connectivityStateVar.setOnline(false));

    expect(field).toHaveFocus();
  });

  it('does not move focus when the connection comes back', () => {
    mountForm();
    act(() => connectivityStateVar.setOnline(false));
    const field = screen.getByLabelText('name');
    act(() => field.focus());

    act(() => connectivityStateVar.setOnline(true));

    expect(field).toHaveFocus();
  });

  it('re-enables the submit when the connection comes back', async () => {
    const onSubmit = mountForm();
    act(() => connectivityStateVar.setOnline(false));

    act(() => connectivityStateVar.setOnline(true));

    const button = screen.getByRole('button', { name: 'Submit' });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });
});
