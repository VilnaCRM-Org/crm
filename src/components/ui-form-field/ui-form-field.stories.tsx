import type { Decorator, Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import { withFormProvider } from '@stories/form-decorators';

import UIFormField from './index';

const REQUIRED_RULES = { required: 'Вкажіть електронну пошту' };
const HINT_ID = 'email-hint';

const withHint: Decorator = (Story): JSX.Element => (
  <>
    <Story />
    <p id={HINT_ID}>Ми надішлемо посилання на цю адресу</p>
  </>
);

const meta: Meta<typeof UIFormField> = {
  title: 'Components/Inputs/UIFormField',
  component: UIFormField,
  tags: ['autodocs'],
  args: {
    name: 'email',
    type: 'email',
    autoComplete: 'email',
    label: 'E-mail',
    placeholder: 'vilnaCRM@gmail.com',
    rules: REQUIRED_RULES,
  },
  argTypes: {
    name: { control: false },
    rules: { control: false },
    inputProps: { control: false },
    defaultValue: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A labelled form field: a `<label htmlFor>` paired with the controlled ' +
          'UIFormInputField through the field `name`, reading the form from react-hook-form ' +
          'context. Validation runs once the field has been touched.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UIFormField>;

export const Default: Story = {
  decorators: [withFormProvider({ email: '' })],
};

export const ValidationError: Story = {
  decorators: [withFormProvider({ email: '' }, { validateOnMount: true })],
};

export const DescribedBy: Story = {
  args: { describedBy: HINT_ID },
  decorators: [withHint, withFormProvider({ email: '' })],
  parameters: {
    docs: {
      description: {
        story:
          'With `describedBy` the input points `aria-describedby` at the hint rendered beside ' +
          'it; once the field is invalid the error helper text is appended to the same list.',
      },
    },
  },
};
