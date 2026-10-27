import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { createRef, type JSX } from 'react';
import { useFormContext } from 'react-hook-form';

import UIButton from '@/components/ui-button';
import UIForm from '@/components/ui-form';
import UIFormInputField from '@/components/ui-form-input-field';
import useConnectivityStore from '@/lib/connectivity/use-connectivity-store';

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

export const WithFooter: Story = {
  args: {
    footer: (
      <UIButton type="button" variant="outlined">
        Очистити
      </UIButton>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'A `footer` renders after the submit button inside the form, so a secondary ' +
          '`type="button"` action such as the settings "Очистити" never submits; the page ' +
          'that uses it (settings) lays the two side by side.',
      },
    },
  },
};

export const SubmitSx: Story = {
  args: { submitSx: { '&&': { width: 'auto', paddingInline: '2rem' } } },
  parameters: {
    docs: {
      description: {
        story:
          '`submitSx` overrides the submit button styles, for a page whose design sizes the ' +
          'button differently from the auth card (the settings Save button).',
      },
    },
  },
};

export const SubmitRef: Story = {
  args: { submitRef: createRef<HTMLButtonElement>() },
  parameters: {
    docs: {
      description: {
        story:
          '`submitRef` hands the submit button to the page, which moves focus back to it once a ' +
          'save settles; the button renders exactly as in the default story.',
      },
    },
  },
};

export const SubmitBlocked: Story = {
  args: { submitBlockedReason: 'Спочатку підтвердьте, що зберегли коди' },
  parameters: {
    docs: {
      description: {
        story:
          '`submitBlockedReason` makes the submit `aria-disabled` rather than natively ' +
          'disabled: it keeps its contained style and stays focusable, click, Enter and Space ' +
          'send nothing, and the reason shows under the button in #404142 and describes it. ' +
          'A native disabled state (offline, `isSubmitDisabled`, submitting) wins and hides ' +
          'the reason.',
      },
    },
  },
};

export const Offline: Story = {
  beforeEach: () => {
    useConnectivityStore.setState({ online: false });
    return (): void => useConnectivityStore.setState({ online: true });
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
