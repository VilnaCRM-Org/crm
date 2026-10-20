import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ComponentProps, createRef, type JSX } from 'react';

import UIForm from '@/components/ui-form';
import UIFormField from '@/components/ui-form-field';
import render from '@tests/unit/utils/render-with-i18n';

const noop = (): undefined => undefined;

type Extras = Partial<
  Pick<
    ComponentProps<typeof UIForm>,
    'onSubmit' | 'onInvalid' | 'submitRef' | 'submitSx' | 'footer' | 'children'
  >
>;

function Subject({
  onSubmit = noop,
  onInvalid,
  submitRef,
  submitSx,
  footer,
  children = <p>body</p>,
}: Extras): JSX.Element {
  return (
    <UIForm
      onSubmit={onSubmit}
      onInvalid={onInvalid}
      defaultValues={{}}
      title="Title"
      submitLabel="Save it"
      submittingLabel="Saving it"
      submitRef={submitRef}
      submitSx={submitSx}
      footer={footer}
    >
      {children}
    </UIForm>
  );
}

describe('UIForm submit extras', () => {
  it('hands the submit button to an external submitRef', () => {
    const submitRef = createRef<HTMLButtonElement>();

    render(<Subject submitRef={submitRef} />);

    expect(submitRef.current).toBe(screen.getByRole('button', { name: 'Save it' }));
  });

  it('merges submitSx after the base submit styles', () => {
    render(<Subject submitSx={{ width: '16.875rem' }} />);

    expect(screen.getByRole('button', { name: 'Save it' })).toHaveStyle({ width: '16.875rem' });
  });

  it('renders the footer inside the form after the submit control', () => {
    render(<Subject footer={<button type="button">Clear</button>} />);

    const submit = screen.getByRole('button', { name: 'Save it' });
    const clear = screen.getByRole('button', { name: 'Clear' });

    expect(document.forms[0]).toContainElement(clear);
    expect(submit.compareDocumentPosition(clear)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('never submits the form from a type=button footer control', async () => {
    const onSubmit = jest.fn();
    render(<Subject onSubmit={onSubmit} footer={<button type="button">Clear</button>} />);

    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));

    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled());
  });

  it('renders no footer element and keeps the default submit styles when none is given', () => {
    render(<Subject />);

    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('calls onInvalid, and not onSubmit, when a Save is blocked by a field rule', async () => {
    const onSubmit = jest.fn();
    const onInvalid = jest.fn();
    render(
      <Subject onSubmit={onSubmit} onInvalid={onInvalid}>
        <UIFormField
          name="name"
          label="Name"
          placeholder=""
          type="text"
          autoComplete="off"
          rules={{ required: 'Required' }}
        />
      </Subject>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Save it' }));

    await waitFor(() => expect(onInvalid).toHaveBeenCalledTimes(1));
    expect(onInvalid.mock.calls[0]?.[0]).toEqual({
      name: expect.objectContaining({ type: 'required', message: 'Required' }),
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit, and not onInvalid, when every field passes', async () => {
    const onSubmit = jest.fn();
    const onInvalid = jest.fn();
    render(<Subject onSubmit={onSubmit} onInvalid={onInvalid} />);

    await userEvent.click(screen.getByRole('button', { name: 'Save it' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onInvalid).not.toHaveBeenCalled();
  });
});
