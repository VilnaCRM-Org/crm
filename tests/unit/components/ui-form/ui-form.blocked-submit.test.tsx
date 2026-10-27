import '@testing-library/jest-dom';
import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';

import UIForm from '@/components/ui-form';
import useConnectivityStore from '@/lib/connectivity/use-connectivity-store';
import renderWithI18n from '@tests/unit/utils/render-with-i18n';
import { assertInstanceOf } from '@tests/utils/assert-result';
import { resetClientStores } from '@tests/utils/reset-client-stores';

interface Values {
  name: string;
}

const REASON = 'Спочатку підтвердьте, що зберегли коди';
const OFFLINE = 'You are offline. Submitting is unavailable until your connection is restored.';

interface SubjectProps {
  readonly onSubmit: jest.Mock;
  readonly reason?: string | undefined;
  readonly disabled?: boolean | undefined;
}

function Subject({ onSubmit, reason, disabled }: SubjectProps): JSX.Element {
  return (
    <UIForm<Values>
      defaultValues={{ name: '' }}
      onSubmit={onSubmit}
      submitLabel="Готово"
      submittingLabel="Надсилаємо"
      title="Резервні коди"
      titleComponent="h3"
      submitBlockedReason={reason}
      isSubmitDisabled={disabled ?? false}
      footer={<button type="button">Скасувати</button>}
    >
      <input name="name" aria-label="name" />
    </UIForm>
  );
}

const mount = (reason?: string, disabled?: boolean): jest.Mock => {
  const onSubmit = jest.fn();
  renderWithI18n(<Subject onSubmit={onSubmit} reason={reason} disabled={disabled} />);
  return onSubmit;
};

const submit = (): HTMLButtonElement => {
  const button = screen.getByRole('button', { name: 'Готово' });
  assertInstanceOf(button, HTMLButtonElement);
  return button;
};

describe('UIForm submitBlockedReason', () => {
  beforeEach(() => resetClientStores());

  describe('without the prop', () => {
    it('renders the submit exactly as before', () => {
      mount();

      expect(submit()).toBeEnabled();
      expect(submit()).not.toHaveAttribute('aria-disabled');
      expect(screen.queryByText(REASON)).not.toBeInTheDocument();
    });

    it('describes the submit by the offline notice alone', () => {
      mount();

      const notice = screen.getAllByRole('status')[0];

      expect(submit()).toHaveAttribute('aria-describedby', notice?.id);
    });

    it('treats an empty reason as no reason', () => {
      mount('');

      expect(submit()).not.toHaveAttribute('aria-disabled');
    });

    it('still submits', async () => {
      const onSubmit = mount();

      await userEvent.click(submit());

      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('with a reason', () => {
    it('marks the submit aria-disabled, not disabled, and keeps it focusable', async () => {
      mount(REASON);

      expect(submit()).toHaveAttribute('aria-disabled', 'true');
      expect(submit()).toBeEnabled();
      await userEvent.click(submit());
      expect(submit()).toHaveFocus();
    });

    it('keeps the contained style rather than the disabled one', () => {
      mount(REASON);

      expect(submit()).toHaveClass('MuiButton-contained');
      expect(submit()).not.toHaveClass('Mui-disabled');
    });

    it('shows the reason in #404142 after the submit and before the footer', () => {
      mount(REASON);

      const reason = screen.getByText(REASON);
      const cancel = screen.getByRole('button', { name: 'Скасувати' });

      expect(reason).toHaveStyle({ color: '#404142' });
      expect(submit().compareDocumentPosition(reason)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(reason.compareDocumentPosition(cancel)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(submit().form).toContainElement(reason);
    });

    it('appends the reason id to aria-describedby beside the offline notice id', () => {
      mount(REASON);

      const notice = screen.getAllByRole('status')[0];
      const reason = screen.getByText(REASON);

      expect(reason.id).not.toBe('');
      expect(submit()).toHaveAttribute('aria-describedby', `${notice?.id} ${reason.id}`);
      expect(submit()).toHaveAccessibleDescription(expect.stringContaining(REASON));
    });

    it('never calls onSubmit on click, Enter or Space', async () => {
      const onSubmit = mount(REASON);

      await userEvent.click(submit());
      act(() => submit().focus());
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');
      await userEvent.type(screen.getByLabelText('name'), '{Enter}');

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('does not submit the form element either', () => {
      const onSubmit = mount(REASON);

      const { form } = submit();
      assertInstanceOf(form, HTMLFormElement);

      fireEvent.submit(form);

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits again once the reason goes away', async () => {
      const onSubmit = jest.fn();
      const { rerender } = renderWithI18n(<Subject onSubmit={onSubmit} reason={REASON} />);
      await userEvent.click(submit());
      expect(onSubmit).not.toHaveBeenCalled();

      rerender(<Subject onSubmit={onSubmit} />);
      await userEvent.click(submit());

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(submit()).not.toHaveAttribute('aria-disabled');
      expect(screen.queryByText(REASON)).not.toBeInTheDocument();
      const notice = screen.getAllByRole('status')[0];
      expect(submit()).toHaveAttribute('aria-describedby', notice?.id);
    });
  });

  describe('against a native disabled state', () => {
    it('lets offline win: native disabled, no aria-disabled, no reason', () => {
      mount(REASON);

      act(() => useConnectivityStore.setState({ online: false }));

      expect(submit()).toBeDisabled();
      expect(submit()).not.toHaveAttribute('aria-disabled');
      expect(screen.queryByText(REASON)).not.toBeInTheDocument();
      expect(submit()).toHaveAccessibleDescription(OFFLINE);
    });

    it('lets isSubmitDisabled win', () => {
      mount(REASON, true);

      expect(submit()).toBeDisabled();
      expect(submit()).not.toHaveAttribute('aria-disabled');
      expect(screen.queryByText(REASON)).not.toBeInTheDocument();
    });
  });
});
