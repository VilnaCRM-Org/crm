import { renderHook } from '@testing-library/react';

import useSettledFocus from '@/modules/user/features/settings/hooks/use-settled-focus';

type SettledFocusOptions = Parameters<typeof useSettledFocus>[0];
type ProfileFormState = SettledFocusOptions['state'];
type ProfileSection = SettledFocusOptions['section'];

interface Mounted {
  readonly form: HTMLFormElement;
  readonly input: HTMLInputElement;
  readonly other: HTMLInputElement;
  readonly save: HTMLButtonElement;
  readonly outside: HTMLButtonElement;
}

const mountForm = (section: ProfileSection): Mounted => {
  const form = document.createElement('form');
  const input = document.createElement('input');
  input.id = section;
  const other = document.createElement('input');
  const save = document.createElement('button');
  const outside = document.createElement('button');
  form.append(input, other, save);
  document.body.append(form, outside);
  return { form, input, other, save, outside };
};

const stateOf = (settled: number, lastSettleSaved = false): ProfileFormState => ({
  fieldErrors: { items: [] },
  noChanges: false,
  noChangesMarked: false,
  settled,
  saved: 0,
  lastSettleSaved,
  cleared: 0,
  attempts: 0,
});

const optionsOf = (
  section: ProfileSection,
  button: HTMLButtonElement | null,
  heading: HTMLElement | null = null
): Omit<SettledFocusOptions, 'state'> => ({
  section,
  buttonRef: { current: button },
  saveRef: { current: null },
  headingRef: { current: heading },
});

describe('useSettledFocus', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('leaves focus and the save ref alone before any save settled', () => {
    const { save, other } = mountForm('fullName');
    const options = optionsOf('fullName', save);
    other.focus();

    renderHook(() => useSettledFocus({ ...options, state: stateOf(0, true) }));

    expect(other).toHaveFocus();
    expect(options.saveRef.current).toBeNull();
  });

  it('focuses Save once per settled save', () => {
    const { save } = mountForm('password');
    const focus = jest.spyOn(save, 'focus');
    const options = optionsOf('password', save);
    const { rerender } = renderHook(
      ({ settled }) => useSettledFocus({ ...options, state: stateOf(settled) }),
      { initialProps: { settled: 0 } }
    );

    rerender({ settled: 1 });
    rerender({ settled: 1 });
    rerender({ settled: 2 });

    expect(focus).toHaveBeenCalledTimes(2);
  });

  it.each(['fullName', 'email'] as const)(
    'moves focus to the %s input after a successful save, because its Save hid',
    (section) => {
      const { save, input } = mountForm(section);
      const options = optionsOf(section, save);

      renderHook(() => useSettledFocus({ ...options, state: stateOf(1, true) }));

      expect(input).toHaveFocus();
      expect(options.saveRef.current).toBe(input);
    }
  );

  it.each(['fullName', 'email'] as const)(
    'keeps the %s Save focused and in the save ref after a failed save',
    (section) => {
      const { save } = mountForm(section);
      const options = optionsOf(section, save);

      renderHook(() => useSettledFocus({ ...options, state: stateOf(1, false) }));

      expect(save).toHaveFocus();
      expect(options.saveRef.current).toBe(save);
    }
  );

  it('keeps the password Save focused after a successful save, because it never hides', () => {
    const { save } = mountForm('password');
    const options = optionsOf('password', save);

    renderHook(() => useSettledFocus({ ...options, state: stateOf(1, true) }));

    expect(save).toHaveFocus();
    expect(options.saveRef.current).toBe(save);
  });

  it('moves focus to Save from a field of the same form, as after Enter', () => {
    const { save, other } = mountForm('fullName');
    const options = optionsOf('fullName', save);
    other.focus();

    renderHook(() => useSettledFocus({ ...options, state: stateOf(1) }));

    expect(save).toHaveFocus();
  });

  it('leaves focus on a control outside the form but still records the target', () => {
    const { save, input, outside } = mountForm('email');
    const options = optionsOf('email', save);
    outside.focus();

    renderHook(() => useSettledFocus({ ...options, state: stateOf(1, true) }));

    expect(outside).toHaveFocus();
    expect(options.saveRef.current).toBe(input);
  });

  it('leaves focus on the page body and clears the ref when the Save is not mounted', () => {
    const options = optionsOf('password', null);

    renderHook(() => useSettledFocus({ ...options, state: stateOf(1) }));

    expect(document.body).toHaveFocus();
    expect(options.saveRef.current).toBeNull();
  });

  it('leaves focus on a focused control when the Save is not mounted', () => {
    const { outside } = mountForm('password');
    const options = optionsOf('password', null);
    outside.focus();

    renderHook(() => useSettledFocus({ ...options, state: stateOf(1) }));

    expect(outside).toHaveFocus();
  });

  it('leaves focus on a control when the Save belongs to no form', () => {
    const { outside } = mountForm('password');
    const detached = document.createElement('button');
    const focus = jest.spyOn(detached, 'focus');
    const options = optionsOf('password', detached);
    outside.focus();

    renderHook(() => useSettledFocus({ ...options, state: stateOf(1) }));

    expect(outside).toHaveFocus();
    expect(focus).not.toHaveBeenCalled();
  });

  it('records no target when the saved input is gone', () => {
    const { save, input } = mountForm('fullName');
    input.remove();
    const options = optionsOf('fullName', save);

    renderHook(() => useSettledFocus({ ...options, state: stateOf(1, true) }));

    expect(document.body).toHaveFocus();
    expect(options.saveRef.current).toBeNull();
  });

  describe('when Save is disabled as the save settles', () => {
    const offlineForm = (): Mounted & { readonly heading: HTMLElement } => {
      const parts = mountForm('fullName');
      parts.save.disabled = true;
      const heading = document.createElement('h1');
      heading.tabIndex = -1;
      document.body.append(heading);
      return { ...parts, heading };
    };

    it('moves focus from the page body to the heading', () => {
      const { save, heading } = offlineForm();
      const options = optionsOf('fullName', save, heading);

      renderHook(() => useSettledFocus({ ...options, state: stateOf(1) }));

      expect(heading).toHaveFocus();
      expect(options.saveRef.current).toBe(save);
    });

    it('leaves focus on a field the user is still in', () => {
      const { save, other, heading } = offlineForm();
      const options = optionsOf('fullName', save, heading);
      other.focus();

      renderHook(() => useSettledFocus({ ...options, state: stateOf(1) }));

      expect(other).toHaveFocus();
    });

    it('does nothing before any save settled', () => {
      const { save, heading } = offlineForm();
      const options = optionsOf('fullName', save, heading);

      renderHook(() => useSettledFocus({ ...options, state: stateOf(0) }));

      expect(heading).not.toHaveFocus();
    });

    it('stays on the body without a heading to move to', () => {
      const { save } = offlineForm();
      const options = optionsOf('fullName', save);

      renderHook(() => useSettledFocus({ ...options, state: stateOf(1) }));

      expect(document.body).toHaveFocus();
    });

    it('still prefers the text input after a successful save, which is never disabled', () => {
      const { save, input, heading } = offlineForm();
      const options = optionsOf('fullName', save, heading);

      renderHook(() => useSettledFocus({ ...options, state: stateOf(1, true) }));

      expect(input).toHaveFocus();
      expect(heading).not.toHaveFocus();
    });
  });
});
