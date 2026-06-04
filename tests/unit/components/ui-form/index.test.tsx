import { fireEvent, render, screen, waitFor } from '@testing-library/react';

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

  it('renders the error banner when error is provided', () => {
    render(
      <UIForm<Values>
        defaultValues={DEFAULTS}
        onSubmit={jest.fn()}
        submitLabel="Submit"
        title="Title"
        error="Boom"
      >
        <span />
      </UIForm>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Boom');
  });

  it('hides title and subtitle when show flags are false', () => {
    render(
      <UIForm<Values>
        defaultValues={DEFAULTS}
        onSubmit={jest.fn()}
        submitLabel="Submit"
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

  it('disables submit when isSubmitting is true and shows a loader', () => {
    render(
      <UIForm<Values>
        defaultValues={DEFAULTS}
        onSubmit={jest.fn()}
        submitLabel="Submit"
        title="Title"
        isSubmitting
      >
        <span />
      </UIForm>
    );

    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('disables submit when isSubmitDisabled is true', () => {
    render(
      <UIForm<Values>
        defaultValues={DEFAULTS}
        onSubmit={jest.fn()}
        submitLabel="Submit"
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
