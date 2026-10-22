import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX, ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { I18nextProvider } from 'react-i18next';

import ClearButton from '@/modules/user/features/settings/components/profile-form/clear-button';
import type { ProfileFormValues } from '@/modules/user/features/settings/types/user-profile';
import { buildProfileFormValues } from '@tests/builders';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import { doubledClass, styleRuleFor } from '@tests/unit/utils/emotion-style-rules';

const NAME = 'Ім’я';

const defaults: ProfileFormValues = buildProfileFormValues({
  fullName: 'Олена Петренко',
  newPassword: '',
});

interface HarnessProps {
  readonly busy: boolean;
  readonly onClear: () => void;
}

function Harness({ busy, onClear }: HarnessProps): JSX.Element {
  const methods = useForm<ProfileFormValues>({ defaultValues: defaults });
  const { ref, name, onChange, onBlur } = methods.register('fullName');
  return (
    <FormProvider {...methods}>
      <input aria-label={NAME} ref={ref} name={name} onChange={onChange} onBlur={onBlur} />
      <ClearButton defaults={defaults} busy={busy} onClear={onClear} />
    </FormProvider>
  );
}

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('uk', ['en'])}>{children}</I18nextProvider>
);

const clear = (): HTMLElement => screen.getByRole('button', { name: 'Очистити' });

const name = (): HTMLElement => screen.getByRole('textbox', { name: NAME });

describe('ClearButton', () => {
  it('restores the defaults and reports the clear once', async () => {
    const onClear = jest.fn();
    render(<Harness busy={false} onClear={onClear} />, { wrapper });
    await userEvent.type(name(), ' Іванівна');

    await userEvent.click(clear());

    expect(name()).toHaveValue('Олена Петренко');
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(clear()).toHaveAttribute('type', 'button');
    expect(clear()).not.toHaveAttribute('aria-disabled');
  });

  it('stays focusable but aria-disabled and inert while busy', async () => {
    const onClear = jest.fn();
    render(<Harness busy onClear={onClear} />, { wrapper });
    await userEvent.type(name(), ' Іванівна');

    await userEvent.click(clear());

    expect(clear()).toHaveAttribute('aria-disabled', 'true');
    expect(clear()).toBeEnabled();
    expect(clear()).toHaveFocus();
    expect(name()).toHaveValue('Олена Петренко Іванівна');
    expect(onClear).not.toHaveBeenCalled();
  });

  it('acts on the busy flag of the latest render', async () => {
    const onClear = jest.fn();
    const view = render(<Harness busy onClear={onClear} />, { wrapper });

    view.rerender(<Harness busy={false} onClear={onClear} />);
    await userEvent.click(clear());

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('draws the focus ring and the busy look', () => {
    render(<Harness busy onClear={jest.fn()} />, { wrapper });

    const ring = styleRuleFor(clear(), doubledClass(clear(), ':focus-visible'));
    const busy = styleRuleFor(clear(), doubledClass(clear(), '[aria-disabled="true"]'));
    const busyHover = styleRuleFor(clear(), doubledClass(clear(), '[aria-disabled="true"]:hover'));

    expect(ring?.getPropertyValue('outline')).toBe('2px solid #1A1C1E');
    expect(ring?.getPropertyValue('outline-offset')).toBe('2px');
    expect(busy?.getPropertyValue('opacity')).toBe('0.6');
    expect(busy?.getPropertyValue('cursor')).toBe('default');
    expect(busyHover?.getPropertyValue('background-color')).toBe('#FFFFFF');
  });
});
