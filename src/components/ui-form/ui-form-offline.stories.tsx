import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';
import { useFormContext } from 'react-hook-form';

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
      id="ui-form-offline-email"
      type="email"
      autoComplete="email"
      label="Електронна пошта"
      rules={{ required: 'Вкажіть електронну пошту' }}
    />
  );
}

const goOfflineForStory = (): (() => void) => {
  useConnectivityStore.setState({ online: false });
  return (): void => useConnectivityStore.setState({ online: true });
};

const meta: Meta<typeof UIForm<DemoValues>> = {
  title: 'Components/Inputs/UIForm/Offline',
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
    onSubmit: { control: false },
    offlineNotice: { control: 'inline-radio', options: ['live', 'inline', 'none'] },
  },
  beforeEach: goOfflineForStory,
  parameters: {
    docs: {
      description: {
        component:
          'UIForm while the browser reports no network: how each `offlineNotice` mode tells ' +
          'the user, and how the submit and the error banner action stay unavailable.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UIForm<DemoValues>>;

export const Offline: Story = {
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

export const OfflineNoticeInline: Story = {
  args: { offlineNotice: 'inline' },
  parameters: {
    docs: {
      description: {
        story:
          '`offlineNotice: "inline"` renders the offline notice as plain text just before the ' +
          'submit, outside any live region, for a form that already announces its own status. ' +
          'The submit is disabled and described by the notice; a focused submit parks focus on ' +
          'the notice.',
      },
    },
  },
};

export const OfflineNoticeNone: Story = {
  args: { offlineNotice: 'none' },
  parameters: {
    docs: {
      description: {
        story:
          '`offlineNotice: "none"` renders no notice at all, for a form whose page shows the ' +
          'connection state elsewhere. Offline, the submit stays focusable and is ' +
          '`aria-disabled` instead of natively disabled, so a focused submit keeps focus; it ' +
          'sends nothing and points `aria-describedby` at no notice.',
      },
    },
  },
};

export const ErrorActionOffline: Story = {
  args: {
    error: 'Не вдалося надіслати запит. Перевірте з’єднання та спробуйте ще раз.',
    errorAction: { label: 'Спробувати ще раз', onClick: (): undefined => undefined },
  },
  parameters: {
    docs: {
      description: {
        story:
          'While offline the banner action is `aria-disabled`, ignores clicks, and is described ' +
          'by the offline notice, so it is announced as unavailable with the reason.',
      },
    },
  },
};
