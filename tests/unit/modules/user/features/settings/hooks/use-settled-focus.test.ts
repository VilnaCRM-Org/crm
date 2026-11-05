import { renderHook } from '@testing-library/react';

import useSettledFocus from '@/modules/user/features/settings/hooks/use-settled-focus';

const buttonRef = (focus: jest.Mock): { current: HTMLButtonElement } => ({
  current: { focus } as unknown as HTMLButtonElement,
});

const saveForm = (): {
  form: HTMLFormElement;
  field: HTMLInputElement;
  save: HTMLButtonElement;
} => {
  const form = document.createElement('form');
  const field = document.createElement('input');
  const save = document.createElement('button');
  form.append(field, save);
  document.body.append(form);
  return { form, field, save };
};

const NO_HEADING = { current: null };

describe('useSettledFocus', () => {
  it('leaves focus alone before any save settled', () => {
    const focus = jest.fn();

    renderHook(() => useSettledFocus(0, buttonRef(focus), NO_HEADING));

    expect(focus).not.toHaveBeenCalled();
  });

  it('focuses the save button once per settled save', () => {
    const focus = jest.fn();
    const saveRef = buttonRef(focus);
    const { rerender } = renderHook(
      ({ settled }) => useSettledFocus(settled, saveRef, NO_HEADING),
      {
        initialProps: { settled: 0 },
      }
    );

    rerender({ settled: 1 });
    rerender({ settled: 1 });
    rerender({ settled: 2 });

    expect(focus).toHaveBeenCalledTimes(2);
  });

  it('focuses the save button when focus fell to the page body during the save', () => {
    const focus = jest.fn();
    const saveRef = buttonRef(focus);
    const { rerender } = renderHook(
      ({ settled }) => useSettledFocus(settled, saveRef, NO_HEADING),
      {
        initialProps: { settled: 0 },
      }
    );

    expect(document.body).toHaveFocus();
    rerender({ settled: 1 });

    expect(focus).toHaveBeenCalledTimes(1);
  });

  it('leaves focus on a control the user moved to while the save was in flight', () => {
    const focus = jest.fn();
    const saveRef = buttonRef(focus);
    const field = document.createElement('input');
    document.body.append(field);
    const { rerender } = renderHook(
      ({ settled }) => useSettledFocus(settled, saveRef, NO_HEADING),
      {
        initialProps: { settled: 0 },
      }
    );

    field.focus();
    rerender({ settled: 1 });

    expect(focus).not.toHaveBeenCalled();
    expect(field).toHaveFocus();
    field.remove();
  });

  it('moves focus to Save from a field of the same form, as after Enter', () => {
    const { form, field, save } = saveForm();
    const { rerender } = renderHook(
      ({ settled }) => useSettledFocus(settled, { current: save }, NO_HEADING),
      {
        initialProps: { settled: 0 },
      }
    );
    field.focus();

    rerender({ settled: 1 });

    expect(save).toHaveFocus();
    form.remove();
  });

  it('stays on a field of the form while no save has settled', () => {
    const { form, field, save } = saveForm();
    field.focus();

    renderHook(() => useSettledFocus(0, { current: save }, NO_HEADING));

    expect(field).toHaveFocus();
    form.remove();
  });

  it('does nothing when the save button is not mounted', () => {
    const saveRef = { current: null };
    const { rerender } = renderHook(
      ({ settled }) => useSettledFocus(settled, saveRef, NO_HEADING),
      {
        initialProps: { settled: 0 },
      }
    );

    expect(() => rerender({ settled: 1 })).not.toThrow();
  });

  describe('when Save is disabled as the Save settles', () => {
    const offlineForm = (): {
      form: HTMLFormElement;
      field: HTMLInputElement;
      save: HTMLButtonElement;
      heading: HTMLElement;
    } => {
      const parts = saveForm();
      parts.save.disabled = true;
      const heading = document.createElement('h1');
      heading.tabIndex = -1;
      document.body.append(heading);
      return { ...parts, heading };
    };

    it('moves focus from the page body to the heading', () => {
      const { form, save, heading } = offlineForm();

      renderHook(() => useSettledFocus(1, { current: save }, { current: heading }));

      expect(heading).toHaveFocus();
      form.remove();
      heading.remove();
    });

    it('leaves focus on a field the user is still in', () => {
      const { form, field, save, heading } = offlineForm();
      field.focus();

      renderHook(() => useSettledFocus(1, { current: save }, { current: heading }));

      expect(field).toHaveFocus();
      form.remove();
      heading.remove();
    });

    it('does nothing before any save settled', () => {
      const { form, save, heading } = offlineForm();

      renderHook(() => useSettledFocus(0, { current: save }, { current: heading }));

      expect(heading).not.toHaveFocus();
      form.remove();
      heading.remove();
    });

    it('stays on the body without a heading to move to', () => {
      const { form, save, heading } = offlineForm();

      renderHook(() => useSettledFocus(1, { current: save }, NO_HEADING));

      expect(heading).not.toHaveFocus();
      expect(save).not.toHaveFocus();
      form.remove();
      heading.remove();
    });
  });

  it('does not throw when the form is not mounted', () => {
    expect(() => renderHook(() => useSettledFocus(1, { current: null }, NO_HEADING))).not.toThrow();
  });
});
