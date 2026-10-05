import type { StoryObj } from '@storybook/react-webpack5';

import AuthProviderButtons from '@auth/components/form-section/components/auth-provider-buttons';
import createStoryMeta from '@stories/story-meta';

const meta = createStoryMeta({
  title: 'Auth/Components/AuthProviderButtons',
  component: AuthProviderButtons,
  description:
    'The "or continue with" divider and the Google, GitHub, Facebook and Twitter OAuth ' +
    'buttons. Each icon-only button is named "Continue with <provider>" and opens the ' +
    'provider sign-in in a new tab.',
});

export default meta;

export const Default: StoryObj<typeof AuthProviderButtons> = {};
