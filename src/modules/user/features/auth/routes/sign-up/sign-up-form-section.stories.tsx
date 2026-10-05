import type { StoryObj } from '@storybook/react-webpack5';

import { withMemoryRouter } from '@stories/router-decorators';
import createStoryMeta from '@stories/story-meta';

import SignUpFormSection from './sign-up-form-section';

const meta = createStoryMeta({
  title: 'Auth/Pages/SignUpFormSection',
  component: SignUpFormSection,
  decorators: [withMemoryRouter('/sign-up')],
  description:
    'The lazily loaded body of /sign-up: AuthFormSection with RegistrationForm, the ' +
    'OAuth buttons (inert while a result is shown) and the switcher to /sign-in.',
});

export default meta;

export const Default: StoryObj<typeof SignUpFormSection> = {};
