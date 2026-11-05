import { act, screen } from '@testing-library/react';
import { createRef, type JSX } from 'react';

import type { UIFormProps } from '@/components/types/ui-form';
import UIForm from '@/components/ui-form';
import useConnectivityStore from '@/lib/connectivity/use-connectivity-store';
import renderWithI18n from '@tests/unit/utils/render-with-i18n';
import { resetClientStores } from '@tests/utils/reset-client-stores';

type Values = { name: string };

const DEFAULTS: Values = { name: '' };
const OFFLINE = 'You are offline. Submitting is unavailable until your connection is restored.';

const form = (offlineNotice: NonNullable<UIFormProps<Values>['offlineNotice']>): JSX.Element => (
  <UIForm<Values>
    defaultValues={DEFAULTS}
    onSubmit={jest.fn()}
    submitLabel="Submit"
    submittingLabel="Submitting…"
    title="My Title"
    titleComponent="h1"
    offlineNotice={offlineNotice}
  >
    <input name="name" aria-label="name" />
  </UIForm>
);

const defaultForm = (): JSX.Element => (
  <UIForm<Values>
    defaultValues={DEFAULTS}
    onSubmit={jest.fn()}
    submitLabel="Submit"
    submittingLabel="Submitting…"
    title="My Title"
    titleComponent="h1"
  >
    <input name="name" aria-label="name" />
  </UIForm>
);

const goOffline = (): void => {
  act(() => useConnectivityStore.setState({ online: false }));
};

const noticeHolder = (): HTMLElement => {
  const text = screen.getByText(OFFLINE);
  const holder = [...screen.getAllByRole('status'), ...screen.getAllByRole('generic')].find(
    (node) => node.getAttribute('tabindex') === '-1' && node.contains(text)
  );
  if (holder === undefined) throw new Error('no offline notice');
  return holder;
};

describe('UIForm offlineNotice', () => {
  beforeEach(() => resetClientStores());

  it.each([
    ['the default', defaultForm],
    ['live', (): JSX.Element => form('live')],
  ])('%s keeps a live region after the heading and before the fields', (_name, tree) => {
    renderWithI18n(tree());

    goOffline();

    const holder = noticeHolder();
    expect(holder).toHaveAttribute('role', 'status');
    expect(holder).toHaveAttribute('aria-atomic', 'true');
    const heading = screen.getByRole('heading', { level: 1, name: 'My Title' });
    expect(heading.compareDocumentPosition(holder)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(holder.compareDocumentPosition(screen.getByLabelText('name'))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it('live keeps an empty region mounted while online', () => {
    renderWithI18n(form('live'));

    const regions = screen.getAllByRole('status');

    expect(regions).toHaveLength(2);
    regions.forEach((region) => expect(region).toBeEmptyDOMElement());
  });

  it('inline renders the notice just before the submit and outside any live region', () => {
    renderWithI18n(form('inline'));

    goOffline();

    const holder = noticeHolder();
    const button = screen.getByRole('button', { name: 'Submit' });
    expect(holder).not.toHaveAttribute('role');
    expect(holder).not.toHaveAttribute('aria-atomic');
    expect(holder.compareDocumentPosition(button)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getByLabelText('name').compareDocumentPosition(holder)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it('inline describes the submit by the notice', () => {
    renderWithI18n(form('inline'));

    goOffline();

    const holder = noticeHolder();
    const button = screen.getByRole('button', { name: 'Submit' });
    expect(holder).toHaveAttribute('id');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-describedby', holder.id);
    expect(button).toHaveAccessibleDescription(OFFLINE);
  });

  it('inline parks keyboard focus on the notice when the focused submit becomes disabled', () => {
    renderWithI18n(form('inline'));
    const button = screen.getByRole('button', { name: 'Submit' });
    act(() => button.focus());

    goOffline();

    expect(noticeHolder()).toHaveFocus();
  });

  it('inline leaves only the submitting status as a live region while online', () => {
    renderWithI18n(form('inline'));

    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('none renders no notice, online or offline, and still disables the submit', () => {
    renderWithI18n(form('none'));
    const button = screen.getByRole('button', { name: 'Submit' });

    expect(screen.getAllByRole('status')).toHaveLength(1);
    goOffline();

    expect(screen.queryByText(OFFLINE)).not.toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('none survives the focused submit becoming disabled with nowhere to park focus', () => {
    const submitRef = createRef<HTMLButtonElement>();
    renderWithI18n(
      <UIForm<Values>
        defaultValues={DEFAULTS}
        onSubmit={jest.fn()}
        submitRef={submitRef}
        submitLabel="Submit"
        submittingLabel="Submitting…"
        title={null}
        offlineNotice="none"
      >
        <input name="name" aria-label="name" />
      </UIForm>
    );
    act(() => submitRef.current?.focus());

    expect(() => goOffline()).not.toThrow();
    expect(submitRef.current).toBeDisabled();
  });
});
