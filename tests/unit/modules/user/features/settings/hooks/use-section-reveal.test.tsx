import { act, renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';

import useSectionReveal from '@/modules/user/features/settings/hooks/use-section-reveal';
import type { ProfileFormValues } from '@/modules/user/features/settings/types/user-profile';
import ProfileChangeDetector from '@/modules/user/features/settings/utils/profile-change-detector';
import {
  buildEmail,
  buildFullName,
  buildProfileFormValues,
  buildUserEntity,
} from '@tests/builders';

const user = buildUserEntity({ fullName: 'Олена Петренко', email: 'olena@example.com' });
const OTHER_NAME = buildFullName();
const OTHER_EMAIL = buildEmail();

type RevealedProfileSection = Parameters<typeof useSectionReveal>[0]['section'];

interface Mounted {
  readonly onChange: jest.Mock;
  readonly form: () => UseFormReturn<ProfileFormValues>;
  readonly result: { readonly current: boolean };
}

const mount = (section: RevealedProfileSection): Mounted => {
  const onChange = jest.fn();
  const changes = new ProfileChangeDetector();
  let methods: UseFormReturn<ProfileFormValues> | null = null;
  const Wrapper = ({ children }: { children: ReactNode }): JSX.Element => {
    const form = useForm<ProfileFormValues>({
      defaultValues: buildProfileFormValues({ fullName: user.fullName, email: user.email }),
    });
    methods = form;
    return <FormProvider {...form}>{children}</FormProvider>;
  };
  const { result } = renderHook(() => useSectionReveal({ section, user, changes, onChange }), {
    wrapper: Wrapper,
  });
  return {
    onChange,
    result,
    form: () => methods as unknown as UseFormReturn<ProfileFormValues>,
  };
};

describe('useSectionReveal', () => {
  it.each(['fullName', 'email'] as const)('reports the clean %s section once', (section) => {
    const { result, onChange } = mount(section);

    expect(result.current).toBe(false);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('reveals the name section once its value differs and collapses when it is restored', () => {
    const { result, onChange, form } = mount('fullName');

    act(() => form().setValue('fullName', OTHER_NAME));

    expect(result.current).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith(true);

    act(() => form().setValue('fullName', user.fullName));

    expect(result.current).toBe(false);
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('reveals the e-mail section once its value differs', () => {
    const { result, onChange, form } = mount('email');

    act(() => form().setValue('email', OTHER_EMAIL));

    expect(result.current).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith(true);
  });

  it('treats the surrounding spaces of a name as no change', () => {
    const { result, form } = mount('fullName');

    act(() => form().setValue('fullName', `  ${user.fullName} `));

    expect(result.current).toBe(false);
  });

  it('treats the letter case of an e-mail as no change', () => {
    const { result, form } = mount('email');

    act(() => form().setValue('email', user.email.toUpperCase()));

    expect(result.current).toBe(false);
  });

  it('reads the e-mail section from the e-mail field, not the name field', () => {
    const { result, form } = mount('email');

    act(() => form().setValue('fullName', OTHER_NAME));

    expect(result.current).toBe(false);
  });

  it('reads the name section from the name field, not the e-mail field', () => {
    const { result, form } = mount('fullName');

    act(() => form().setValue('email', OTHER_EMAIL));

    expect(result.current).toBe(false);
  });

  it('reports no repeat while the answer stays the same', () => {
    const { onChange, form } = mount('fullName');

    act(() => form().setValue('fullName', OTHER_NAME));
    act(() => form().setValue('fullName', `${OTHER_NAME} Іванівна`));

    expect(onChange.mock.calls).toEqual([[false], [true]]);
  });
});
