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

describe('useSettledFocus', () => {
  it('leaves focus alone before any save settled', () => {
    const focus = jest.fn();

    renderHook(() => useSettledFocus(0, buttonRef(focus)));

    expect(focus).not.toHaveBeenCalled();
  });

  it('focuses the save button once per settled save', () => {
    const focus = jest.fn();
    const saveRef = buttonRef(focus);
    const { rerender } = renderHook(({ settled }) => useSettledFocus(settled, saveRef), {
      initialProps: { settled: 0 },
    });

    rerender({ settled: 1 });
    rerender({ settled: 1 });
    rerender({ settled: 2 });

    expect(focus).toHaveBeenCalledTimes(2);
  });

  it('focuses the save button when focus fell to the page body during the save', () => {
    const focus = jest.fn();
    const saveRef = buttonRef(focus);
    const { rerender } = renderHook(({ settled }) => useSettledFocus(settled, saveRef), {
      initialProps: { settled: 0 },
    });

    expect(document.body).toHaveFocus();
    rerender({ settled: 1 });

    expect(focus).toHaveBeenCalledTimes(1);
  });

  it('leaves focus on a control the user moved to while the save was in flight', () => {
    const focus = jest.fn();
    const saveRef = buttonRef(focus);
    const field = document.createElement('input');
    document.body.append(field);
    const { rerender } = renderHook(({ settled }) => useSettledFocus(settled, saveRef), {
      initialProps: { settled: 0 },
    });

    field.focus();
    rerender({ settled: 1 });

    expect(focus).not.toHaveBeenCalled();
    expect(field).toHaveFocus();
    field.remove();
  });

  it('moves focus to Save from a field of the same form, as after Enter', () => {
    const { form, field, save } = saveForm();
    const { rerender } = renderHook(({ settled }) => useSettledFocus(settled, { current: save }), {
      initialProps: { settled: 0 },
    });
    field.focus();

    rerender({ settled: 1 });

    expect(save).toHaveFocus();
    form.remove();
  });

  it('stays on a field of the form while no save has settled', () => {
    const { form, field, save } = saveForm();
    field.focus();

    renderHook(() => useSettledFocus(0, { current: save }));

    expect(field).toHaveFocus();
    form.remove();
  });

  it('does nothing when the save button is not mounted', () => {
    const saveRef = { current: null };
    const { rerender } = renderHook(({ settled }) => useSettledFocus(settled, saveRef), {
      initialProps: { settled: 0 },
    });

    expect(() => rerender({ settled: 1 })).not.toThrow();
  });
});
