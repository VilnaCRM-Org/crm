import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import { withFormProvider } from '@stories/form-decorators';
import {
  loadedProfile,
  STORY_USER,
  withProfileProvider,
} from '@stories/profile-provider-decorators';
import { noop } from '@stories/story-callbacks';

import useProfileFormModel from '../../hooks/use-profile-form-model';
import type { ProfileSectionFieldsProps } from '../../types/components/profile-form';
import type { ProfileEditContext } from '../../types/hooks/use-profile-save';
import type { ProfileFormValues } from '../../types/user-profile/profile-form-values';

import SectionFields from './section-fields';

const SAVED_VALUES: ProfileFormValues = {
  fullName: STORY_USER.fullName,
  email: STORY_USER.email,
  fullNamePassword: '',
  emailPassword: '',
  currentPassword: '',
  newPassword: '',
};

function SectionFieldsFrame({
  section,
  user,
}: Pick<ProfileEditContext, 'user'> & Pick<ProfileSectionFieldsProps, 'section'>): JSX.Element {
  const context = {
    user,
    adoption: {
      adopt: noop,
      confirm: noop,
      isCurrent: (): boolean => true,
      revision: (): number => 0,
    },
    toasts: { toasts: { items: [] }, announcement: '', alert: '', show: noop, dismiss: noop },
    saveRef: { current: null },
  };
  const { save, rules } = useProfileFormModel(context, section);

  return (
    <SectionFields context={context} section={section} rules={rules} save={save} onChange={noop} />
  );
}

const meta: Meta<typeof SectionFieldsFrame> = {
  title: 'Settings/SectionFields',
  component: SectionFieldsFrame,
  tags: ['autodocs'],
  decorators: [withProfileProvider(loadedProfile())],
  args: { section: 'fullName', user: STORY_USER },
  parameters: {
    docs: {
      description: {
        component:
          'The fields of one profile form. The name and e-mail sections show their text field ' +
          'and, once it differs from the saved value, a password field of their own, so no two ' +
          'forms share an input id. The password section renders the current and new password ' +
          'pair with its rule list.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof SectionFieldsFrame>;

export const NameAtRest: Story = { decorators: [withFormProvider(SAVED_VALUES)] };

export const NameRevealed: Story = {
  decorators: [withFormProvider({ ...SAVED_VALUES, fullName: 'Олена Коваль' })],
};

export const EmailAtRest: Story = {
  args: { section: 'email' },
  decorators: [withFormProvider(SAVED_VALUES)],
};

export const EmailRevealed: Story = {
  args: { section: 'email' },
  decorators: [withFormProvider({ ...SAVED_VALUES, email: 'olena.koval@example.com' })],
};

export const EmailUnconfirmed: Story = {
  args: { section: 'email', user: { ...STORY_USER, confirmed: false } },
  decorators: [withFormProvider(SAVED_VALUES)],
};

export const Password: Story = {
  args: { section: 'password' },
  decorators: [withFormProvider(SAVED_VALUES)],
};
