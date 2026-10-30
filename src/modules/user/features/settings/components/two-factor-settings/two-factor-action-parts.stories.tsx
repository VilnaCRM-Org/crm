import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { noop } from '@stories/story-callbacks';
import { CODES_SETTINGS } from '@stories/two-factor-story-fixtures';

import CancelButton from './cancel-button';
import CodesBlock from './codes-block';
import ConfirmationForm from './confirmation-form';
import OnActions from './on-actions';
import SavedCheckbox from './saved-checkbox';
import StatusHeading from './status-heading';

const meta: Meta<typeof StatusHeading> = {
  title: 'Settings/TwoFactorSettings/Action parts',
  component: StatusHeading,
  tags: ['autodocs'],
  args: { text: 'Двофакторну автентифікацію ввімкнено', icon: true, focus: false },
  argTypes: { text: { control: 'text' }, icon: { control: 'boolean' }, focus: { control: false } },
  parameters: {
    docs: {
      description: {
        component:
          'The recovery code list with its copy button, the saved-codes checkbox, the status ' +
          'heading, the two outlined buttons of the on view and the Скасувати button of the ' +
          'confirmations.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof StatusHeading>;

export const StatusWithIcon: Story = {};

export const StatusWithoutIcon: Story = {
  args: { text: 'Налаштування застаріло. Почніть знову.', icon: false },
};

export const RecoveryCodes: Story = {
  render: () =>
    CODES_SETTINGS.recoveryCodes === null ? (
      <p />
    ) : (
      <CodesBlock codes={CODES_SETTINGS.recoveryCodes} />
    ),
};

export const SavedAcknowledgement: Story = {
  render: () => <SavedCheckbox checked={false} onChange={noop} />,
};

export const Cancel: Story = { render: () => <CancelButton onCancel={noop} /> };

export const OnButtons: Story = {
  render: () => <OnActions onDisable={noop} onRegenerate={noop} returnTo={null} />,
};

export const ConfirmationShell: Story = {
  render: () => (
    <ConfirmationForm
      form={{
        onSubmit: noop,
        defaultValues: {},
        title: 'Створити нові резервні коди',
        subtitle: 'Старі резервні коди перестануть діяти. Продовжити?',
        submitLabel: 'Створити коди',
        submittingLabel: 'Створюємо…',
      }}
      isSubmitting={false}
      footer={<CancelButton onCancel={noop} />}
    >
      {null}
    </ConfirmationForm>
  ),
};
