import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import UIForm from '@/components/ui-form';

type Values = { name: string };

const DEFAULTS: Values = { name: '' };

describe('UIForm', () => {
  it('renders title, subtitle, and triggers submit', async () => {
    const onSubmit = jest.fn();
    render(
      <UIForm<Values>
        defaultValues={DEFAULTS}
        onSubmit={onSubmit}
        submitLabel="Submit"
        submittingLabel="Submitting…"
        title="My Title"
        subtitle="My Subtitle"
      >
        <input name="name" data-testid="name-input" defaultValue="Alice" />
      </UIForm>
    );

    expect(screen.getByText('My Title')).toBeInTheDocument();
    expect(screen.getByText('My Subtitle')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();

    fireEvent.submit(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });

  it('renders the error alert assertively with no redundant aria-live', () => {
    render(
      <UIForm<Values>
        defaultValues={DEFAULTS}
        onSubmit={jest.fn()}
        submitLabel="Submit"
        submittingLabel="Submitting…"
        title="Title"
        error="Boom"
      >
        <span />
      </UIForm>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Boom');
    expect(alert).not.toHaveAttribute('aria-live');
  });

  it('exposes aria-busy on the form mirroring the submitting state', () => {
    const { rerender } = render(
      <UIForm<Values>
        defaultValues={DEFAULTS}
        onSubmit={jest.fn()}
        submitLabel="Submit"
        submittingLabel="Submitting…"
        title="Title"
        isSubmitting={false}
      >
        <span />
      </UIForm>
    );

    const idleButton = screen.getByRole('button', { name: 'Submit' }) as HTMLButtonElement;
    expect(idleButton.form).toHaveAttribute('aria-busy', 'false');

    rerender(
      <UIForm<Values>
        defaultValues={DEFAULTS}
        onSubmit={jest.fn()}
        submitLabel="Submit"
        submittingLabel="Submitting…"
        title="Title"
        isSubmitting
      >
        <span />
      </UIForm>
    );

    const busyButton = screen.getByRole('button', { name: 'Submit' }) as HTMLButtonElement;
    expect(busyButton.form).toHaveAttribute('aria-busy', 'true');
  });

  it('keeps the busy and error regions distinct: one assertive alert, empty polite status', () => {
    render(
      <UIForm<Values>
        defaultValues={DEFAULTS}
        onSubmit={jest.fn()}
        submitLabel="Submit"
        submittingLabel="Submitting…"
        title="Title"
        error="Boom"
        isSubmitting={false}
      >
        <span />
      </UIForm>
    );

    expect(screen.getAllByRole('alert')).toHaveLength(1);
    const status = screen.getByRole('status');
    expect(status).toBeEmptyDOMElement();
    expect(status).not.toHaveAttribute('role', 'alert');
  });

  it('hides title and subtitle when show flags are false', () => {
    render(
      <UIForm<Values>
        defaultValues={DEFAULTS}
        onSubmit={jest.fn()}
        submitLabel="Submit"
        submittingLabel="Submitting…"
        title="Hidden"
        subtitle="HiddenSub"
        showTitle={false}
        showSubtitle={false}
      >
        <span />
      </UIForm>
    );

    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
    expect(screen.queryByText('HiddenSub')).not.toBeInTheDocument();
  });

  it('shows a single in-button spinner and keeps the stable name while submitting', () => {
    render(
      <UIForm<Values>
        defaultValues={DEFAULTS}
        onSubmit={jest.fn()}
        submitLabel="Submit"
        submittingLabel="Submitting…"
        title="Title"
        isSubmitting
      >
        <span />
      </UIForm>
    );

    const button = screen.getByRole('button', { name: 'Submit' });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('MuiButton-loading');
    expect(within(button).getAllByRole('progressbar', { hidden: true })).toHaveLength(1);
    expect(screen.getAllByRole('progressbar', { hidden: true })).toHaveLength(1);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('announces the submitting label through one polite live region while submitting', () => {
    render(
      <UIForm<Values>
        defaultValues={DEFAULTS}
        onSubmit={jest.fn()}
        submitLabel="Submit"
        submittingLabel="Submitting…"
        title="Title"
        isSubmitting
      >
        <span />
      </UIForm>
    );

    const regions = screen.getAllByRole('status');
    expect(regions).toHaveLength(1);
    expect(regions[0]).toHaveTextContent('Submitting…');
  });

  it('keeps the live region empty and the button interactive when idle', () => {
    render(
      <UIForm<Values>
        defaultValues={DEFAULTS}
        onSubmit={jest.fn()}
        submitLabel="Submit"
        submittingLabel="Submitting…"
        title="Title"
      >
        <span />
      </UIForm>
    );

    expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(screen.queryByRole('progressbar', { hidden: true })).not.toBeInTheDocument();
  });

  it('disables submit when isSubmitDisabled is true', () => {
    render(
      <UIForm<Values>
        defaultValues={DEFAULTS}
        onSubmit={jest.fn()}
        submitLabel="Submit"
        submittingLabel="Submitting…"
        title="Title"
        isSubmitDisabled
      >
        <span />
      </UIForm>
    );

    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  it('invokes onSubmit when resetOnSuccess is true', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(
      <UIForm<Values>
        defaultValues={DEFAULTS}
        onSubmit={onSubmit}
        submitLabel="Submit"
        submittingLabel="Submitting…"
        title="Title"
        resetOnSuccess
      >
        <span />
      </UIForm>
    );

    fireEvent.submit(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });
});
