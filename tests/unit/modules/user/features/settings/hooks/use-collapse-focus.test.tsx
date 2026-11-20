import { renderHook } from '@testing-library/react';

import useCollapseFocus from '@/modules/user/features/settings/hooks/use-collapse-focus';

type ProfileSection = Parameters<typeof useCollapseFocus>[0];

const mountInput = (id: string): HTMLInputElement => {
  const input = document.createElement('input');
  input.id = id;
  document.body.append(input);
  return input;
};

interface HookProps {
  readonly section: ProfileSection;
  readonly changed: boolean;
}

const mountHook = (
  section: ProfileSection,
  changed: boolean
): ReturnType<typeof renderHook<void, HookProps>> =>
  renderHook<void, HookProps>((props) => useCollapseFocus(props.section, props.changed), {
    initialProps: { section, changed },
  });

describe('useCollapseFocus', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it.each(['fullName', 'email'] as const)(
    'moves focus to the %s input when the section collapses with focus on the body',
    (section) => {
      const input = mountInput(section);
      const { rerender } = mountHook(section, true);

      rerender({ section, changed: false });

      expect(input).toHaveFocus();
    }
  );

  it('leaves focus alone when the section mounts collapsed', () => {
    const input = mountInput('fullName');

    mountHook('fullName', false);

    expect(input).not.toHaveFocus();
    expect(document.body).toHaveFocus();
  });

  it('leaves focus alone while the section stays open', () => {
    const input = mountInput('fullName');
    const { rerender } = mountHook('fullName', true);

    rerender({ section: 'fullName', changed: true });

    expect(input).not.toHaveFocus();
  });

  it('leaves focus alone when the section opens', () => {
    const input = mountInput('fullName');
    const { rerender } = mountHook('fullName', false);

    rerender({ section: 'fullName', changed: true });

    expect(input).not.toHaveFocus();
  });

  it('leaves focus on the control that already holds it', () => {
    mountInput('fullName');
    const other = mountInput('other');
    const { rerender } = mountHook('fullName', true);
    other.focus();

    rerender({ section: 'fullName', changed: false });

    expect(other).toHaveFocus();
  });

  it('collapses again after reopening, and only once per collapse', () => {
    const input = mountInput('email');
    const focus = jest.spyOn(input, 'focus');
    const { rerender } = mountHook('email', true);

    rerender({ section: 'email', changed: false });
    input.blur();
    rerender({ section: 'email', changed: false });
    expect(focus).toHaveBeenCalledTimes(1);

    rerender({ section: 'email', changed: true });
    rerender({ section: 'email', changed: false });

    expect(focus).toHaveBeenCalledTimes(2);
  });

  it('does nothing when the input is not in the document', () => {
    const { rerender } = mountHook('fullName', true);

    expect(() => rerender({ section: 'fullName', changed: false })).not.toThrow();
    expect(document.body).toHaveFocus();
  });
});
