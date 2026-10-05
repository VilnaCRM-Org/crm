import type { StoryObj } from '@storybook/react-webpack5';

import { withMemoryRouter } from '@stories/router-decorators';
import createStoryMeta from '@stories/story-meta';

import SignInFormSection from './sign-in-form-section';

const meta = createStoryMeta({
  title: 'Auth/Pages/SignInFormSection',
  component: SignInFormSection,
  decorators: [withMemoryRouter('/sign-in')],
  description:
    'The lazily loaded body of /sign-in: AuthFormSection with LoginForm, the OAuth ' +
    'buttons and the switcher to /sign-up.',
});

export default meta;

export const Default: StoryObj<typeof SignInFormSection> = {};
