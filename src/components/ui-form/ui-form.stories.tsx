import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';
import { useFormContext } from 'react-hook-form';

import UIForm from '@/components/ui-form';
import UIFormInputField from '@/components/ui-form-input-field';
import connectivityStateVar from '@/lib/connectivity/connectivity-state-var';

interface DemoValues {
  email: string;
}

const DEFAULT_VALUES: DemoValues = { email: '' };

function EmailField(): JSX.Element {
  const { control } = useFormContext<DemoValues>();

  return (
    <UIFormInputField<DemoValues>
      control={control}
      name="email"
      id="ui-form-email"
      type="email"
      autoComplete="email"
      label="Електронна пошта"
      rules={{ required: 'Вкажіть електронну пошту' }}
    />
  );
}

const meta: Meta<typeof UIForm<DemoValues>> = {
  title: 'Components/Inputs/UIForm',
  component: UIForm<DemoValues>,
  tags: ['autodocs'],
  args: {
    defaultValues: DEFAULT_VALUES,
    title: 'Відновлення доступу',
    titleComponent: 'h2',
    subtitle: 'Вкажіть пошту, і ми надішлемо посилання для входу',
    submitLabel: 'Надіслати',
    submittingLabel: 'Надсилаємо…',
    onSubmit: (): undefined => undefined,
    children: <EmailField />,
  },
  argTypes: {
    children: { control: false },
    defaultValues: { control: false },
    formOptions: { control: false },
    onSubmit: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The shared form shell used by sign-in and sign-up: a heading and subtitle, a ' +
          'focus-on-appear error banner, the always-mounted offline notice, the fields, and ' +
          'the submit button with its MUI native loading state. The `<form>` carries ' +
          '`aria-busy` while submitting and a polite live region announces the submitting copy.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UIForm<DemoValues>>;

export const Default: Story = {};

export const WithError: Story = {
  args: { error: 'Невірна електронна пошта або пароль' },
};

export const Submitting: Story = {
  args: { isSubmitting: true },
};

export const SubmitDisabled: Story = {
  args: { isSubmitDisabled: true },
};

export const Offline: Story = {
  beforeEach: () => {
    connectivityStateVar.setOnline(false);
    return (): void => connectivityStateVar.setOnline(true);
  },
  parameters: {
    docs: {
      description: {
        story:
          'While the browser reports no network the submit is disabled and described by the ' +
          'offline notice under the heading (issue #147).',
      },
    },
  },
};
